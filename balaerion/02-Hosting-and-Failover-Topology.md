# Balaerion II. Hosting & Failover Topology

**Focus:** Serverless Edge Execution, Replay-First Resilience & Lane-Isolated Provider Failover

---

## 1. Serverless Execution Topology

Balaerion eliminates persistent server administration by running on stateless serverless functions backed by an EU-region PostgreSQL store:

* **Stateless Compute & UI:** Renders interactive Replay workspaces without authentication barriers while routing live AI requests through one server-side proxy.
* **Persistence (PostgreSQL EU):** Reached exclusively from server routes via a server-only credential with Row-Level Security (RLS) enabled on every table and zero public policies.
* **Provider-Level Failover:** Quota-aware routing falls back across admitted `general`-lane providers when an upstream API returns HTTP `429` or times out, while strictly refusing cross-lane fallback from `eu` to `general`.

---

## 2. Request Path & Graceful Degradation

1. **Replay Mode (Default):** Pre-recorded runs and synthetic fixtures load immediately in the browser with zero database or LLM dependency.
2. **Pre-Dispatch Controls (Live Mode):** Before any live call leaves the server proxy, deterministic checks verify an active grant budget, check the global daily circuit breaker, run the deterministic PII gate, and resolve the target lane (`eu` by default when unclassified).
3. **Deterministic Enrichment (ProspectHub Mode):** Cached synthetic OSINT fixtures supply registry, VAT, and tech-stack facts so the public demo never queries live external company registries with visitor inputs.
4. **Failover to Replay:** If all admitted providers in a lane hit rate limits, or if the database is unreachable, the workspace degrades cleanly to Replay mode with an explicit status banner.

---

## 3. Private-Workspace Portability Principle

For organizations lifting this architecture into an internal environment with real customer data, the config-driven provider interface decouples application logic from hosting specifics:

* **Zero Code Changes for Provider Swap:** Admitted endpoints are defined in a versioned routing configuration (`RPM`, `RPD`, `TPM`, context ceiling, and lane lock).
* **Hard Production Gates:** Moving from synthetic portfolio data to real business records requires replacing public free-tier endpoints with contractually bound EU endpoints guaranteeing zero training on inputs and bounded log retention.
