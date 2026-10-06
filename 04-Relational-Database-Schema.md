# IV. Relational Database Schema
**Document ID:** `04-Relational-Database-Schema.md`  
**Focus:** Relational Architecture, Algorithmic Governance, and Data Integrity  

## 1. Architectural Application Split
The architecture relies on a custom relational database built within the enterprise workspace. To prevent unbounded system logs from polluting operational data, the schema is physically divided across two separate database applications.

| Application | Tables | Growth Profile | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Data Layer** | T1, T2, T3, T4, T5, T-FM-01, T-LG-01, T-KPI-03, T-KPI-01 | Bounded (~6,300 rows by Year 3). Permanent retention. | Holds pure operational state and entity governance. |
| **Audit Layer** | T10, T-KPI-02 | **Unbounded** (Grows with every API action). Truncated at 12 months. | Isolating audit logs allows for granular permission decoupling. It allows a Manager to be strictly read-only on the Data Layer, but hold edit rights in the Audit Layer to save customized dashboard configurations. |

## 2. Strict Relational Build Order
Dependencies dictate the build order. Building out of sequence produces select fields referencing foreign keys that do not yet exist.

    T4        User Access Register      (No dependencies)
     └─ T1        Page Ownership            (Validates Owner against T4)
         └─ T5        Onboarding Tracker        (References T4)
             └─ T3        Gap Tracker               (References T4)
                 └─ T2        Build Tracker             (Mirrors T1 structure)
                     └─ T-FM-01   File Inventory
                         └─ T-LG-01   Language Owners
                             └─ T-KPI-03  KPI Definitions
                                 └─ T-KPI-01  KPI Snapshots    (References T-KPI-03)
                                     └─ T10       Audit Log       (Separate App, built last)

---

## 3. Core Operational Tables

### 3.1 T4: User Access Register (The Matrix Engine)
33 fields. Every table in the system validates ownership against T4. It dictates precise systemic permissions across 45 markets.

| Field | Type | Function / Logic |
| :--- | :--- | :--- |
| `Market Scope` | Multi-Select | Drives every branch permission grant. Values: 45 ISO codes or `ALL`. |
| `Database App Access` | Select | Enforces the Agent Lockdown (View Only). |
| `Console Access` | Select | None, Read, Full. |
| `Dashboard Access` | Select | None, View, Build and Export. |

*Systems Logic:* Console Access and Dashboard Access are distinct fields. This allows a regional owner to be **Read-Only** on base records (preventing accidental edits) while holding **Build and Export** rights to audit their own market metrics. Collapsing them creates a permission bottleneck.

### 3.2 T1: Page Ownership Register (Core Governance)
42 fields. One row per node in the wiki. This is the central nervous system of the architecture.

| Field | Type | Function / Logic |
| :--- | :--- | :--- |
| `Wiki Node Path` | Text | Full path from root. |
| `Owner` | Text | User Handle. Must exist and be Active in T4. |
| `Next Review Due` | Formula | `IF(Cadence='Monthly', Last+30, IF(Cadence='Quarterly', Last+90...))` |
| `Status` | Auto | Derived algorithmic status (Active, Needs Review, Overdue, Archived). |
| `Publication State` | Select | Draft, WIP, Awaiting Approval, Published, Archived. |
| `Wiki Token` / `Obj Token` | Text | **Bot-Owned.** Node/Document identifiers. |
| `Review Due (native)` | Date | **Bot-Owned.** Mirrors `Next Review Due`. |

#### Resolving the "Four Date Field" Ambiguity
Systemic decay happens when review dates are conflated. The schema explicitly separates them:
1. `Last Reviewed Date` (Human): When an owner last verified the file's general accuracy.
2. `Last Source Verification` (Human): When every perishable claim was fact-checked against a primary external source.
3. `Next Review Due` (Formula): Computed date based on the file's assigned cadence.
4. `Review Due (native)` (Bot): Because database automations cannot reliably trigger off formula-derived dates, the Bot copies the formula output into this native date field on every write. This is the only date the automation scanners read.

