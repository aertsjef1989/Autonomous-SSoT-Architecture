# Balaerion II. Hosting & Failover Topology

**Focus:** Serverless Edge Execution, Hybrid `pgvector + tsvector` Retrieval, Replay-First Resilience & Lane-Isolated Provider Failover · **Status:** `Prototype` + `Designed`

---

## 1. Serverless Execution Topology

Balaerion eliminates idle container cost and persistent server patching by combining stateless serverless compute with an isolated EU PostgreSQL persistence and vector layer:

* **Stateless Compute & UI (`Next.js App Router`):** Renders passive documentation, Replay consoles, and offline Signal Press tools with zero session cookies, while funneling all live LLM, SSoT retrieval, and OSINT operations through typed server route handlers.
* **Persistence & Hybrid Search (`PostgreSQL EU + pgvector`):** Reached exclusively from server routes using a server-only `service_role` key. Row-Level Security (`RLS`) is enabled on every table (`grants`, `cooldown_hashes`, `altcha_replay_nonces`, `rate_limit_counters`, `daily_usage_circuit`, `ssot_documents`, `ssot_chunks`) with **zero `anon` or `authenticated` public policies**.
* **Quota-Aware Provider Failover:** Within `lane: general`, the router orders candidate providers starting with the user's selected provider followed by healthy configured peers. Upstream `HTTP 429`, `5xx`, or timeout (`12,000 ms` abort signal) advances immediately to the next admitted provider in the **same** lane. Cross-lane failover from `eu` to `general` is structurally impossible.

```text
[Reviewer / Architect Browser]
   |-- Passive / Replay (0 Cookies) -----------> [Next.js App Router UI (Local Replay)]
   |-- Grant Cookie or Owner Session ----------> [Server Proxy: /api/chat & /api/osint]
                                                        |
                                        1. enforcePreDispatchGate() (PII + Lane Lock)
                                        2. SELECT ... FOR UPDATE (Supabase EU Postgres RLS)
                                        3. search_ssot_hybrid() (tsvector GIN + pgvector HNSW)
                                                        |
                        +-------------------------------+-------------------------------+
                        | (lane: eu ONLY)                                               | (lane: general)
                        v                                                               v
        [EU Safe Pool: Mistral · Codestral · OVH]                     [General Pool: NVIDIA · Groq · Cerebras · Gemini]
                        | (if all throttled -> 0 cross-lane!)                           | (if all throttled)
                        +-------------------------------> [Deterministic Replay Floor] <+
```

---

## 2. Request Path & Graceful Degradation

Every `/api/chat` and `/api/press/assist` invocation traverses a deterministic **6-step execution pipeline**:

1. **Replay Mode Short-Circuit (Default):** Unauthenticated visitors (or requests when Supabase / provider keys are unset) receive deterministic Replay responses immediately with `HTTP 200` / `401 replay: true` and zero database writes.
2. **Session & Owner Verification:** `isOwnerAuthenticated(request)` checks the `HttpOnly; SameSite=Strict` owner session first (granting unlimited live calls for the portfolio owner). Otherwise `authorizeAndReserveGrantTokens()` validates the `HttpOnly; SameSite=Lax` single-use reviewer cookie.
3. **Pre-Dispatch Controls (`enforcePreDispatchGate`):** Before any token reservation or network socket opens, deterministic regexes scan the prompt and conversation history for VAT numbers, IBANs, emails, and phone patterns, and verify that the requested provider matches the target lane (`eu` default when unclassified). Violations return `HTTP 403` with `0` tokens deducted.
4. **Atomic Weighted-Token Reservation & Global Circuit Breaker:** PostgreSQL locks the grant row (`SELECT ... FOR UPDATE`), checks `daily_usage_circuit` against the global daily ceiling, and reserves `ceil(estimated_tokens * provider_weight)`.
5. **Hybrid SSoT Grounding (`search_ssot_hybrid`):** When invoked from `/ssot` or Mode B `ProspectHub`, the server embeds the query via card-free 1024-dim multilingual embeddings (`Cloudflare @cf/baai/bge-m3` -> `Cohere embed-multilingual-v3.0` -> `null` lexical fallback) and executes **Reciprocal Rank Fusion (`RRF`)** combining PostgreSQL `tsvector` (`GIN`) and `pgvector` (`HNSW` cosine similarity), scoped strictly to `market IN (active_market, 'GLOBAL')`.
6. **Bounded Failover & Replay Floor:** The router attempts configured providers within the resolved lane under per-provider abort timeouts. If every configured provider in that lane is throttled or unreachable, the gateway returns a labeled deterministic Replay response rather than crashing or crossing lanes.

