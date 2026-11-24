-- ============================================================================
-- AUTONOMOUS SSoT — SANITIZED T1-T10 GOVERNANCE SCHEMA, RPCS & MOCK SEED DATA
-- ============================================================================

-- T1: Master Document Registry & Dual-Root Taxonomy
create table if not exists public.ssot_t1_registry (
  doc_id text primary key,
  title text not null,
  tree_layer text not null check (tree_layer in ('PUBLIC', 'STAGING', 'ARCHIVE', 'INTERNAL')),
  market_code text not null,
  folder_path text not null,
  status text not null default 'VERIFIED',
  owner_role text not null default 'SME-EMEA',
  age_days int not null default 1,
  content_summary text not null,
  updated_at timestamptz not null default now()
);

-- T2: Lifecycle & SLA State Transitions
create table if not exists public.ssot_t2_lifecycle (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  from_layer text not null,
  to_layer text not null,
  workflow text not null,
  gateway text not null default 'SSOT_UI',
  ack_ms int not null default 310,
  created_at timestamptz not null default now()
);

-- T3: Container Access Control (6-Tier RBAC Inheritance)
create table if not exists public.ssot_t3_containers (
  container_id text primary key,
  tree_layer text not null,
  path_prefix text not null,
  min_read_tier int not null,
  min_write_tier int not null,
  inherit_enforced boolean not null default true
);

-- T4: Freshness & 30-Day TTL Audit Log
create table if not exists public.ssot_t4_freshness (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  age_days int not null,
  ttl_limit_days int not null default 30,
  is_stale boolean not null default false,
  checked_at timestamptz not null default now()
);

-- T5: Fault Queue & 4-Tier Self-Healing Loop
create table if not exists public.ssot_t5_faults (
  fault_id text primary key,
  fault_code text not null,
  severity text not null check (severity in ('P1', 'P2', 'P3', 'P4')),
  doc_id text not null,
  auto_tier text not null,
  status text not null default 'OPEN',
  resolution_note text,
  detected_at timestamptz not null default now()
);

-- T6: Autonomous Bot & Natural Language Command Log
create table if not exists public.ssot_t6_bot_log (
  id uuid primary key default gen_random_uuid(),
  source_gateway text not null,
  raw_prompt text not null,
  resolved_intent text not null,
  target_ref text,
  ack_ms int not null default 350,
  outcome text not null,
  created_at timestamptz not null default now()
);

-- T7: KPI & Health Score Snapshots
create table if not exists public.ssot_t7_kpis (
  id int primary key check (id = 1),
  health_score numeric(5,2) not null default 91.40,
  total_markets int not null default 45,
  api_savings_pct numeric(5,2) not null default 98.00,
  updated_at timestamptz not null default now()
);

-- T8: Station 7 SME Audit Rubric
create table if not exists public.ssot_t8_rubric (
  criterion_id text primary key,
  label text not null,
  weight int not null,
  active boolean not null default true
);

