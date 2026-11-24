# Balaerion IV. Multi-Agent Layer, ProspectHub & Remote Access

**Focus:** Named RevOps Personas, 23 Active MCP Agents, ProspectHub OSINT, Rep Voice Profiles & Telegram Remote Access

---

## 1. Core Agent Topology (Single-Process MCP Orchestrator)
Balaerion wraps **23 active agents** (8 benched) as **Model Context Protocol (MCP) servers** inside a single orchestrator process with mandatory concurrent execution. The fleet is anchored by six flagship RevOps personas operating over a vendor-agnostic **Stateful Relational Workspace** and **RAG Vector Layer** across **EMEA, LATAM, and MENA**:

| Agent Persona | Primary Responsibility | Guardrail / Output Contract |
| :--- | :--- | :--- |
| **Scout** | Parallel firmographic, technographic, and commercial signal research | Structured JSON account brief; raw source evidence required (zero bare conclusions) |
| **Campaign Architect** | Maps account signals against the RAG Knowledge Base for custom plays | Territory- and vertical-scoped campaign blueprint |
| **Voice & Outreach Engine** | Generates email/call drafts using per-rep **Voice Profiles** and regional RAG context | Staged draft only; LinkedIn automation and auto-send hard-blocked |
| **Relay Agent** | Packages qualification state, objections, and context for SDR → AE → CS handovers & incubation | Deterministic handover brief triggered on state transition |
| **Quant** | Monitors 7-state velocity, surfaces deal risk, and diagnoses campaign bottlenecks | Read-only telemetry & bottleneck alerts; no blind CRM mutations |
| **Compliance Overlord** | Enforces regional regulations (GDPR Art. 15/17/35), channel bans, and schema validation | Hard circuit breaker (`#F0245C`) blocking non-compliant payloads |

---

## 2. Full ProspectHub & Signal Product Layer
* **ProspectHub (Prospect-to-Activation OSINT):** Automatic country detection with coverage tiers and parallel European registry lookups (**KVK, KBO, NBB, VIES, GLEIF**).
* **Activation Workflow:** Triggered by `"Activate [company]"`, combining Scout evidence, Campaign Architect plays, and advisory framing.
* **Signal Deck Builder:** PC-only manual-first deck builder (50 presets) with native Signal `.pptx` export and three product editions (Single-Channel, Multi-Social, Channel-Recommender).

---

## 3. Remote Access Architecture (Telegram & Zero-Install Web)
* **Telegram Long-Polling Bot:** Dedicated bot process locked strictly to a single whitelisted owner `sender_id`. Supports remote `/scout`, `/activate`, `/status`, and Human-in-the-Loop (HITL) draft approvals without opening inbound server ports.
* **Browser & Mobile PWA:** Plain web URL behind **Cloudflare Access MFA** (Email OTP / Google SSO) and **Cloudflare Tunnel**, accessible from iOS Safari PWA, Chromebook, or locked-down workstations.

---

## 4. Interactive Surface
Launch the [Balaerion 6-Tab Interactive Console](https://aertsjef1989.github.io/systems-design-portfolio/balaerion/demo/) (and upcoming limited-route Vercel live embed).