---

## 3. Zero-Commit Google Drive SSoT Ingestion Pipeline

To keep internal or commercial playbooks out of public Git history while making them queryable in `/ssot` and `ProspectHub`, Balaerion implements a **Zero-Commit In-Memory Ingestion Pipeline**:

| Ingestion Path | Trigger Mechanism | Memory & Storage Contract |
| :--- | :--- | :--- |
| **Connected Drive CLI Sync** | `scripts/import_connected_gdrive_to_supabase.mjs` | Streams Google Docs & Markdown files (`GLOBAL`, `NL`, `BE`, `FR`), skips `Archive` trees, chunks headings (`~1,400` chars), computes optional 1024-dim vectors, and upserts directly to Supabase with `0` files written to Git. |
| **Google Apps Script Push** | `docs/google-apps-script-sync.gs` -> `/api/admin/sync-drive` | Zero GCP Console / IAM Service Account required; Apps Script exports changed Docs in RAM and posts signed batches to the owner-authenticated endpoint. |
| **Owner Browser RAM Upload** | `/admin` Section 2 file picker | Parses `.md` / `.txt` files in browser `FileReader` memory and upserts SHA-256 content-hashed records (`unchangedSkipped` idempotency). |

---

## 4. Failure Modes & Resilience Verification

| Failure Scenario | Naive Gateway Behavior | Balaerion Enforced Behavior | Verification Suite |
| :--- | :--- | :--- | :--- |
| **50 Concurrent Requests on Last 5 Calls of Grant** | Race condition allows 20 to 40 extra upstream API calls | PostgreSQL `FOR UPDATE` row lock authorizes exactly `5` calls and degrades `45` to Replay (`0` overspend) | `scripts/verify_p4_grants.mjs` |
| **EU Safe-Lane Provider Returns `HTTP 429`** | Silently retries prompt on US/Global Groq or OpenRouter | Tries remaining `eu` endpoints (`mistral` -> `codestral` -> `ovhcloud-eu`), then fails closed to Replay (`0` `general` sockets opened) | `scripts/verify_p5_router.mjs` |
| **Embedding Provider Unconfigured** | RAG endpoint crashes with `500 Missing Vector` | `embeddings.ts` returns `null`; `search_ssot_hybrid()` falls back seamlessly to PostgreSQL `tsvector` full-text ranking | `scripts/verify_track2_workspace.mjs` |
| **Supabase Unreachable or Env Blank** | Unhandled runtime exception on landing page | Passive routes return `HTTP 200` with `0` cookies; mutation routes fail closed (`HTTP 503`) with Replay intact | `scripts/verify_p4_grants.mjs` |

---

## 5. Private-Workspace Portability Principle

For organizations lifting this architecture into an internal enterprise VPC with real customer records:
* **Zero Application Code Rewrite:** Swap free-tier API keys in `registry.ts` for contractually bound enterprise EU endpoints (such as Azure OpenAI Sweden Central / France Central, AWS Bedrock Frankfurt, or dedicated Mistral La Plateforme DPA endpoints) with zero-data-retention (`ZDR`) guarantees.
* **Database Sovereignty:** `supabase/schema.sql` uses standard PostgreSQL 16 + `pgvector` + `pg_cron` DDL with zero proprietary ORM lock-in, running identically on self-hosted PostgreSQL, Cloud SQL EU, or RDS Frankfurt.
