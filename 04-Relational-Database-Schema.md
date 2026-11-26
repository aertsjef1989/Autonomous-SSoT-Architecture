# IV. Relational Database Schema

**Focus:** 11-Table Relational Split, Foreign-Key Build Order & Algorithmic Governance · **Status:** `Designed`

---

## 1. Architectural Application Split
The architecture specifies a normalized 11-table relational database built within the enterprise workspace (`9` Data Layer tables + `2` Audit Layer tables). To prevent high-frequency audit logs from polluting operational data, the schema is physically divided across two separate database applications.

| Application | Tables | Growth Profile | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Data Layer (`9` tables)** | T1, T2, T3, T4, T5, T-FM-01, T-LG-01, T-KPI-03, T-KPI-01 | Bounded (`~6,300` rows by Year 3). Subject to field-level GDPR retention rules (Chapter VIII). | Holds operational state and entity governance. |
| **Audit Layer (`2` tables)** | T10, T-KPI-02 | **Unbounded** (Grows with logged Bot/batch actions). Append-only within the 12-month active retention window, then exported and purged. | Isolating audit logs allows granular permission decoupling: a Manager remains View-Only on the Data Layer while holding edit rights in the Audit Layer to save dashboard configurations. |

## 2. Strict Relational Build Order
Dependencies dictate the build order across all `11` tables (`9` Data Layer + `2` Audit Layer). Building out of sequence produces select fields referencing foreign keys that do not yet exist.

    T4        User Access Register      (No dependencies)
     └─ T1        Page Ownership            (Validates Owner against T4)
         └─ T5        Onboarding Tracker        (References T4)
             └─ T3        Gap Tracker               (References T4)
                 └─ T2        Build Tracker             (Mirrors T1 structure)
                     └─ T-FM-01   File Inventory
                         └─ T-LG-01   Language Owners
                             └─ T-KPI-03  KPI Definitions
                                 └─ T-KPI-01  KPI Snapshots    (References T-KPI-03)
                                     └─ T10 & T-KPI-02  Audit Log & Audit KPI Views (Audit Layer App, built last)

---

## 3. Core Operational Tables

### 3.1 T4: User Access Register (The Matrix Engine)
33 fields. Every table in the system validates ownership against T4. It dictates precise systemic permissions across the `40` reference markets.

| Field | Type | Function / Logic |
| :--- | :--- | :--- |
| `Market Scope` | Multi-Select | Drives every branch permission grant. Values: `40` reference ISO codes or `ALL`. |
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

## 4. Algorithmic Governance & Sizing Reconciliation

### 4.1 Field 15: Health Score Calculation (`v2` Stepped vs. Rejected `v1` Linear)
The health score is a `0-100` metric with canonical status threshold **`Healthy >= 80`** and **`Needs Review < 80`**:

    100
    - IF(ISBLANK([Owner]), 20, 0)
    - IF(COUNTA([Tags Applied]) < 2, 20, 0)
    - IF(ISBLANK([Short Description]), 20, 0)
    - IF([Days Overdue] = 0, 0,
      IF([Days Overdue] <= 14, [Days Overdue],
      IF([Days Overdue] <= 30, 28,
      IF([Days Overdue] <= 40, 36, 40))))

**Corrected Architectural Rationale (`Healthy >= 80` Threshold):**
Assuming complete metadata (`100` base points before overdue deductions):
* At **Day 15**, a file has just ignored its **Day-14 FLM Escalation Card**. Under the rejected linear model (`v1`: `-1 pt/day`, capped at `40`), Day 15 scores **`85`** and Day 20 scores **`80`**, both remaining in the `Healthy >= 80` band and masking the ignored escalation until Day 21.
* Under the **stepped `v2` model**, crossing Day 14 jumps the deduction immediately to **`-28` points** (score **`72`**, `< 80`), forcing `Status = Needs Review` on Day 15. Note the explicit trade-off: the stepped schedule scores Day 15 (`72`) and Day 29 (`72`) identically within the escalation band because operational urgency inside Days 15 to 29 is driven by the Day-30 archive countdown (`SC-002`) rather than single-point score ticks.
* **Why `31-40` (`-36`) and `>40` (`-40`) Tiers Exist:** Under standard `SC-002` automation, overdue files auto-archive at midnight on Day 30, making Days `31+` unreachable in normal flow. Those two upper brackets activate only when an Administrator applies an explicit `Legal / Incident Hold` flag that suspends auto-archiving while keeping the stale file visibly penalized (`64` and `60`).

| Days Overdue | Escalation Stage | Linear `v1` Score (`100 - MIN(40, d)`) | Stepped `v2` Score | `v2` Derived Status (`Healthy >= 80`) |
| ---: | :--- | ---: | ---: | :--- |
| `0` | Within cadence | `100` | `100` | `Healthy` (`>= 80`) |
| `5` | Owner reminder (`Days 1-13`) | `95` | `95` | `Healthy` (`>= 80`) |
| `10` | Owner reminder (`Days 1-13`) | `90` | `90` | `Healthy` (`>= 80`) |
| `14` | FLM Escalation Card sent | `86` | `86` | `Healthy` (`>= 80`) |
| `15` | Post-escalation window | `85` *(stays Healthy)* | **`72`** | **`Needs Review` (`< 80`)** |
| `20` | Post-escalation window | `80` *(stays Healthy)* | **`72`** | **`Needs Review` (`< 80`)** |
| `25` | Pre-archive warning | `75` | **`72`** | **`Needs Review` (`< 80`)** |
| `29` | Final full day | `71` | **`72`** | **`Needs Review` (`< 80`)** |
| `30` | Console S7 Archive Queue | `70` | **`72`** | `Archived` at midnight (unless Admin Hold) |
| `35` | Reachable only under Admin Hold | `65` | `64` | `Needs Review (Hold)` |
| `40+` | Reachable only under Admin Hold | `60` | `60` | `Needs Review (Hold)` |

