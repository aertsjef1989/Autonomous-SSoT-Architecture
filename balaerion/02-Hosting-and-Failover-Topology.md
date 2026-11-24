# Balaerion II. Hosting, Failover & Phase 2 Sovereign Topology

**Focus:** Vercel + Supabase Serverless Deployment (v1) & Self-Hosted OmniRoute Expansion (Phase 2)

---

## 1. v1 Live Topology (Vercel + Supabase)

Balaerion v1 eliminates infrastructure overhead by running entirely on managed serverless primitives:

* **Edge & Compute (Vercel):** Handles UI rendering, streaming LLM responses, and API route handlers for deterministic OSINT lookups and lane enforcement.
* **Persistence (Supabase):** Stores general AI conversation history alongside ProspectHub's domain-keyed account records, lifecycle states, and audit logs.
* **Provider-Level Failover:** Rate-limit-aware routing automatically falls back across configured general-lane providers if an upstream API throttles or times out, while strictly refusing fallback from `lane: safe` to non-EU providers.

---

## 2. Request Path & Execution Flow

1. **Client Request:** User submits either a general AI prompt or a ProspectHub persona command from the web UI.
2. **Auth & Lane Inspection:** Supabase Auth validates the session; the API router inspects the active persona's `lane` (`safe` vs. `general`) and `allowedConnections` **before** dispatching any tokens.
3. **Deterministic Enrichment (ProspectHub Mode):** Code-only OSINT connectors fetch registry, VAT, and web-stack facts prior to LLM synthesis.
4. **State Commit:** Outputs and lifecycle deltas are persisted to Supabase with timestamps and actor attribution.

---

## 3. Phase 2 Roadmap: Sovereign Self-Hosted Expansion

For enterprise or air-gapped deployments requiring zero third-party cloud hosting, Balaerion's architecture is designed to migrate cleanly to a self-hosted control plane:

* **Compute & Gateway:** Hetzner AX41 primary + **OmniRoute** (`:20128`) gateway + **LibreChat** UI behind **Cloudflare Access** (MFA) and **Cloudflare Tunnel** (zero open ports).
* **Task Queue & Sandboxing:** Encrypted **SQLite** lease-based worker queue (`QUEUED` → `RUNNING` with 900s lease and automatic worker-death recovery) paired with **NsJail** ARM64 sandboxing for untrusted code execution.
* **Remote Surfaces:** Telegram long-polling bridge wired to the same single-file agent registry.

---

## 4. Public Showcase vs. Private Live Access Boundary

* **GitHub Pages (Public Mirror):** Every architectural change, schema update, and persona addition made in Vercel/Supabase is mirrored in this documentation site alongside sanitized, zero-backend HTML prototypes.
* **Vercel Live Instance (Password-Protected):** The live Vercel deployment is **not** publicly accessible. Access is gated by default via Next.js edge middleware password protection (`HttpOnly` signed session cookie) combined with invite-only Supabase Auth, ensuring live LLM routes and OSINT connectors can only be accessed when explicitly authorized by the owner.
