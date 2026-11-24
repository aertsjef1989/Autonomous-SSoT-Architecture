# Balaerion III. Security, MFA & GDPR Routing Lane

**Focus:** Pre-Dispatch Lane Enforcement, Supabase RLS, Zero-Hallucination OSINT & GDPR Compliance

---

## 1. Two-Lane Routing (`lane: safe` vs. `lane: general`)

Balaerion enforces a hard separation between everyday/commercial prompting and client-data processing **before** any request leaves the API router:

| Lane | Permitted Workloads | Permitted Providers | Hard Constraint |
| :--- | :--- | :--- | :--- |
| **`lane: safe`** (`lane_locked: true`) | Client names, prospect briefs, call transcripts, OSINT synthesis, activation plans | Configurable EU zero-retention endpoints (private-production target; public POC enforces synthetic-only inputs) | **Zero fallback** to general/training providers |
| **`lane: general`** | Everyday AI tasks (coding, writing, analysis), anonymized outreach templates, ideation | Rate-limit-aware multi-provider pool (Groq, Gemini, OpenRouter, DeepSeek) | **Blocked** from receiving unmasked client PII |

---

## 2. Authentication, Access Control & Hard Refusals

* **Session Security:** Supabase Auth with MFA and Row-Level Security (RLS) isolating user threads and workspace records.
* **Pre-Commit Leak Gate:** Automated CI scanning (`scripts/leak_gate.py`) blocks API keys, personal tokens, and real client data from ever entering the repository.
* **Architectural Hard Refusals:** No consumer OAuth session hijacking through the gateway, no TLS impersonation/MITM proxies, and no silent degradation of `lane: safe` requests.

---

## 3. GDPR & Deterministic Fact Boundary

* **Zero-Hallucination Rule:** Legal entity names, VAT numbers, registry IDs (KBO/KvK), director names, pixels, and e-commerce platforms are extracted exclusively by deterministic code—never guessed by an LLM.
* **Data Subject Rights:** Domain-keyed prospect workspaces support **GDPR Art. 15** (access export) and **Art. 17** (cascade erasure) alongside **Art. 35 DPIA** documentation.
* **Human-in-the-Loop Governance:** AI recommends next actions and drafts deliverables, but **all lifecycle state transitions and external sends require explicit human approval**.

---

## 4. Zero-Public-Access Gate (Vercel Edge + Supabase)

* **Edge Password Gate:** All frontend pages and `/api/*` endpoints on Vercel sit behind a mandatory password check enforced in Next.js middleware (`BALAERION_ACCESS_PASSWORD`), preventing unauthorized visitors or bots from accessing the workspace or consuming upstream API quotas.
* **Invite-Only Identity:** Supabase Auth is configured with **public signups disabled**. Accounts are provisioned exclusively by the owner, and all database tables enforce strict Row-Level Security (RLS) tied to authenticated `user_id` claims.
