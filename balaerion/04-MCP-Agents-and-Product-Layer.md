# Balaerion IV. Dual-Mode Product Layer & Two-Lane Persona Registry

**Focus:** Standalone Multi-LLM Workbench, ProspectHub Multi-Persona Grounding, Citation Binding & Calibration · **Status:** `Prototype` + `Designed`

---

## 1. Mode A: Standalone Multi-LLM Workbench

Outside of account-specific commercial workflows, Balaerion operates as a full daily-driver AI workbench (`Mode A`) over all `12` card-free providers:
* **Multi-Provider & Pinned-Model Switching:** Engineers and operators switch instantaneously between deep reasoning models (`Qwen 3 235B` on NVIDIA NIM, `DeepSeek V3` on Fireworks), sub-second wafer/LPU inference (`Llama 3.3 70B` on Groq, `Qwen 3 32B` on Cerebras), long-context synthesis (`Gemini 2.5 Flash`), and sovereign EU endpoints (`Mistral Small 2503`, `Codestral 2501`).
* **Editable System Contracts & Pre-Dispatch Gate:** Every Mode A session runs through the identical pre-dispatch PII and lane gate (`enforcePreDispatchGate`) and exposes one-click **`-> Signal Studio (16:9)`** and **`-> Signal Press (A4)`** artifact compilers on every assistant turn.

---

## 2. Mode B: ProspectHub Multi-Persona Agent Suite

ProspectHub operates as a **stateful, domain-keyed commercial engineering workspace** inside Balaerion. Rather than treating every prompt as an isolated blank slate, Mode B binds every persona execution to three deterministic inputs:
1. **Verified Corporate & Tech-Stack OSINT:** Resolved via the Hybrid 8-Collector OSINT engine ([Balaerion V](05-ProspectHub-OSINT-and-Readiness-Engine.md)).
2. **Active Account Lifecycle State (`7` States):** `Cold` -> `Auto-replied` -> `Agent-contacted` -> `Discovery-booked` -> `Post-discovery` -> `In-nurture` -> `Dormant` ([Balaerion VI](06-ProspectHub-Lifecycle-and-Signal-Handoff.md)).
3. **Hybrid SSoT Playbook Retrieval (`[DOC_ID]`):** `search_ssot_hybrid()` injects market-scoped (`NL`, `BE`, `FR`, `GLOBAL`) SSoT chunks into the system context and surfaces clickable `[DOC_ID]` badges plus `REVIEW_DUE` staleness flags if any retrieved playbook is older than `90` days.

---

## 3. Deterministic 40+ Market OSINT Boundary

Before any Mode B persona drafts a brief, deterministic code resolves structured entity and storefront signals across `40+ markets`, modeling **KvK, KBO, NBB, VIES, GLEIF, SIRENE, BODACC, RDAP/DNS-over-HTTPS, and storefront `<head>` tag signals** into Entity Snapshots, Tech/Pixel Audits, Consent Postures, and Readiness Scores (`/10`).

* **Jurisdiction Resolution Rule:** UI or copy language alone **never** determines legal market scope (`nl` text does not imply `NL` over Vlaanderen `BE`). Market classification resolves strictly from legal-entity registry identifiers (`KvK` vs `KBO` vs `SIREN`), ccTLD, and verified headquarters metadata.
* **Public vs. Private Execution:** Public GitHub Pages builds serve cached synthetic fixtures (`*.example`) with zero external network requests; live domain inspection runs exclusively behind Owner or approved Reviewer Grant authentication on the private workspace.

---

## 4. Two-Lane Persona Registry (`23` Registered Balaerion AI Personas)

