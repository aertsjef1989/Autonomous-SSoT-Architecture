# XII. Architecture Decision Records & Governance

| Document ID | Pillar | Focus |
| :--- | :--- | :--- |
| `12-Architecture-Decision-Records.md` | IV. Governance & Security | 12 Core ADRs, Governance RACI & Platform Change Watch |

---

## 1. The 12 Architecture Decision Records (ADRs)
Every structural constraint in this architecture exists to prevent a specific silent failure. Each record documents the rejected alternative and the exact failure mode triggered if a future team attempts to simplify it.

| ID | Decision | Rejected Alternative | Architectural Rationale | What Breaks If This Changes |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-01** | **Single Private Space, Two Root Nodes** | Separate spaces for Public and Internal estates | Unifies `3,386` public nodes and `~1,200` internal nodes under one deny-by-default administration surface. | Doubles admin overhead and breaks cross-linking between internal SOPs and the public files they govern. |
| **ADR-02** | **Data Layer vs. Audit Layer App Split** | Single database housing all tables | Isolates bounded operational state (~6,300 rows) from unbounded audit logs (`T10`). | Audit log growth degrades operational queries and prevents read-only managers from saving custom dashboards. |
| **ADR-03** | **Container-Level Permission Inheritance** | Per-document ACL management | Permissions attach to folder containers (`perm_type: "container"`) and inherit on publish move. | Per-document ACLs create untraceable drift across 45 markets and break nightly permission reconciliation. |
| **ADR-04** | **Move-Then-Confirm Async Publish** | Write `Published` state first, then move node | Bot polls async move task and asserts `parent_node_token` *before* writing `Published` to `T1`. | Writing state first produces the "register is lying" failure mode whenever an async move fails silently. |
| **ADR-05** | **Agent Lockdown via Bot Proxy** | Granting frontline agents direct edit rights on `T1` | Agents are strictly View-Only on base tables; state updates execute exclusively via Bot commands. | ~140 users editing cells directly corrupts register integrity and bypasses immutable audit logging. |
| **ADR-06** | **Native Date Mirror (`Review Due`)** | Triggering automations off formula fields | Bot copies formula-computed review dates into a native date field on every write. | Platform automations cannot reliably trigger off formula fields; the daily scan silently misses overdue files. |
| **ADR-07** | **Stepped Health Score Deduction** | Linear 1-point-per-day overdue deduction | Non-linear jump at Day 15–30 (28 pts vs. 20 pts linear) forces status into `Needs Review`. | Linear scoring treats Day 15 and Day 29 as nearly equivalent, masking ignored Day-14 escalations. |
| **ADR-08** | **Single Daily Scan (07:30)** | Per-record date trigger automations | Replaces ~1,700 monthly per-record runs with ~30 centralized batch runs (98% reduction). | Per-record triggers burn automation budgets and scatter escalation logic across untestable UI rules. |
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
| **Review Escalation (Day 14–29)** | **R** | C | **A** | I | I | I |
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