#### Bot-Owned Field Restrictions
Fields like `Wiki Token`, `Obj Token`, and `Publish Confirmed At` are strictly restricted at the field level. A human write to these fields does not merely get overwritten; it makes the database disagree with the wiki physical state. They are strictly **View-Only** for all users except the System Administrator.

### 3.3 T3: Gap Tracker (Organic Growth Engine)
Records failed or zero-result bot queries. 
*   **The Prioritization Engine:** `Frequency Count` auto-increments when the same question recurs. A question asked once is a curiosity; the same question asked eleven times across four markets automatically becomes the highest priority in the backlog.

---

## 4. Algorithmic Governance

### 4.1 Field 15: Health Score Calculation
The health score is a 0-100 metric calculated via a **stepped** (non-linear) deduction schedule. 

    100
    - IF(ISBLANK([Owner]), 20, 0)
    - IF(COUNTA([Tags Applied]) < 2, 20, 0)
    - IF(ISBLANK([Short Description]), 20, 0)
    - IF([Days Overdue] = 0, 0,
      IF([Days Overdue] <= 14, [Days Overdue],
      IF([Days Overdue] <= 30, 28,
      IF([Days Overdue] <= 40, 36, 40))))

**Architectural Rationale (Stepped vs. Linear):**
At 20 days overdue, a stepped deduction subtracts 28 points, while a linear model subtracts 20. This 8-point divergence straddles the critical 90-point threshold. A file that reaches 20 days overdue has survived a Day-14 escalation without action; the stepped model penalizes this ignored escalation heavily to force a status change to `Needs Review`, whereas a linear model would treat Day 15 and Day 29 as nearly equivalent.

---

## 5. The Measurement Layer (Declarative KPIs)
Databases hold current state, not history. To track metrics over time, the schema utilizes a 3-table Snapshot Engine.

### 5.1 T-KPI-03 (KPI Definitions)
Adding a new KPI is a database row, not a code release. 
*   **The Version Trap:** If a KPI's numerator filter logic is edited, historical trend lines silently corrupt because they compare two different measurements. To mitigate this, `T-KPI-03` auto-increments a `Definition Version` field whenever logic changes. Snapshots record this version, allowing frontend charts to render a physical break marker on the trend line when underlying logic shifts.
*   **Guarding the Scan Cost:** The system estimates the API scan cost before saving a KPI. If a KPI will scan more than 2,000 rows, it automatically locks the `Pre-aggregate` flag, forcing it to run on a scheduled snapshot rather than rendering live and crippling dashboard load times.

---

## 6. Immutable Audit Layer

### 6.1 T10: Bot Interaction Log
Append-only log containing 16 fields. Nothing in the system edits or deletes a row. 

| Event | Logged? |
| :--- | :--- |
| Every bot command (including rejected requests) | Yes |
| Every publish, archive, and reconciliation run | Yes |
| Console batch import, rollback, bulk edit, delete | Yes |
| Console single-record edit | **No.** (Native record history captures this to prevent log bloat). |

**Systemic Rule:** The audit trail is a primary deliverable, not a side-effect. A T10 API write failure is classified as a **P1 Incident**. If T10 stops accepting writes, the platform is unaudited and must halt execution.

---

## 7. Operational Constraints & Enterprise Limits
The schema was designed around rigid vendor constraints.

1. **500 Records Per API Call:** Reads and writes are strictly chunked. Wide scans are pre-aggregated via the snapshot engine.
2. **All-or-Nothing Batch Writes:** A single bad row loses the 500-record payload. Validation executes locally *before* chunking.
3. **Agent Lockdown (`TTK Contributor` Role):** Agents are strictly View-Only on all base tables. Agents trigger updates exclusively via conversational Bot commands (e.g., `@Bot review`), utilizing the Bot's service token to execute the table write on their behalf.
