-- ============================================================================
-- 1. PILLAR I: AUTONOMOUS SSoT - DRIVE-BACKED CORPUS & GOVERNANCE GATES
-- ============================================================================

-- Live Drive-synced SSoT Corpus (Addendum Section 2.A: Drive -> Memory -> Supabase -> Vercel)
-- RLS enabled below with ZERO anonymous public read policies (server-side service_role only).
CREATE TABLE IF NOT EXISTS ssot_documents (
  doc_id TEXT PRIMARY KEY CHECK (char_length(trim(doc_id)) >= 3),
  drive_file_id TEXT UNIQUE NOT NULL CHECK (char_length(trim(drive_file_id)) >= 4),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  market TEXT NOT NULL CHECK (market IN ('NL', 'BE', 'FR', 'GLOBAL')),
  category TEXT NOT NULL CHECK (char_length(trim(category)) >= 2),
  content_md TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'REVIEW_DUE', 'DRAFT')),
  drive_modified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fts TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(doc_id, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content_md, '')), 'C')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_ssot_documents_market_category ON ssot_documents (market, category);
CREATE INDEX IF NOT EXISTS idx_ssot_documents_fts ON ssot_documents USING gin (fts);

CREATE EXTENSION IF NOT EXISTS vector;

-- Chunked Hybrid SSoT Retrieval Table (tsvector + optional 1024-dim BGE-M3 / Cohere v3 embeddings)
-- RLS enabled below with ZERO public/anon policies (accessed strictly via server-side service_role).
CREATE TABLE IF NOT EXISTS ssot_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id TEXT NOT NULL REFERENCES ssot_documents(doc_id) ON DELETE CASCADE,
  chunk_index INT NOT NULL CHECK (chunk_index >= 0),
  title TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('NL', 'BE', 'FR', 'GLOBAL')),
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VERIFIED',
  chunk_text TEXT NOT NULL,
  embedding vector(1024),
  fts TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(doc_id, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(chunk_text, '')), 'B')
  ) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doc_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_ssot_chunks_market ON ssot_chunks (market);
CREATE INDEX IF NOT EXISTS idx_ssot_chunks_fts ON ssot_chunks USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_ssot_chunks_hnsw ON ssot_chunks USING hnsw (embedding vector_cosine_ops);
ALTER TABLE ssot_chunks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION search_ssot_hybrid(
  p_query TEXT,
  p_markets TEXT[] DEFAULT ARRAY['GLOBAL', 'NL', 'BE', 'FR'],
  p_embedding vector(1024) DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  doc_id TEXT,
  title TEXT,
  market TEXT,
  category TEXT,
  status TEXT,
  chunk_text TEXT,
  score FLOAT
)
LANGUAGE sql STABLE AS $$
  WITH q AS (
    SELECT websearch_to_tsquery('simple', coalesce(nullif(trim(p_query), ''), 'governance')) AS tsq
  )
  SELECT
    sc.doc_id,
    sc.title,
    sc.market,
    sc.category,
    sc.status,
    sc.chunk_text,
    (
      ts_rank_cd(sc.fts, q.tsq) * 0.65 +
      CASE
        WHEN p_embedding IS NOT NULL AND sc.embedding IS NOT NULL
          THEN GREATEST(0.0, 1.0 - (sc.embedding <=> p_embedding)) * 0.65
        ELSE 0.0
      END
    )::FLOAT AS score
  FROM ssot_chunks sc
  CROSS JOIN q
  WHERE sc.market = ANY(p_markets)
    AND (
      sc.fts @@ q.tsq
      OR (p_embedding IS NOT NULL AND sc.embedding IS NOT NULL)
    )
  ORDER BY score DESC, sc.updated_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 12));
$$;

-- Governance Approval & Cadence Reference Ledger (BR-02, FR-C01, FR-11, FR-36)
CREATE TYPE ssot_doc_status AS ENUM ('draft', 'pending_approval', 'published', 'archived');

