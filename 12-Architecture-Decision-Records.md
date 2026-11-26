# XII. Architecture Decision Records & Governance

**Focus:** 12 Core ADRs, Governance RACI & Platform Change Watch

---

## 1. The 12 Architecture Decision Records (ADRs)
Every structural constraint in this architecture exists to prevent a specific silent failure. Each record documents the rejected alternative and the exact failure mode triggered if a future team attempts to simplify it.

| ID | Decision | Rejected Alternative | Architectural Rationale | What Breaks If This Changes |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-01** | **Single Private Space, Two Root Nodes** | Separate spaces for Public and Internal estates | Unifies `3,055` public reference nodes (`3,000+`) and `~1,200` initial internal nodes under one deny-by-default administration surface. | Doubles admin overhead and breaks cross-linking between internal SOPs and the public files they govern. |
| **ADR-02** | **Data Layer (`9` Tables) vs. Audit Layer (`2` Tables) Split** | Single database housing all `11` tables | Isolates bounded operational state (`~6,300` rows by Year 3) from high-volume audit logs (`T10`, `T-KPI-02`). | Audit log growth degrades operational queries and prevents read-only managers from saving custom dashboards. |
| **ADR-03** | **Container-Level Permission Inheritance** | Per-document ACL management | Permissions attach to folder containers (`perm_type: "container"`) across `5` internal tiers (`I-0`..`I-4`) and inherit on publish move. | Per-document ACLs create untraceable drift across `40` markets and break nightly permission reconciliation (`SC-004`). |
| **ADR-04** | **Move-Then-Confirm Async Publish** | Write `Published` state first, then move node | Bot polls async move task and asserts `parent_node_token` *before* writing `Published` to `T1`. | Writing state first produces the "register is lying" failure mode whenever an async move fails silently. |
| **ADR-05** | **Agent Lockdown via Bot Proxy** | Granting frontline agents direct edit rights on `T1` | Agents (`60` frontline `AGT` seats in the `100-seat` reference model) are strictly View-Only on base tables; state updates execute exclusively via Bot commands. | Direct cell editing across dozens of seats corrupts register integrity and bypasses `T10` audit logging. |
| **ADR-06** | **Native Date Mirror (`Review Due`)** | Triggering automations off formula fields | Bot copies formula-computed review dates into a native date field on every write. | Platform automations cannot reliably trigger off formula fields; the daily scan silently misses overdue files. |
| **ADR-07** | **Stepped Health Score Deduction (`Needs Review < 80`)** | Linear 1-point-per-day overdue deduction | Non-linear jump at Day 15 to 30 (`-28` pts -> score `72`, below `Healthy >= 80`) forces status into `Needs Review` immediately after an ignored Day-14 escalation. | Linear scoring leaves Days 15 to 20 at `85` to `80` (`Healthy`), masking ignored Day-14 FLM escalations. |
| **ADR-08** | **Single Daily Review Scan (`07:30 UTC`)** | Per-record date trigger automations | Replaces `~1,700` monthly per-record platform automation runs with `30` monthly daily-trigger runs (`98.2%` reduction). | Per-record triggers burn platform automation quotas and scatter escalation logic across untestable UI rules. |
| **ADR-09** | **Native JS SDK Console** | Standalone web app using a Bot service token | Console loads client-side under the signed-in user's identity inside the workspace. | A standalone web app attributes every human admin action to "The Bot," destroying audit attribution. |
| **ADR-10** | **Declarative KPIs + Version Breaks** | Hardcoded dashboard metrics | KPIs live as JSON rows in `T-KPI-03`; filter edits auto-increment `Definition Version`. | Editing a KPI filter silently corrupts historical trend lines by comparing mismatched definitions. |
| **ADR-11** | **Revoke-Before-Grant Mover Protocol** | Granting new market access before revoking old | Departing market tokens are stripped *before* new market grants are provisioned. | Granting first creates a compliance window where a mover holds dual-market access simultaneously. |
| **ADR-12** | **Two-Administrator Continuity Rule** | Single named platform owner | Minimum two named administrators against every credential, secret, and archive surface. | Bus-Factor-1 creates an unrecoverable lockout risk during offboarding or P1 incidents. |

---

## 2. Content Governance Operating Model (RACI)
Governance separates **Platform Integrity** (enforced automatically by the Self-Healing Loop) from **Subject Matter Accuracy** (owned by humans).

