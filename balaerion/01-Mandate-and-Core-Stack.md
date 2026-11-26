# Balaerion I. Mandate & Core Stack

**Focus:** Dual-Mode AI Workspace (Everyday Assistant + ProspectHub Multi-Persona Showcase) on Managed Serverless Primitives

---

## 1. Architectural Mandate

Balaerion is a **dual-mode AI platform** designed to serve two complementary purposes from a single interface and routing layer:

1. **Mode A (General AI Assistant):** A fast, model-agnostic chat and document workspace for daily engineering, writing, analysis, and brainstorming, allowing instant switching across admitted free-tier LLM providers without vendor lock-in.
2. **Mode B (ProspectHub Multi-Persona Agent Suite):** A domain-keyed B2B sales intelligence and activation prototype embedded inside Balaerion, demonstrating deterministic OSINT, lane-enforced GDPR routing, and multi-persona execution on synthetic fixtures.

---

## 2. Serverless Reference Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend & Proxy** | **Next.js App Router (Serverless)** | Unified Replay workspace, ProspectHub console, and single server-side LLM proxy |
| **State & Budgets** | **PostgreSQL (EU Region + RLS)** | Server-only `service_role` access for atomic token budgets, circuit breakers, and synthetic workspace state |
| **Safe Lane (`eu`)** | **Admitted EU Endpoints** | Synthetic-only public POC; private-production architecture requires EU processing, zero training on inputs, and documented retention |
| **General Lane (`general`)** | **Admitted Free-Tier Pool** | Card-free multi-provider failover (evaluated against strict admission criteria) |
| **Design System** | **Signal Tokens** (`#08090D`, `#21E0DC`, `#F0245C`) | Unified high-contrast console aesthetic across documentation and prototypes |

---

## 3. Single-File Agent Registry

All personas, both everyday utilities and ProspectHub specialists, are declared in a single validated registry (`lane`, `allowedConnections`, `systemPrompt`, `capabilities`). Load-time schema validation ensures duplicate IDs, invalid capabilities, or misconfigured lane locks fail during CI rather than at runtime.