CREATE TABLE IF NOT EXISTS ssot_governance_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  -- BR-02: Zero unowned files permitted
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  -- FR-C03: Explicit market scope required
  market_code TEXT NOT NULL CHECK (char_length(trim(market_code)) >= 2),
  -- FR-37: Verified node parentage required before publish
  parent_node_id UUID NOT NULL,
  status ssot_doc_status NOT NULL DEFAULT 'draft',
  -- FR-C01: Approval metadata
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- BR-09 / FR-11 / FR-36: Verification cadence
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cadence_days INT NOT NULL DEFAULT 30 CHECK (cadence_days > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FR-C01 & FR-37 Enforcement Trigger: Block publish without approval
CREATE OR REPLACE FUNCTION enforce_ssot_publish_gates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.approved_by IS NULL OR NEW.approved_at IS NULL THEN
      RAISE EXCEPTION 'FR-C01 VIOLATION: Cannot publish SSoT document without explicit human approval (approved_by & approved_at required).';
    END IF;
    IF NEW.owner_id IS NULL THEN
      RAISE EXCEPTION 'BR-02 VIOLATION: Zero unowned files permitted.';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ssot_publish_gates ON ssot_governance_nodes;
CREATE TRIGGER trg_ssot_publish_gates
  BEFORE INSERT OR UPDATE ON ssot_governance_nodes
  FOR EACH ROW EXECUTE FUNCTION enforce_ssot_publish_gates();

-- FR-11 & FR-36 View: Automatic Escalation & Staleness Flag
CREATE OR REPLACE VIEW ssot_nodes_with_staleness AS
SELECT
  *,
  EXTRACT(DAY FROM (now() - last_verified_at))::INT AS days_since_verified,
  (now() > last_verified_at + make_interval(days => cadence_days)) AS is_stale,
  CASE
    WHEN now() >= last_verified_at + interval '30 days' THEN 'DAY_30_AUTO_ARCHIVE'
    WHEN now() >= last_verified_at + interval '14 days' THEN 'DAY_14_ESCALATE'
    ELSE 'DAY_0_CURRENT'
  END AS escalation_stage
FROM ssot_governance_nodes;

-- ============================================================================
-- 2. PILLAR II: BALAERION V1 - GENERAL AI + PROSPECTHUB STATEFUL WORKSPACE
-- ============================================================================

-- Mode A: Everyday General AI Threads
CREATE TABLE IF NOT EXISTS general_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model_provider TEXT NOT NULL DEFAULT 'groq',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS general_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES general_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  lane TEXT NOT NULL DEFAULT 'general' CHECK (lane = 'general'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mode B: ProspectHub 7-State Human-in-the-Loop Workspace
CREATE TYPE prospect_state AS ENUM (
  'Cold',
  'Auto-replied',
  'Agent-contacted',
  'Discovery-booked',
  'Post-discovery',
  'In-nurture',
  'Dormant'
);

CREATE TABLE IF NOT EXISTS prospect_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  registry_id TEXT,
  country_code TEXT NOT NULL CHECK (char_length(country_code) = 2),
  readiness_score NUMERIC(3,1) CHECK (readiness_score >= 0 AND readiness_score <= 10),
  lifecycle_state prospect_state NOT NULL DEFAULT 'Cold',
  last_actor_type TEXT NOT NULL DEFAULT 'human' CHECK (last_actor_type IN ('human', 'ai')),
  osint_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, domain)
);

-- Immutable Audit Log (GDPR Art. 17 Cascade Delete enabled)
CREATE TABLE IF NOT EXISTS prospect_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES prospect_workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_type TEXT NOT NULL CHECK (actor_type = 'human'),
  previous_state prospect_state,
  new_state prospect_state NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Human-in-the-Loop Enforcement Trigger: Block AI from changing lifecycle_state
CREATE OR REPLACE FUNCTION enforce_human_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle_state IS DISTINCT FROM OLD.lifecycle_state THEN
    IF NEW.last_actor_type <> 'human' THEN
      RAISE EXCEPTION 'HUMAN-IN-THE-LOOP VIOLATION: AI cannot automatically transition prospect_state. Human approval required.';
    END IF;
    INSERT INTO prospect_events (workspace_id, actor_id, actor_type, previous_state, new_state, note)
    VALUES (NEW.id, NEW.user_id, 'human', OLD.lifecycle_state, NEW.lifecycle_state, 'Manual state transition');
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_human_state_transition ON prospect_workspaces;
CREATE TRIGGER trg_human_state_transition
  BEFORE UPDATE ON prospect_workspaces
  FOR EACH ROW EXECUTE FUNCTION enforce_human_state_transition();

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (ZERO ANONYMOUS READ ON LIVE SSoT; OWNER ISOLATION)
-- ============================================================================
ALTER TABLE ssot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssot_governance_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_events ENABLE ROW LEVEL SECURITY;

-- Note: ssot_documents intentionally has ZERO anon/authenticated policies (accessed only via server-side service_role behind Owner/Grant gate).
CREATE POLICY "owner_ssot_nodes" ON ssot_governance_nodes FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "owner_threads" ON general_threads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_messages" ON general_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_prospects" ON prospect_workspaces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_events" ON prospect_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM prospect_workspaces pw WHERE pw.id = workspace_id AND pw.user_id = auth.uid())
);

