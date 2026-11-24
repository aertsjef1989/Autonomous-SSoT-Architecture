-- ============================================================================
-- SYNDICATE MATCHDAY AI — SUPABASE SCHEMA, RLS, NAV LEDGER & PRE-KICKOFF LOCK
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. RBAC PROFILES
create type public.syndicate_role as enum ('admin', 'member', 'observer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.syndicate_role not null default 'member',
  created_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.syndicate_role
language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. FIXTURES & POISSON / xG ANALYTICS (Public Read-Only for /embed)
create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  competition text not null default 'UEFA Champions League',
  matchday int not null,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  status text not null default 'SCHEDULED',
  created_at timestamptz not null default now()
);

create table public.match_analytics (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null unique references public.fixtures(id) on delete cascade,
  lambda_home numeric(5,2) not null,
  lambda_away numeric(5,2) not null,
  prob_home numeric(5,2) not null,
  prob_draw numeric(5,2) not null,
  prob_away numeric(5,2) not null,
  over_05 numeric(5,2) not null,
  over_15 numeric(5,2) not null,
  over_25 numeric(5,2) not null,
  over_35 numeric(5,2) not null,
  over_45 numeric(5,2) not null,
  btts_yes numeric(5,2) not null,
  ai_bias_audit text,
  updated_at timestamptz not null default now()
);

-- 3. DEMOCRATIC SLIP VOTING & HARD PRE-KICKOFF LOCK
create type public.slip_status as enum ('OPEN', 'LOCKED', 'WON', 'LOST', 'VOID');

