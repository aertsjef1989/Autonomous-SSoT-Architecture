# Balaerion III. Security & GDPR Routing Lane

**Focus:** Pre-Dispatch Lane Enforcement, Database Isolation, Deterministic OSINT & Grant Controls

---

## 1. Two-Lane Routing (`lane: eu` vs. `lane: general`)

Balaerion enforces a hard separation between EU-scoped synthesis and general prompting **before** any request leaves the server proxy:

| Lane | Permitted Workloads | Permitted Providers | Hard Constraint |
| :--- | :--- | :--- | :--- |
| **`lane: eu`** (`lane_locked: true`) | Prospect briefs, meeting deltas, activation plans, and unclassified prompts (default) | Admitted EU-region endpoints (synthetic-only in public POC) | **Zero fallback** to `general` providers |
| **`lane: general`** | Everyday coding, writing, analysis, and anonymized commercial ideation | Admitted card-free multi-provider pool | **Hard-blocked** if deterministic PII gate triggers |

---

## 2. Database Isolation, Leak Gate & Hard Refusals

* **Server-Only Database Access:** Plain PostgreSQL in an EU region with Row-Level Security (RLS) enabled on every table and zero public client policies.
* **Pre-Build Leak Gate:** Automated CI scanning (`scripts/leak_gate.py`) blocks internal prefixes, tokens, and non-synthetic identifiers before and after every documentation build.
* **Architectural Hard Refusals:** No consumer subscription credential reuse, no TLS interception proxies, and no silent cross-lane degradation.

---

## 3. GDPR & Deterministic Fact Boundary (`[Status: Prototype + Designed]`)

* **Deterministic Fact Boundary:** Legal entity names, VAT numbers, registry IDs (KBO/KvK), pixels, and e-commerce platforms come from structured registry/OSINT fixtures rather than free-text LLM generation; unverified fields are surfaced explicitly as `unconfirmable`.
* **Data Subject Rights:** Domain-keyed prospect schemas model **GDPR Art. 15** (access export) and **Art. 17** (cascade erasure) alongside **Art. 35** impact controls.
* **Human-in-the-Loop Governance:** AI proposes drafts and next steps, while all lifecycle transitions and external dispatches require explicit human action.

---

## 4. Abuse Prevention & Budget Ceilings

* **Grant-Gated Live Proxy:** Read and Replay surfaces require no login. Live LLM calls require a high-entropy single-use grant redeemed into an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, protected on request by self-hosted proof-of-work (`ALTCHA`).
* **Atomic Weighted-Token Budgets:** Every live request reserves weighted tokens atomically in PostgreSQL and enforces a global daily circuit breaker so shared free-tier quotas cannot be overrun.