| Governance Activity | Agent (AGT) | QA Specialist (QAS) | First Line Mgr (FLM) | Regional Mgr (MGR) | System Admin (ADM) | Exec Sponsor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Content Drafting / Gap Submission** | **R** | C | I | I | I | I |
| **Semantic QA & Publish Approval** | I | **R** | **A** | I | I | I |
| **Review Escalation (Day 14 to 29)** | **R** | C | **A** | I | I | I |
| **Day-30 Auto-Archive Restoration** | I | C | C | **A** | **R** | I |
| **Mover / Leaver Scope Changes** | I | I | **A** | I | **R** | I |
| **Schema / ADR Modification** | I | C | C | C | **R** | **A** |
| **Quarterly External Findability Audit** | I | C | I | **A** | C | I |

*(R = Responsible, A = Accountable, C = Consulted, I = Informed)*

---

## 3. Platform Change Watch Protocol
Waiting for bi-annual review dates fails when an external platform or regulator changes rules mid-quarter. The **Platform Change Watch** intercepts breaking changes out-of-cycle:

1. **Signal Intake:** Regulatory updates, API deprecations, or policy shifts are logged as a Change Watch event with an effective date and affected domain codes (`POL`, `VRT`, `FMT`, `ONB`).
2. **Blast-Radius Query:** Console queries `T1` by folder code and market (`CC`) to produce the exact list of impacted nodes.
3. **Forced Review Override:** Bot sets `Status = Needs Review` and resets `Review Due (native)` to `T + 5 working days` across impacted rows, bypassing standard cadence.
4. **Verification Closure:** Impacted files cannot return to `Active` until `Last Source Verification` is updated against the new primary source and logged in `T10`.

---

## 4. Benefits Realisation & Telemetry Cadence
Value tracking combines automated operational telemetry with external validation:

| Cadence | Metric Surface | Owner | Decision Trigger |
| :--- | :--- | :--- | :--- |
| **Daily** | Console S1 / S4 / S7 (P1 Faults, Archive Queue, State Divergence) | System Admin | Same-day intervention on any Day-30 queue item or F-027/F-028 divergence |
| **Weekly** | `T3` Gap Tracker Frequency Rollup | Market Champions | Top recurring gaps promoted into next sprint backlog |
| **Monthly** | `T-KPI-01` Snapshot Trend + Active Roster Adoption (`>=80%`) | Regional Manager | Trigger targeted enablement if any market drops below 65% monthly active use |
| **Quarterly** | External 30-Query Findability Audit (`>=90%` in <=3 clicks / 1 cmd) | Independent Assessor | Redesign folder taxonomy or `@Bot ask` facet weights if findability drops below 85% |


---

## ADR-010: Single-Repository Static & Interactive Separation (X8)
* **Decision:** Maintain one public repository where the static HonKit documentation build (`_book/`) ships cleanly to GitHub Pages with zero backend dependencies or live AI code (`D10`).
* **Guardrail:** The public static build serves deterministic Replay surfaces and offline editors only, never exposing live proxy URLs or server credentials.

## ADR-011: Standardized Lean Reference Model (X2)
* **Decision:** Replace all employer-derived metrics and proprietary workspace names in public documentation with a transparent, parameterized `100-seat` Lean DMADV reference model across `40` markets and `3,055` public reference nodes (`3,000+` nodes).
* **Rationale:** Eliminates confidentiality risk while allowing engineering leaders and reviewers to verify every calculation directly.

## ADR-012: Self-Hosted ALTCHA Proof-of-Work for Bot Protection (X4)
* **Decision:** Use self-hosted ALTCHA proof-of-work on grant request endpoints instead of third-party CAPTCHA scripts.
* **Rationale:** Preserves zero third-party script requests and zero third-party visitor IP telemetry while running entirely inside stateless server routes.

## ADR-013: Free-Only Config-Driven Model Registry (X7)
* **Decision:** Admit only card-free LLM endpoints that pass a 7-point primary-source admission gate (no payment card, public portfolio demo permitted, documented data/training terms, region noted, RPM/RPD/TPM/context quotas documented, HTTP `429` at limit rather than billing, and JSON mode support recorded) behind a versioned routing config.

## ADR-014: Browser-Native Charts and BI Export Over Server-Side Plotting
* **Decision:** Render interactive SSoT and Syndicate dashboards using self-hosted browser-side JavaScript charts paired with one-click normalized CSV and JSON exports for Tableau and Power BI.
* **Rationale:** Keeps serverless bundles compact and offline-capable while delivering clean datasets directly consumable by enterprise BI tools.