create table public.slips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  proposed_by uuid not null references public.profiles(id),
  stake_eur numeric(12,2) not null check (stake_eur > 0),
  combined_odds numeric(8,3) not null check (combined_odds >= 1.01),
  selections jsonb not null,
  lock_at timestamptz not null,
  status public.slip_status not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table public.slip_votes (
  id uuid primary key default gen_random_uuid(),
  slip_id uuid not null references public.slips(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  approve boolean not null,
  voted_at timestamptz not null default now(),
  unique (slip_id, member_id)
);

-- Server-side trigger: blocks any vote or slip selection edit past lock_at
create or replace function public.enforce_pre_kickoff_lock()
returns trigger language plpgsql as $$
declare
  v_lock_at timestamptz;
  v_status public.slip_status;
begin
  if tg_table_name = 'slip_votes' then
    select lock_at, status into v_lock_at, v_status from public.slips where id = new.slip_id;
    if now() >= v_lock_at or v_status <> 'OPEN' then
      raise exception 'PRE_KICKOFF_LOCK: Voting closed at %', v_lock_at;
    end if;
  elsif tg_table_name = 'slips' then
    if (old.selections is distinct from new.selections or old.stake_eur is distinct from new.stake_eur)
       and (now() >= old.lock_at or old.status <> 'OPEN') then
      raise exception 'PRE_KICKOFF_LOCK: Slip selections and stake are frozen after %', old.lock_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_lock_slip_votes
  before insert or update on public.slip_votes
  for each row execute function public.enforce_pre_kickoff_lock();

create trigger trg_lock_slips
  before update on public.slips
  for each row execute function public.enforce_pre_kickoff_lock();

-- 4. APPEND-ONLY UNIT-SHARE NAV LEDGER
create type public.nav_tx_type as enum ('DEPOSIT', 'REDEEM', 'SLIP_WIN', 'SLIP_LOSS');

create table public.pool_state (
  id int primary key check (id = 1),
  total_cash_eur numeric(14,2) not null default 0,
  total_units numeric(18,6) not null default 0,
  nav_per_unit numeric(14,6) not null default 10.000000,
  updated_at timestamptz not null default now()
);

insert into public.pool_state (id, total_cash_eur, total_units, nav_per_unit)
values (1, 0, 0, 10.000000)
on conflict (id) do nothing;

create table public.nav_ledger (
  id uuid primary key default gen_random_uuid(),
  tx_type public.nav_tx_type not null,
  member_id uuid references public.profiles(id),
  slip_id uuid references public.slips(id),
  cash_delta_eur numeric(14,2) not null,
  units_delta numeric(18,6) not null default 0,
  nav_after numeric(14,6) not null,
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Enforce append-only immutability on nav_ledger
create or replace function public.block_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'APPEND_ONLY_VIOLATION: nav_ledger rows cannot be updated or deleted.';
end;
$$;

create trigger trg_nav_ledger_immutable
  before update or delete on public.nav_ledger
  for each row execute function public.block_ledger_mutation();

-- Atomic NAV transaction RPC (Admin only)
create or replace function public.record_nav_transaction(
  p_tx_type public.nav_tx_type,
  p_cash_delta numeric,
  p_member_id uuid default null,
  p_slip_id uuid default null,
  p_note text default null
)
returns public.nav_ledger
language plpgsql security definer as $$
declare
  v_pool public.pool_state;
  v_units_delta numeric(18,6) := 0;
  v_new_cash numeric(14,2);
  v_new_units numeric(18,6);
  v_new_nav numeric(14,6);
  v_row public.nav_ledger;
begin
  if public.current_role() <> 'admin' then
    raise exception 'FORBIDDEN: Only syndicate admins can post NAV transactions.';
  end if;

  select * into v_pool from public.pool_state where id = 1 for update;

  if p_tx_type = 'DEPOSIT' then
    if p_cash_delta <= 0 or p_member_id is null then
      raise exception 'DEPOSIT requires positive cash_delta and member_id.';
    end if;
    v_units_delta := round(p_cash_delta / v_pool.nav_per_unit, 6);
    v_new_cash := v_pool.total_cash_eur + p_cash_delta;
    v_new_units := v_pool.total_units + v_units_delta;
    v_new_nav := v_pool.nav_per_unit;

  elsif p_tx_type = 'REDEEM' then
    if p_cash_delta >= 0 or p_member_id is null then
      raise exception 'REDEEM requires negative cash_delta and member_id.';
    end if;
    v_units_delta := round(p_cash_delta / v_pool.nav_per_unit, 6);
    v_new_cash := v_pool.total_cash_eur + p_cash_delta;
    v_new_units := v_pool.total_units + v_units_delta;
    if v_new_cash < 0 or v_new_units < 0 then
      raise exception 'INSUFFICIENT_POOL_FUNDS';
    end if;
    v_new_nav := case when v_new_units = 0 then 10.000000 else v_pool.nav_per_unit end;

  else
    -- SLIP_WIN or SLIP_LOSS changes pool cash without minting/burning units
    v_new_cash := v_pool.total_cash_eur + p_cash_delta;
    if v_new_cash < 0 then
      raise exception 'POOL_NEGATIVE_BALANCE';
    end if;
    v_new_units := v_pool.total_units;
    v_new_nav := case when v_new_units = 0 then 10.000000 else round(v_new_cash / v_new_units, 6) end;
  end if;

  update public.pool_state
     set total_cash_eur = v_new_cash,
         total_units = v_new_units,
         nav_per_unit = v_new_nav,
         updated_at = now()
   where id = 1;

  insert into public.nav_ledger (tx_type, member_id, slip_id, cash_delta_eur, units_delta, nav_after, note, created_by)
  values (p_tx_type, p_member_id, p_slip_id, p_cash_delta, v_units_delta, v_new_nav, p_note, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.fixtures enable row level security;
alter table public.match_analytics enable row level security;
alter table public.slips enable row level security;
alter table public.slip_votes enable row level security;
alter table public.pool_state enable row level security;
alter table public.nav_ledger enable row level security;

-- Public read-only for matchday analytics (/syndicate/embed)
create policy "Public read fixtures" on public.fixtures for select using (true);
create policy "Public read analytics" on public.match_analytics for select using (true);

-- Authenticated syndicate members only for private state
create policy "Members read profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Members read slips" on public.slips for select using (auth.role() = 'authenticated');
create policy "Members propose slips" on public.slips for insert with check (public.current_role() in ('admin', 'member'));
create policy "Admins settle slips" on public.slips for update using (public.current_role() = 'admin');

create policy "Members read votes" on public.slip_votes for select using (auth.role() = 'authenticated');
create policy "Members cast own vote" on public.slip_votes for insert with check (auth.uid() = member_id and public.current_role() in ('admin', 'member'));
create policy "Members update own vote" on public.slip_votes for update using (auth.uid() = member_id and public.current_role() in ('admin', 'member'));

create policy "Members read pool_state" on public.pool_state for select using (auth.role() = 'authenticated');
create policy "Members read nav_ledger" on public.nav_ledger for select using (auth.role() = 'authenticated');
