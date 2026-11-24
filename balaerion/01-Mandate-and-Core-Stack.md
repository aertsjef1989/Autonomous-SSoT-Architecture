# Balaerion I. Mandate & Core Stack

**Focus:** Zero-Incremental-Cost AI Gateway, OmniRoute + LibreChat Split & Interface Boundaries

---

## 1. The Architectural Mandate
Balaerion is a personal, browser-first AI gateway and orchestration workspace designed to unify multi-provider model routing, reusable skills, and structured GTM tooling without recurring infrastructure or per-seat SaaS costs beyond existing personal subscriptions.

**Hard Design Constraints:**
* **Zero Client Install:** Accessible via plain web URL from an iOS Safari PWA, Chromebook, or locked-down workstation.
* **Hosted APIs Only:** Zero local LLM inference; every model call leaves the host under explicit routing and compliance policy.
* **Strict Employer Isolation:** Zero CRM hooks, zero corporate SSO, and zero interference with employer systems.

---

## 2. Core Stack Topology

| Layer | Component | License / Scope | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **API Gateway** | **OmniRoute** | MIT (~340 providers, 90+ free tiers) | Used as-is (unforked) for upstream provider routing, fallback, and per-key model allowlists/blocklists. |
| **Frontend** | **LibreChat** | Open-source web UI | Native Skills (`SKILL.md`), GitHub Skill Sync, explicit new-chat control, and persistent history tab. |
| **Mobile / Messaging** | **Telegram Bot** | `chatgpt-telegram-bot` (long-polling) | Separate lightweight process locked strictly to a single Telegram user ID. |
| **Cloud Storage** | **Direct Drive API + OneDrive** | OpenAPI tool wrapper | Direct Google Drive API script wrapped as an OpenAPI tool (bypassing official Drive MCP failures on personal accounts). Personal OneDrive only. |

---

## 3. Prompt & Context Separation
OmniRoute exposes **one global system prompt** across the gateway. Placing persona or task instructions at the gateway layer would contaminate unrelated sessions. Therefore:
* **Gateway Layer (OmniRoute):** Handles transport, authentication, rate-limit failover, and model-level compliance rules exclusively.
* **Frontend Layer (LibreChat):** Owns all per-context system prompts, `SKILL.md` definitions, and conversation history.
* **Memory Discipline:** OmniRoute memory is disabled at launch to prevent silent cross-session leakage; custom personas are deferred to v2.0.
