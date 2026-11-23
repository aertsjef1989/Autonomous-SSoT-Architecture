# XII. Architecture Decision Records & Governance
**Document ID:** `12-Architecture-Decision-Records.md`  
**Focus:** The 12 Core ADRs, Content Governance Operating Model, and Platform Change Watch  

## 1. The 12 Architecture Decision Records (ADRs)
Every structural constraint in this system exists to prevent a specific silent failure. **Do not simplify any decision below without evaluating the fourth column.**

| # | Decision | Architectural Rationale | What Breaks If This Changes |
| :--- | :--- | :--- | :--- |
| **ADR-01** | **Single Private Space, Two Root Nodes** | Unifies Public (`3,386` nodes) and Internal (`~1,200` nodes) under one deny-by-default admin surface. | Splitting spaces doubles admin overhead and breaks cross-linking between internal SOPs and public files. |
| **ADR-02** | **Data Layer vs. Audit Layer App Split** | Isolates bounded operational state (~6,300 rows) from unbounded audit logs (`T10`). | Audit log growth degrades operational query performance and prevents read-only managers from saving custom dashboards. |
| **ADR-03** | **Move-Based Permission Inheritance** | Permissions attach to folder containers (`perm_type: "container"`) and inherit on publish move. | Per-document ACLs create unmanageable drift across 45 markets and break nightly reconciliation. |
| **ADR-04** | **Move-Then-Confirm Async Publish** | Bot polls async move task and verifies `parent_node_token` *before* writing `Published` to `T1`. | Writing state first creates the "register is lying" failure mode when a move fails silently. |
| **ADR-05** | **Agent Lockdown via Bot Proxy** | Frontline agents are strictly View-Only on `T1`; state updates execute exclusively via Bot commands. | ~140 users editing cells directly corrupts register integrity and bypasses audit logging. |
| **ADR-06** | **Native Date Mirror (`Review Due`)** | Bot copies formula-computed review dates into a native date field on every write. | Platform automations cannot reliably trigger off formula fields; the daily scan silently misses overdue files. |
| **ADR-07** | **Stepped Health Score Deduction** | Non-linear penalty at Day 15–30 (28 pts vs. 20 pts linear) forces status into `Needs Review`. | Linear scoring treats Day 15 and Day 29 as nearly equivalent, masking ignored Day-14 escalations. |
| **ADR-08** | **Single Daily Scan (07:30)** | Replaces per-record triggers (~1,700 runs/mo) with one centralized batch scan (~30 runs/mo). | Per-record triggers burn automation budgets and scatter escalation logic across untestable UI rules. |
| **ADR-09** | **Native JS SDK Console** | Admin Console loads client-side under the signed-in user's identity rather than a service token. | A standalone web app attributes every human admin change to "The Bot," destroying audit attribution. |
| **ADR-10** | **Declarative KPIs + Version Breaks** | KPIs live as JSON rows in `T-KPI-03`; filter edits auto-increment `Definition Version`. | Editing a KPI filter silently corrupts historical trend lines by comparing mismatched definitions. |
| **ADR-11** | **Revoke-Before-Grant Mover Protocol** | Departing market tokens are stripped *before* new market grants are provisioned. | Granting first creates a compliance window where a mover holds dual-market access simultaneously. |
| **ADR-12** | **Two-Administrator Continuity Rule** | Minimum two named administrators against every credential and archive surface. | Bus-Factor-1 creates an unrecoverable lockout risk during offboarding or P1 incidents. |

---

## 2. Content Governance Operating Model
Governance is split cleanly between **Platform Integrity** (automated) and **Subject Matter Accuracy** (human-owned):
*   **Ownership:** Every published node must map to an `Active` user in `T4`. Orphaned ownership triggers an automated metadata fault within 24 hours.
*   **Platform Change Watch:** Quarterly external platform or regulatory changes are logged centrally and mapped to affected folder codes (`POL`, `VRT`, `FMT`), triggering targeted out-of-cycle verification runs rather than waiting for bi-annual review dates.
*   **Benefits Realisation:** Tracked via the 3-table Snapshot Engine (`T-KPI-01` / `T-KPI-03`) paired with quarterly external Findability audits (the only metric that fails silently).
