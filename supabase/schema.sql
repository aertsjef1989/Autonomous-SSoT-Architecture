-- ============================================================================
-- 1. PILLAR I: AUTONOMOUS SSoT — GOVERNANCE & CHECKS-AND-BALANCES
-- ============================================================================
CREATE TYPE ssot_doc_status AS ENUM ('draft', 'pending_approval', 'published', 'archived');

CREATE TABLE IF NOT EXISTS ssot_documents (
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

DROP TRIGGER IF EXISTS trg_ssot_publish_gates ON ssot_documents;
CREATE TRIGGER trg_ssot_publish_gates
  BEFORE INSERT OR UPDATE ON ssot_documents
  FOR EACH ROW EXECUTE FUNCTION enforce_ssot_publish_gates();

-- FR-11 & FR-36 View: Automatic Escalation & Staleness Flag
CREATE OR REPLACE VIEW ssot_documents_with_staleness AS
SELECT
  *,
  EXTRACT(DAY FROM (now() - last_verified_at))::INT AS days_since_verified,
  (now() > last_verified_at + make_interval(days => cadence_days)) AS is_stale,
  CASE
    WHEN now() >= last_verified_at + interval '30 days' THEN 'DAY_30_AUTO_ARCHIVE'
    WHEN now() >= last_verified_at + interval '14 days' THEN 'DAY_14_ESCALATE'
    ELSE 'DAY_0_CURRENT'
  END AS escalation_stage
FROM ssot_documents;

-- ============================================================================
-- 2. PILLAR II: BALAERION V1 — GENERAL AI + PROSPECTHUB STATEFUL WORKSPACE
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
-- 3. ROW-LEVEL SECURITY (INVITE-ONLY OWNER ISOLATION)
-- ============================================================================
ALTER TABLE ssot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_ssot" ON ssot_documents FOR ALL USING (auth.uid() = owner_id);
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