Balaerion registers **23 AI personas** (`7` Mode A general-assistant utilities + `16` Mode B ProspectHub specialists; distinct from Pillar I's `14` SSoT conversational Bot commands):

### 4.1 Mode A Everyday Assistant Personas (`7` Utilities, `lane: general` unless PII-routed)

| # | Persona ID | Primary Capability | Output Contract |
| :---: | :--- | :--- | :--- |
| `01` | **`general-assistant`** | Multi-provider architectural & analytical reasoning | Structured Markdown with explicit trade-offs and assumptions |
| `02` | **`code-debugger`** | TypeScript, Python, and API root-cause diagnosis | Minimal type-safe diff + reproduction test case |
| `03` | **`sql-architect`** | PostgreSQL 16 schema, `pgvector` indexing & RLS auditing | Idempotent DDL + `ENABLE ROW LEVEL SECURITY` verification |
| `04` | **`tech-writer`** | Concise engineering specifications, runbooks & ADRs | Executive summary, decision table, and failure-mode matrix |
| `05` | **`json-repair`** | Single-pass deterministic schema repair (`H6` ceiling) | Strict schema-valid JSON (`signal-press-doc-v1` / deck schema) |
| `06` | **`doc-summarizer`** | Multi-section synthesis over uploaded Markdown playbooks | Key guardrails, numeric invariants, and open action items |
| `07` | **`data-qa-auditor`** | Cross-table arithmetic, reconciliation & claim verification | Pass/fail ledger check with discrepancy pinpointing |

### 4.2 Mode B Safe-Lane ProspectHub Personas (`7` Personas, `lane: eu`, Deterministic & Client-Facing)

| # | Persona ID | Lane Lock | Grounded Input -> Output Contract |
| :---: | :--- | :---: | :--- |
| `01` | **`prospecthub-research-and-intel`** | `lane_locked: true` | OSINT snapshot + SSoT vertical playbook -> Executive account brief & gap list |
| `02` | **`activate`** | `lane_locked: true` | Pre-call brief + discovery deltas -> Client-operated measurement & onboarding plan |
| `03` | **`call-transcriber`** | `lane_locked: true` | Raw discovery notes -> Structured technical blockers, timeline, and stakeholder map |
| `04` | **`watcher`** | `lane_locked: true` | Storefront/DNS diff (`pixel added/removed`, `CMP changed`, `platform migrated`) -> Signal alert |
| `05` | **`pipeline`** | `lane_locked: true` | Domain-keyed lifecycle transition -> Validated state update (`<10s` write budget) |
| `06` | **`daily-view`** | `lane_locked: true` | Active account table + unacted `watcher` diffs -> Prioritized daily operator queue |
| `07` | **`doc-reader`** | `lane_locked: true` | Synthetic rate cards, feed specs & brand rules -> Normalized commercial checklist |

### 4.3 Mode B General-Lane ProspectHub Personas (`9` Personas, `lane: general`, Commercial Execution)

| # | Persona ID | Commercial & SSoT Guardrail Enforced |
| :---: | :--- | :--- |
| `08` | **`prospecthub-cold-pitch-email`** | Advisory framing; cites specific stack gap; zero unverified claims; `30-minute` discovery CTA |
| `09` | **`prospecthub-follow-up-email`** | Concise inline HTML/text summary; **no cold PDF attachment**; **no daily ad spend minimums** |
| `10` | **`prospecthub-polish-emails`** | Enforces localized tone parity (`NL` directness, `BE` bilingual clarity, `FR` formal register) |
| `11` | **`prospecthub-nurture-sequence`** | Value-led technical check-ins anchored on seasonal vertical milestones |
| `12` | **`prospecthub-elevator-pitch`** | `60-second` vertical-specific commercial engineering hook |
| `13` | **`prospecthub-full-pitch-script`** | Structured `30-minute` discovery agenda (`5m` context, `15m` stack diagnosis, `10m` activation roadmap) |
| `14` | **`prospecthub-scaling-roadmap`** | Phased measurement-first rollout (`Pixel + CAPI event_id dedup` -> `Catalog` -> `Incrementality`) |
| `15` | **`deck-builder`** | Compiles multi-slide `16:9` Signal Studio JSON (`eyebrow`, `title`, `bullets`, `H01`..`H63` hero ID) |
| `16` | **`creative-concepts`** | Short-form hook & format testing matrix carrying mandatory dual `CONCEPT` watermarks |

---

## 5. Governance, Calibration & 10-Language Parity

* **10-Language EU Parity:** Prompt rubrics and output linters validate structural parity across `EN`, `NL`, `DE`, `FR`, `ES`, `IT`, `PT`, `PL`, `TR`, and `RO`.
* **6 Critical-to-Quality (`CTQ`) Operational Metrics:**
  1. **Output Quality Score:** `0` to `10` deterministic rubric checking citation presence, stack accuracy, and guardrail adherence.
  2. **Cycle Time per Prospect:** Target `< 4 minutes` from domain input to reviewed brief + Studio/Press artifact.
  3. **Marginal API Cost per Prospect:** `EUR 0.00` under card-free multi-provider routing.
  4. **Weekly Active Operator Adoption Rate (%):** Tracks repeat `Post-discovery` -> `Signal Press` handoffs.
  5. **Compliance & Cross-Lane Incidents:** Hard target `0 / quarter` (enforced deterministically by `lane-guard.ts`).
  6. **Language Quality Parity:** Max `< 0.5` rubric variance between English and Benelux/French outputs.
* **Calibration Benchmark (Fictional Entity & Intentional Mod-97 Non-Collision):** Public demos and automated CI evaluations run exclusively against sanitized fictional records such as ***Kapsalon Vuurtoren BV*** (`KBO 0123.456.789`, BE confidence `0.94`, Lightspeed eCom). **Synthetic Checksum Proof:** Under Belgium's KBO modulo-97 check (`97 - (first_8_digits mod 97)`), `1234567 mod 97 = 48`, so a valid enterprise number starting `0123.456.7` must end in check digits `49` (`97 - 48 = 49`). Ending in `89` fails the Belgian mod-97 checksum **by design**, guaranteeing the calibration fixture can never collide with a real registered Belgian company.

---

## Interactive Balaerion Prototype
* [Launch Interactive Balaerion Prototype](demo/index.html)