-- T9: Agent Satisfaction & Field Feedback
create table if not exists public.ssot_t9_feedback (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  rating int not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

-- T10: Append-Only Archive Kill-Switch Ledger
create table if not exists public.ssot_t10_archive (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  original_path text not null,
  reason text not null,
  archived_by text not null,
  archived_at timestamptz not null default now()
);

-- ============================================================================
-- ATOMIC RPC FUNCTIONS (CALLED BY BALAERION NL BRIDGE & SSOT UI)
-- ============================================================================

-- 1. Move-Then-Confirm Publish (_STAGING -> PUBLIC)
create or replace function public.ssot_publish_doc(
  p_doc_id text,
  p_target_folder text default 'EMEA / Benelux (NL & BE) / 01-Campaign-Architecture',
  p_gateway text default 'BALAERION_NL'
)
returns jsonb
language plpgsql security definer as $$
declare
  v_doc public.ssot_t1_registry;
begin
  select * into v_doc from public.ssot_t1_registry where doc_id = p_doc_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', format('Document %s not found in T1 Registry.', p_doc_id));
  end if;

  update public.ssot_t1_registry
     set tree_layer = 'PUBLIC',
         folder_path = p_target_folder,
         status = 'VERIFIED',
         age_days = 0,
         updated_at = now()
   where doc_id = p_doc_id;

  insert into public.ssot_t2_lifecycle (doc_id, from_layer, to_layer, workflow, gateway, ack_ms)
  values (p_doc_id, v_doc.tree_layer, 'PUBLIC', 'MOVE_THEN_CONFIRM', p_gateway, 340);

  update public.ssot_t7_kpis set health_score = least(99.5, health_score + 0.4), updated_at = now() where id = 1;

  return jsonb_build_object(
    'ok', true,
    'workflow', 'MOVE_THEN_CONFIRM',
    'doc_id', p_doc_id,
    'from_layer', v_doc.tree_layer,
    'to_layer', 'PUBLIC',
    'target_folder', p_target_folder
  );
end;
$$;

-- 2. 30-Day Archive Kill-Switch Sweep (age_days > 30 -> _ARCHIVE)
create or replace function public.ssot_archive_sweep(
  p_gateway text default 'BALAERION_NL'
)
returns jsonb
language plpgsql security definer as $$
declare
  r record;
  v_count int := 0;
  v_ids text[] := '{}';
begin
  for r in
    select * from public.ssot_t1_registry
     where tree_layer in ('PUBLIC', 'STAGING') and age_days > 30
     for update
  loop
    update public.ssot_t1_registry
       set tree_layer = 'ARCHIVE',
           folder_path = '_ARCHIVE / Auto-Quarantined-Nodes',
           status = 'ARCHIVED_30D_TTL',
           updated_at = now()
     where doc_id = r.doc_id;

    insert into public.ssot_t10_archive (doc_id, original_path, reason, archived_by)
    values (r.doc_id, r.folder_path, format('Exceeded 30-day TTL (%s days unverified)', r.age_days), p_gateway);

    insert into public.ssot_t2_lifecycle (doc_id, from_layer, to_layer, workflow, gateway, ack_ms)
    values (r.doc_id, r.tree_layer, 'ARCHIVE', '30_DAY_KILL_SWITCH', p_gateway, 390);

    v_count := v_count + 1;
    v_ids := array_append(v_ids, r.doc_id);
  end loop;

  update public.ssot_t7_kpis set health_score = least(99.5, health_score + (v_count * 0.5)), updated_at = now() where id = 1;

  return jsonb_build_object(
    'ok', true,
    'workflow', '30_DAY_KILL_SWITCH',
    'archived_count', v_count,
    'archived_docs', v_ids
  );
end;
$$;

-- 3. Create New Draft in _STAGING
create or replace function public.ssot_create_draft(
  p_doc_id text,
  p_title text,
  p_market text default 'EMEA',
  p_summary text default 'Draft staged via Balaerion Natural Language Bridge.',
  p_gateway text default 'BALAERION_NL'
)
returns jsonb
language plpgsql security definer as $$
begin
  insert into public.ssot_t1_registry (doc_id, title, tree_layer, market_code, folder_path, status, owner_role, age_days, content_summary)
  values (
    p_doc_id,
    p_title,
    'STAGING',
    p_market,
    format('_STAGING / %s / Pending-Station-7-Audit', p_market),
    'AWAITING_AUDIT',
    'SME-' || p_market,
    0,
    p_summary
  )
  on conflict (doc_id) do update
    set title = excluded.title,
        content_summary = excluded.content_summary,
        status = 'AWAITING_AUDIT',
        updated_at = now();

  insert into public.ssot_t2_lifecycle (doc_id, from_layer, to_layer, workflow, gateway, ack_ms)
  values (p_doc_id, 'NEW', 'STAGING', 'STAGE_DRAFT', p_gateway, 280);

  return jsonb_build_object('ok', true, 'workflow', 'STAGE_DRAFT', 'doc_id', p_doc_id, 'tree_layer', 'STAGING');
end;
$$;

-- 4. 4-Tier Self-Healing Loop for Open Faults
create or replace function public.ssot_heal_faults(
  p_gateway text default 'BALAERION_NL'
)
returns jsonb
language plpgsql security definer as $$
declare
  v_healed int;
begin
  with healed as (
    update public.ssot_t5_faults
       set status = 'RESOLVED',
           resolution_note = format('Auto-repaired via 4-Tier Self-Healing Loop (%s)', p_gateway)
     where status = 'OPEN'
     returning fault_id
  )
  select count(*) into v_healed from healed;

  update public.ssot_t7_kpis set health_score = least(99.8, health_score + 0.6), updated_at = now() where id = 1;

  return jsonb_build_object('ok', true, 'workflow', 'SELF_HEALING_LOOP', 'healed_faults', v_healed);
end;
$$;

-- ============================================================================
-- SANITIZED MOCK SEED DATA (IDEMPOTENT)
-- ============================================================================

insert into public.ssot_t7_kpis (id, health_score, total_markets, api_savings_pct)
values (1, 91.40, 45, 98.00)
on conflict (id) do nothing;

insert into public.ssot_t3_containers (container_id, tree_layer, path_prefix, min_read_tier, min_write_tier) values
  ('CNT-PUB-01', 'PUBLIC', 'PUBLIC / *', 1, 5),
  ('CNT-STG-01', 'STAGING', '_STAGING / *', 3, 3),
  ('CNT-ARC-01', 'ARCHIVE', '_ARCHIVE / *', 5, 6),
  ('CNT-INT-01', 'INTERNAL', 'INTERNAL / *', 4, 5)
on conflict (container_id) do nothing;

insert into public.ssot_t8_rubric (criterion_id, label, weight) values
  ('CRIT-01', 'Primary Source Citation Attached in T1 Registry', 35),
  ('CRIT-02', 'Explicit Market & Territory Scope Bounded', 25),
  ('CRIT-03', 'Zero Unverified Absolute SLA or Pricing Claims', 25),
  ('CRIT-04', 'Container ACL Inheritance Verified', 15)
on conflict (criterion_id) do nothing;

insert into public.ssot_t1_registry (doc_id, title, tree_layer, market_code, folder_path, status, owner_role, age_days, content_summary) values
  ('DOC-NLBE-101', 'Omnichannel_Activation_Playbook_v3.md', 'PUBLIC', 'NL/BE', 'EMEA / Benelux (NL & BE) / 01-Campaign-Architecture', 'VERIFIED', 'SME-NLBE', 6, 'Full-funnel omnichannel GTM activation matrix for Benelux retail and B2B accounts.'),
  ('DOC-NLBE-104', 'Market_Compliance_Guardrails_2026.md', 'PUBLIC', 'NL/BE', 'EMEA / Benelux (NL & BE) / 01-Campaign-Architecture', 'VERIFIED', 'SME-NLBE', 11, 'Regional regulatory and GDPR Art. 15/17/35 guardrails for NL and BE outbound workflows.'),
  ('DOC-DACH-208', 'SLA_Escalation_Matrix_Tier1.md', 'PUBLIC', 'DACH', 'EMEA / DACH & Nordics / 02-Lifecycle-Operations', 'VERIFIED', 'SME-DACH', 14, '24-hour Tier-1 response SLA and handover escalation routing for DACH enterprise accounts.'),
  ('DOC-NORD-219', 'Legacy_Q2_Onboarding_Checklist.md', 'PUBLIC', 'NORD', 'EMEA / DACH & Nordics / 02-Lifecycle-Operations', 'STALE (>30d)', 'SME-NORD', 34, 'Superseded Q2 onboarding sequence flagged for 30-day archive kill-switch.'),
  ('DOC-LATAM-302', 'Retail_Conversion_Benchmarks.md', 'PUBLIC', 'LATAM', 'LATAM & MENA / 03-Vertical-Benchmarks', 'VERIFIED', 'SME-LATAM', 9, 'Regional conversion benchmarks and localized messaging cadences for LATAM.'),
  ('DOC-MENA-309', 'Regional_Holiday_Cadence_Guide.md', 'PUBLIC', 'MENA', 'LATAM & MENA / 03-Vertical-Benchmarks', 'STALE (>30d)', 'SME-MENA', 38, 'Expired seasonal outreach calendar awaiting archive sweep.'),
  ('DOC-EMEA-042', 'EMEA_SLA_Response_Standard_Draft.md', 'STAGING', 'EMEA', '_STAGING / EMEA / Pending-Station-7-Audit', 'AWAITING_AUDIT', 'SME-EMEA', 1, 'Standard SLA response window is 24 hours across EMEA Tier-1 markets.'),
  ('DOC-ARC-089', 'Deprecated_2025_Rate_Card.md', 'ARCHIVE', 'GLOBAL', '_ARCHIVE / Auto-Quarantined-Nodes', 'ARCHIVED_30D_TTL', 'BOT-SWEEPER', 47, 'Automatically quarantined after exceeding 30-day freshness window.'),
  ('INT-001', '7_Station_Harness_Runbook.md', 'INTERNAL', 'OPS', 'INTERNAL / 01-Governance-and-SOPs', 'VERIFIED', 'SYS-ADMIN', 4, 'Anti-hallucination verification protocol requiring isolated Station 7 audit.'),
  ('INT-009', 'Incident_Response_P1_P4_Playbook.md', 'INTERNAL', 'OPS', 'INTERNAL / 01-Governance-and-SOPs', 'VERIFIED', 'SYS-ADMIN', 8, 'Four-tier self-healing remediation runbook for 29 cataloged fault types.')
on conflict (doc_id) do nothing;

insert into public.ssot_t5_faults (fault_id, fault_code, severity, doc_id, auto_tier, status, resolution_note) values
  ('FLT-104', 'F-14_ACL_DRIFT', 'P2', 'DOC-LATAM-302', 'Tier 1 Auto-Repair', 'OPEN', 'Per-file override detected; queued for container ACL inheritance reset.'),
  ('FLT-109', 'F-22_TTL_OVERDUE', 'P3', 'DOC-NORD-219', 'Tier 1 Auto-Repair', 'OPEN', 'Document age 34d exceeds 30d TTL threshold.')
on conflict (fault_id) do nothing;

insert into public.ssot_t9_feedback (doc_id, rating, note) values
  ('DOC-NLBE-101', 5, 'Cut Benelux campaign prep time by 40% during onboarding.'),
  ('DOC-DACH-208', 5, 'Clear escalation matrix; zero handover ambiguity.')
on conflict do nothing;

-- RLS Policies (Public Read for Portfolio Demo; Mutations via Service Role RPCs)
alter table public.ssot_t1_registry enable row level security;
alter table public.ssot_t2_lifecycle enable row level security;
alter table public.ssot_t3_containers enable row level security;
alter table public.ssot_t4_freshness enable row level security;
alter table public.ssot_t5_faults enable row level security;
alter table public.ssot_t6_bot_log enable row level security;
alter table public.ssot_t7_kpis enable row level security;
alter table public.ssot_t8_rubric enable row level security;
alter table public.ssot_t9_feedback enable row level security;
alter table public.ssot_t10_archive enable row level security;

create policy "Public read ssot_t1" on public.ssot_t1_registry for select using (true);
create policy "Public read ssot_t2" on public.ssot_t2_lifecycle for select using (true);
create policy "Public read ssot_t3" on public.ssot_t3_containers for select using (true);
create policy "Public read ssot_t5" on public.ssot_t5_faults for select using (true);
create policy "Public read ssot_t6" on public.ssot_t6_bot_log for select using (true);
create policy "Public read ssot_t7" on public.ssot_t7_kpis for select using (true);
create policy "Public read ssot_t8" on public.ssot_t8_rubric for select using (true);
create policy "Public read ssot_t10" on public.ssot_t10_archive for select using (true);