-- ============================================================================
-- 4. PILLAR III: SYNDICATE MATCHDAY AI (xG FIXTURES & NAV POOL LEDGER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS syndicate_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_xg NUMERIC(4,2),
  away_xg NUMERIC(4,2),
  model_edge_pct NUMERIC(5,2),
  slip_status TEXT NOT NULL DEFAULT 'open' CHECK (slip_status IN ('open', 'voted', 'settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS syndicate_pool_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  nav_unit_value NUMERIC(10,4) NOT NULL,
  pool_balance_eur NUMERIC(12,2) NOT NULL,
  note TEXT
);

ALTER TABLE syndicate_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndicate_pool_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_syndicate_fixtures" ON syndicate_fixtures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_syndicate_ledger" ON syndicate_pool_ledger FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 5. VECTOR RAG LAYER (pgvector · EU Safe Lane 1024-dim embeddings)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('ssot', 'prospecthub', 'syndicate')),
  source_id UUID NOT NULL,
  source_title TEXT NOT NULL,
  market_code TEXT,
  is_stale BOOLEAN NOT NULL DEFAULT false,
  chunk_text TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw
  ON knowledge_embeddings USING hnsw (embedding vector_cosine_ops);

ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_embeddings" ON knowledge_embeddings FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1024),
  target_pillar TEXT,
  match_count INT DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  source_title TEXT,
  market_code TEXT,
  is_stale BOOLEAN,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ke.id,
    ke.source_title,
    ke.market_code,
    ke.is_stale,
    ke.chunk_text,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  WHERE ke.pillar = target_pillar
    AND ke.user_id = auth.uid()
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- 6. SECTION E & F: SINGLE-USE GRANTS, ATOMIC BUDGETS & DATA MINIMIZATION (P4)
-- ============================================================================
-- Design invariants:
--   * RLS enabled on every table with ZERO public/anon policies (service_role only).
--   * Zero plaintext emails, zero raw IPs, zero user-agents stored anywhere.
--   * Grants store a 16-byte per-row salt + HMAC-SHA256(pepper, salt || code) keyed by public kid.
--   * Token & call budgets are reserved atomically BEFORE upstream LLM calls.
--   * pg_cron purges expired privacy state hourly and cleans cron.job_run_details daily (V7).

CREATE TABLE IF NOT EXISTS grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid TEXT NOT NULL UNIQUE CHECK (char_length(kid) >= 8 AND char_length(kid) <= 24),
  salt BYTEA NOT NULL CHECK (octet_length(salt) = 16),
  code_hmac TEXT NOT NULL CHECK (char_length(code_hmac) = 64),
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'redeemed', 'revoked', 'expired')),
  session_jti UUID,
  token_budget_weighted INT NOT NULL DEFAULT 12000 CHECK (token_budget_weighted > 0),
  tokens_used_weighted INT NOT NULL DEFAULT 0 CHECK (tokens_used_weighted >= 0),
  calls_budget INT NOT NULL DEFAULT 25 CHECK (calls_budget > 0),
  calls_used INT NOT NULL DEFAULT 0 CHECK (calls_used >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grants_expires_at ON grants (expires_at);

CREATE TABLE IF NOT EXISTS cooldown_hashes (
  email_hmac TEXT PRIMARY KEY CHECK (char_length(email_hmac) = 64),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cooldown_hashes_expires_at ON cooldown_hashes (expires_at);

CREATE TABLE IF NOT EXISTS altcha_replay_nonces (
  challenge_hash TEXT PRIMARY KEY CHECK (char_length(challenge_hash) = 64),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_altcha_replay_nonces_expires_at ON altcha_replay_nonces (expires_at);

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket_key TEXT PRIMARY KEY CHECK (char_length(bucket_key) <= 140),
  hit_count INT NOT NULL DEFAULT 1 CHECK (hit_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at ON rate_limit_counters (expires_at);

CREATE TABLE IF NOT EXISTS daily_usage_circuit (
  usage_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  emails_sent INT NOT NULL DEFAULT 0 CHECK (emails_sent >= 0),
  emails_cap INT NOT NULL DEFAULT 40 CHECK (emails_cap > 0 AND emails_cap <= 90),
  used_weighted INT NOT NULL DEFAULT 0 CHECK (used_weighted >= 0),
  cap_weighted INT NOT NULL DEFAULT 250000 CHECK (cap_weighted > 0),
  circuit_open BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on every Section E/F table with ZERO public/anon policies (fail-closed)
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooldown_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE altcha_replay_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_circuit ENABLE ROW LEVEL SECURITY;

-- Atomic fixed-window rate limiter keyed by daily-rotating salted IP hash (V10)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_bucket_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS TABLE (allowed BOOLEAN, current_hits INT, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits INT;
  v_exp TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limit_counters (bucket_key, hit_count, expires_at)
  VALUES (p_bucket_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket_key) DO UPDATE
    SET hit_count = CASE
          WHEN rate_limit_counters.expires_at <= now() THEN 1
          ELSE rate_limit_counters.hit_count + 1
        END,
        expires_at = CASE
          WHEN rate_limit_counters.expires_at <= now() THEN now() + make_interval(secs => p_window_seconds)
          ELSE rate_limit_counters.expires_at
        END
  RETURNING hit_count, expires_at INTO v_hits, v_exp;

  RETURN QUERY SELECT (v_hits <= p_limit), v_hits, v_exp;
END;
$$;

-- Atomic daily email slot reservation sized strictly inside Resend 100/UTC-day free limit (V8)
CREATE OR REPLACE FUNCTION reserve_daily_email_slot(p_cap INT DEFAULT 40)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sent INT;
BEGIN
  INSERT INTO daily_usage_circuit (usage_date, emails_sent, emails_cap)
  VALUES (CURRENT_DATE, 0, LEAST(GREATEST(p_cap, 1), 90))
  ON CONFLICT (usage_date) DO NOTHING;

  UPDATE daily_usage_circuit
  SET emails_sent = emails_sent + 1,
      emails_cap = LEAST(GREATEST(p_cap, 1), 90),
      updated_at = now()
  WHERE usage_date = CURRENT_DATE
    AND NOT circuit_open
    AND emails_sent + 1 <= LEAST(emails_cap, LEAST(GREATEST(p_cap, 1), 90))
  RETURNING emails_sent INTO v_sent;

  RETURN FOUND;
END;
$$;

-- Atomic single-use grant redemption: transitions issued -> redeemed exactly once
CREATE OR REPLACE FUNCTION redeem_grant_atomic(
  p_kid TEXT,
  p_expected_hmac TEXT,
  p_session_jti UUID,
  p_session_ttl_hours INT DEFAULT 24
)
RETURNS TABLE (
  grant_id UUID,
  token_budget_weighted INT,
  tokens_used_weighted INT,
  calls_budget INT,
  calls_used INT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE grants g
  SET status = 'redeemed',
      session_jti = p_session_jti,
      redeemed_at = now(),
      expires_at = LEAST(g.expires_at, now() + make_interval(hours => GREATEST(p_session_ttl_hours, 1)))
  WHERE g.kid = p_kid
    AND g.status = 'issued'
    AND g.expires_at > now()
    AND g.code_hmac = p_expected_hmac
  RETURNING
    g.id,
    g.token_budget_weighted,
    g.tokens_used_weighted,
    g.calls_budget,
    g.calls_used,
    g.expires_at;
END;
$$;

-- Atomic pre-call weighted-token & call-count reservation across both global circuit and grant row
CREATE OR REPLACE FUNCTION reserve_grant_tokens(
  p_grant_id UUID,
  p_session_jti UUID,
  p_reserve_weighted INT,
  p_daily_cap_weighted INT DEFAULT 250000
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  remaining_tokens INT,
  remaining_calls INT,
  circuit_open BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grant grants%ROWTYPE;
  v_daily daily_usage_circuit%ROWTYPE;
BEGIN
  IF p_reserve_weighted <= 0 THEN
    RETURN QUERY SELECT false, 'INVALID_RESERVATION_AMOUNT'::TEXT, 0, 0, false;
    RETURN;
  END IF;

  INSERT INTO daily_usage_circuit (usage_date, cap_weighted)
  VALUES (CURRENT_DATE, GREATEST(p_daily_cap_weighted, 1000))
  ON CONFLICT (usage_date) DO NOTHING;

  SELECT * INTO v_daily
  FROM daily_usage_circuit
  WHERE usage_date = CURRENT_DATE
  FOR UPDATE;

  IF v_daily.circuit_open OR (v_daily.used_weighted + p_reserve_weighted > v_daily.cap_weighted) THEN
    UPDATE daily_usage_circuit
    SET circuit_open = true, updated_at = now()
    WHERE usage_date = CURRENT_DATE;
    RETURN QUERY SELECT false, 'GLOBAL_DAILY_CIRCUIT_OPEN'::TEXT, 0, 0, true;
    RETURN;
  END IF;

  SELECT * INTO v_grant
  FROM grants
  WHERE id = p_grant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'GRANT_NOT_FOUND'::TEXT, 0, 0, false;
    RETURN;
  END IF;

  IF v_grant.status <> 'redeemed' OR v_grant.session_jti IS DISTINCT FROM p_session_jti THEN
    RETURN QUERY SELECT false, 'GRANT_SESSION_INVALID'::TEXT, 0, 0, false;
    RETURN;
  END IF;

  IF v_grant.expires_at <= now() THEN
    UPDATE grants SET status = 'expired' WHERE id = p_grant_id;
    RETURN QUERY SELECT false, 'GRANT_EXPIRED'::TEXT, 0, 0, false;
    RETURN;
  END IF;

  IF v_grant.calls_used + 1 > v_grant.calls_budget THEN
    RETURN QUERY SELECT
      false,
      'GRANT_CALL_BUDGET_EXHAUSTED'::TEXT,
      GREATEST(v_grant.token_budget_weighted - v_grant.tokens_used_weighted, 0),
      0,
      false;
    RETURN;
  END IF;

  IF v_grant.tokens_used_weighted + p_reserve_weighted > v_grant.token_budget_weighted THEN
    RETURN QUERY SELECT
      false,
      'GRANT_TOKEN_BUDGET_EXHAUSTED'::TEXT,
      GREATEST(v_grant.token_budget_weighted - v_grant.tokens_used_weighted, 0),
      GREATEST(v_grant.calls_budget - v_grant.calls_used, 0),
      false;
    RETURN;
  END IF;

  UPDATE grants
  SET tokens_used_weighted = tokens_used_weighted + p_reserve_weighted,
      calls_used = calls_used + 1
  WHERE id = p_grant_id
  RETURNING * INTO v_grant;

  UPDATE daily_usage_circuit
  SET used_weighted = used_weighted + p_reserve_weighted,
      updated_at = now()
  WHERE usage_date = CURRENT_DATE;

  RETURN QUERY SELECT
    true,
    'OK'::TEXT,
    (v_grant.token_budget_weighted - v_grant.tokens_used_weighted),
    (v_grant.calls_budget - v_grant.calls_used),
    false;
END;
$$;

-- Reconcile unused reserved tokens if actual completion used fewer weighted tokens than reserved
CREATE OR REPLACE FUNCTION reconcile_grant_tokens(
  p_grant_id UUID,
  p_refund_weighted INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_refund_weighted <= 0 THEN
    RETURN;
  END IF;

  UPDATE grants
  SET tokens_used_weighted = GREATEST(tokens_used_weighted - p_refund_weighted, 0)
  WHERE id = p_grant_id;

  UPDATE daily_usage_circuit
  SET used_weighted = GREATEST(used_weighted - p_refund_weighted, 0),
      updated_at = now()
  WHERE usage_date = CURRENT_DATE;
END;
$$;

-- Lock down SECURITY DEFINER RPC execution to service_role only (zero anon/authenticated access)
REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reserve_daily_email_slot(INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION redeem_grant_atomic(TEXT, TEXT, UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reserve_grant_tokens(UUID, UUID, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reconcile_grant_tokens(UUID, INT) FROM PUBLIC, anon, authenticated;

-- Hourly privacy purge + daily pg_cron log cleanup (V7)
CREATE OR REPLACE FUNCTION purge_expired_privacy_state()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limit_counters WHERE expires_at <= now();
  DELETE FROM cooldown_hashes WHERE expires_at <= now();
  DELETE FROM altcha_replay_nonces WHERE expires_at <= now();
  UPDATE grants SET status = 'expired' WHERE status IN ('issued', 'redeemed') AND expires_at <= now();
  DELETE FROM grants WHERE expires_at <= now() - interval '7 days';
  DELETE FROM daily_usage_circuit WHERE usage_date < CURRENT_DATE - 14;
END;
$$;

REVOKE ALL ON FUNCTION purge_expired_privacy_state() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule(
      'purge-privacy-state-hourly',
      '15 * * * *',
      'SELECT public.purge_expired_privacy_state();'
    );
    PERFORM cron.schedule(
      'purge-pg-cron-run-details-daily',
      '35 3 * * *',
      $cron$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days';$cron$
    );
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'pg_cron extension requires dashboard enablement on Supabase Free tier; purge_expired_privacy_state() is ready.';
END;
$$;