### 4.2 Year-3 Data Layer Row-Count Reconciliation (`~6,300` Rows)
Under the `40-market`, `100-seat` reference model (`3,055` public nodes + `1,200` launch internal nodes = `4,255` launch `T1` rows, where internal is `1,200 / 4,255 = 28.2%` at launch and grows to `2,000 / 5,055 = 39.6%` by Year 3):

| Table | Layer | Launch Rows | Modeled Year-3 Rows | Sizing Basis |
| :--- | :--- | ---: | ---: | :--- |
| **`T1` Page Ownership** | Data | `4,255` | `5,055` | `3,055` public (`40 * 75 + 55 GLB`) + `2,000` Year-3 internal nodes |
| **`T2` Build Tracker** | Data | `400` | `250` | Active wave/sprint production rows (completed waves archived) |
| **`T3` Gap Tracker** | Data | `40` | `350` | Deduplicated recurring content-gap records across `40` markets |
| **`T4` User Access** | Data | `100` | `100` | Standardized `100-seat` active roster (departed rows purged at +30d per Ch. VIII) |
| **`T5` Onboarding** | Data | `25` | `100` | Active/recent cohort milestone records (subject to Ch. VIII retention) |
| **`T-FM-01` File Inventory** | Data | `120` | `150` | Legacy discovery hub & asset manifest records |
| **`T-LG-01` Language Owners** | Data | `40` | `40` | One primary regional/language owner row per reference market |
| **`T-KPI-03` KPI Definitions** | Data | `21` | `25` | Versioned declarative KPI numerator/denominator rules |
| **`T-KPI-01` KPI Snapshots** | Data | `24` | `230` | Pre-aggregated weekly/monthly metric snapshots across 3 years |
| **Data Layer Total (`9` tables)** | **Data** | **`5,025`** | **`6,300`** | **Bounded operational footprint (`<15%` of enterprise table limits)** |
| **`T10` & `T-KPI-02` (`2` tables)** | **Audit** | Unbounded | ~`90,000 / yr` | Append-only within 12-month active window, then exported & purged |

---

## 5. The Measurement Layer (Declarative KPIs)
Databases hold current state, not history. To track metrics over time, the schema utilizes the 3-table Snapshot Engine (`T-KPI-03` definitions in Data Layer, `T-KPI-01` operational snapshots in Data Layer, and `T-KPI-02` audit/dashboard views in Audit Layer).

### 5.1 T-KPI-03 (KPI Definitions)
Adding a new KPI is a database row, not a code release. 
*   **The Version Trap:** If a KPI's numerator filter logic is edited, historical trend lines silently corrupt because they compare two different measurements. To mitigate this, `T-KPI-03` auto-increments a `Definition Version` field whenever logic changes. Snapshots record this version, allowing frontend charts to render a physical break marker on the trend line when underlying logic shifts.
*   **Guarding the Scan Cost:** The system estimates the API scan cost before saving a KPI. If a KPI will scan more than 2,000 rows, it automatically locks the `Pre-aggregate` flag, forcing it to run on a scheduled snapshot rather than rendering live and crippling dashboard load times.

---

## 6. Audit Layer Consistency & Retention Semantics

### 6.1 T10: Bot Interaction Log (`Append-Only Within Retention Window`)
`T10` contains 16 fields and is **append-only within its 12-month active retention window**: application roles hold zero `UPDATE` or `DELETE` privileges on individual rows, and at the 12-month boundary a scheduled administrative job exports a signed archive to EU object storage before purging expired partitions. *(Similarly, Data Layer tables are not "kept forever" indiscriminately: personal data fields in `T4`, `T5`, and `Area 15` follow the field-level GDPR retention and anonymization schedules in Chapter VIII.)*

| Event | Logged to `T10`? |
| :--- | :--- |
| Every bot command (including rejected / out-of-scope requests) | **Yes** |
| Every publish, archive, and scheduled reconciliation run (`SC-001`..`SC-005`) | **Yes** |
| Console batch import, rollback, bulk edit, bulk delete | **Yes** |
| Console single-record UI edit | **No** (captured by native platform record history to avoid duplicating cell-level diffs). |

### 6.2 Degraded (`F-013a`) vs. Halted (`F-013b`) Audit States
To reconcile high availability with strict auditability (`DT-001`):
*   **Degraded Mode (`F-013a`, P2 Warning):** When `T10` experiences transient API retry latency (`>90s` acknowledgment delay), the Bot buffers signed audit rows in durable worker queue memory (up to `15 minutes` / `500` events) while read queries and read-only scanners continue uninterrupted.
*   **Halted Mode (`F-013b`, P1 Outage):** If `T10` persistently rejects writes (credential revocation, schema lock, or buffer exhaustion), all state-mutating Bot commands and Console batch writes **halt fail-closed** until `T10` write confirmation is restored.

---

## 7. Operational Constraints & Batch Limits
1. **500 Records Per API Call:** Reads and writes are strictly chunked. Wide scans are pre-aggregated via the snapshot engine.
2. **All-or-Nothing Batch Writes:** A single bad row fails the 500-record payload. Validation executes locally *before* chunking.
3. **Agent Lockdown (`AGT` Role):** Agents (`60` seats in the `100-seat` reference model) are strictly View-Only on all base tables and execute state updates exclusively via conversational Bot commands (`@Bot review`, `@Bot gap`).
