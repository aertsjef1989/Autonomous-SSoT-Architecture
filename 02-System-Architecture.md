# II. System Architecture, Schema and Build Specification

**Focus:** Topology, Schema, Bot Operations, Console & Disaster Recovery · **Status:** `Designed` (Interactive flows: `Prototype`)

---

## 1. Purpose and Scope
This is the target architecture specification (`[Status: Designed]`) for the Autonomous Knowledge Architecture: a standardized enterprise advertising knowledge library modeling `3,055` public reference files (`3,000+` nodes across `40` reference markets) plus a governed internal operations layer (`~1,200` initial legacy documents), deployed in a private workspace wiki space, governed by a normalized 11-table relational database, and operated via an authenticated conversational application (`Bot`).

**Two different starting states.** The public layer is greenfield: nothing exists initially, and files are drafted with AI assistance after primary-source claim verification by human reviewers. The internal layer models a legacy estate: documents spread across multiple owners with inconsistent ACLs, requiring scripted discovery, consolidation, and container-level permission repair.

---

## 2. Platform Prerequisites (`[Status: Designed]`)
Established as pre-implementation readiness gates.

| # | Prerequisite | Gate Type | Architectural Rationale |
|---|---|---|---|
| P1 | **Enterprise Relational Tier** | **HARD GATE** | Requires high-capacity relational tables (tens of thousands of rows per table), batched REST API access, field-level permission controls, and enterprise monthly automation quotas. |
| P2 | **EU Data Residency** | **HARD GATE** | Reference operation is EU-headquartered. EU server residency is a mandatory compliance requirement. |
| P3 | **Granular Permissions** | **HARD GATE** | Requires record-level conditions, field-level write locks, and dynamic role assignment. |
| P4 | **Agent Lockdown** | **DESIGN GATE** | Base tables are strictly View-Only for frontline agents (`AGT`). State-changing writes execute exclusively through the Bot layer. |

---

## 3. Content Architecture & Topology

### 3.1 Space Topology
One private team space, two root nodes.

*   **Visibility:** Private. Nodes are invisible to workspace members until container access is explicitly granted, establishing a deny-by-default access boundary.
*   **Root node 1:** `Public_Information_Layer` (Greenfield reference model: `3,055` nodes across `40` markets + `GLB`).
*   **Root node 2:** `Internal_Operations_Layer` (Legacy migration model: `~1,200` initial nodes, scaling to `~2,000` by Year 3).

*A second space would double the administration surface and break cross-linking between an internal SOP and the public file it governs. Hence, two root nodes within one space.*

### 3.2 Folder Tree & File Limits
Deepest public content path is 5 levels. The reference structure models `40` markets across 3 regions (EMEA, MENA, LATAM), with `75` market-specific files per country (`3,000` market nodes) plus `55` global (`GLB`) files (`3,055` public nodes total).

    Enterprise_WikiSpace/                                  
    │
    ├── Public_Information_Layer/                          
    │   ├── 00_INDEX.md                                    
    │   ├── 01_Campaigns/ (12 files/country)               
    │   │   ├── EMEA/{NL,BE,DE,FR...}/
    │   │   ├── MENA/{SA,AE,EG...}/
    │   │   └── LATAM/{BR,MX,CO...}/
    │   ├── 02_Verticals/ (30 files/country)               
    │   ├── 03_Policy/ (15 files/country)                  
    │   ├── 04_Markets/ (2 files/country)                  
    │   ├── 05_Formats_and_Tools/GLB/ (35 files, Global)   
    │   ├── 06_Templates/GLB/ (20 files, Global)           
    │   ├── 07_Lifecycle/ (8 files/country)                
    │   └── 08_Onboarding/ (8 files/country)               
    │
    └── Internal_Operations_Layer/                         
        └── 15 areas, 5 internal access tiers (I-0 to I-4), 3 naming patterns

### 3.3 Strict Naming Convention
`ENT_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md`

| Element | Rule | Values |
|---|---|---|
| `ENT` | Fixed prefix | Standardized `ENT` (Enterprise) prefix |
| `FOLDER` | Three-letter folder code | `CAM`, `VRT`, `POL`, `MKT`, `FMT`, `TPL`, `LIF`, `ONB` |
| `CC` | ISO country code, or `GLB` | Any of the `40` reference ISO codes, or `GLB` |
| `COUNTER` | Zero-padded 3 digits. Resets per country/folder | `001` to `035` |
| `TOPIC` | Title case, underscores | e.g., `Financial_Services` |

---

## 4. The Internal Operations Layer
At initial baseline, the internal layer represents `28.2%` of total nodes (`1,200 / 4,255`) and is modeled to reach `~39.6%` by Year 3 (`2,000 / 5,055`).

### 4.1 Migration via Scripted Discovery (`[Status: Designed]`)
Migration is a scanner problem before it is a content problem.
1. **D1:** Enumerate every legacy document via the workspace Document Storage API.
2. **D2:** Read current permission state per document (identifying broken per-file ACLs).
3. **D3:** Extract inbound/outbound link graph to identify "Link Hubs". Moving a hub without mapping its inbound links breaks navigation silently.
4. **D4:** Cluster by title similarity for deduplication.

### 4.2 The 15 Governance Areas & Access Tiers
Every internal file inherits its read/write tier directly from the container area (`I-0` through `I-4`). **Per-document ACLs are stripped during migration.**

| Area | Code | Read Tier | Write Tier | Growth | Review Cadence |
|---|---|---|---|---|---|
| `01_SOPs` | SOP | I-1 (All) | I-3 (Reviewer) | Slow | Bi-Annual |
| `03_Internal_Updates` | UPD | I-1 | I-3 | High | **None. Archive/Retention instead** |
| `05_Meeting_Notes` | MTG | Varies | Varies | Very High | **None. Archive/Retention instead** |
| `07_Escalations` | ESC | I-1 | I-2 | High | **None. Archive/Retention instead** |
| `11_Client_Accounts` | ACC | I-2 (Market Scoped) | I-3 (Market Scoped) | High | Quarterly |
| `12_Compliance` | LEG | I-3 | I-4 (Restricted) | Low | Bi-Annual |
| `13_Confidential` | CNF | I-4 (Restricted Admin/Exec) | I-4 | Low | Annual |
| `15_Personal_Space` | PER | I-0 (Owner Only) | I-0 | Medium | None |

---

## 5. Permission & Access Model
Permissions attach to folder nodes using `perm_type: "container"`. Documents inherit at the moment they land. A nightly API reconciliation job keeps them correct thereafter.

### 5.1 Operating Role Model
A user holds exactly one role and any number of market scopes.

| Role | Scope Pattern | Database Table Rights | Bot Access |
|---|---|---|---|
| **Agent (AGT)** | 1 to 2 markets | View Only (Exceptions for own records) | Standard |
| **QA Specialist (QAS)** | 4 to 12 markets | Edit (Market Scoped) | Extended |
| **First Line Manager (FLM)**| 2 to 12 markets | Edit (Market Scoped) | Extended |
| **Manager (MGR)** | Region or ALL | View (Global) / Edit (Internal) | Extended |
| **Upper Mgmt (UPM)** | ALL | Full Access | Extended |
| **Administrator (ADM)** | ALL | Full CRUD & Schema Rights | Admin |

### 5.2 The State Gate (Market Scope Override)
Effective access to a document is the narrowest of three things: (1) Role Capability, (2) Node Location Grant, (3) Publication State.

| Publication State | Node Location | Who Can Open It | Market Scope Applies? |
|---|---|---|---|
| **Draft / WIP** | `_STAGING/[Region]/[CC]/` | Owner + Scoped Reviewers/Admins | Yes |
| **Awaiting Approval** | `_STAGING/[Region]/[CC]/` | Owner + Scoped Reviewers/Admins | Yes |
| **Published** | Live Market Branch | Everyone scoped to that market | Yes |
| **Archived** | `_ARCHIVE/` | Administrators only | No |

---

## 6. Relational Database Schema (The 11-Table Engine)
The governance architecture enforces a strict foreign-key build order across `11` tables (`9` Data Layer + `2` Audit Layer; full build tree in Chapter IV):

`T4 (User Access) -> T1 (Page Ownership) -> T5 (Onboarding) -> T3 (Gap Tracker) -> T2 (Build Tracker) -> T-FM-01 -> T-LG-01 -> T-KPI-03 -> T-KPI-01 -> T10 & T-KPI-02 (Audit Layer)`

### 6.1 T1: Page Ownership Register (Core Governance)
*Selected critical fields out of 42 total.*

| Field | Type | Required | Values / Formula / Logic |
|---|---|---|---|
| `Page Title` | Text | Yes | Exact wiki page title. |
| `Owner` | Text | Yes | Handle. Must validate against T4. |
| `Next Review Due` | Formula | Auto | `IF(Cadence='Monthly', Last+30, IF(Cadence='Quarterly', Last+90...))` |
| `Health Score` (`v2` Stepped) | Formula | Auto | `100 - IF(Owner='',20,0) - IF(Tags<2,20,0) - IF(Desc='',20,0) - SteppedOverdue(0, 1..14->d, 15..30->28, 31..40->36, >40->40)`; `Healthy >= 80`, `Needs Review < 80` (see Chapter IV). |
| `Publication State` | Select | Yes | Draft, WIP, Awaiting Approval, Published, Archived. |
| `Market (CC)` | Select | Yes | Routes the branch grant. |
| **`Review Due (native)`** | **Date** | **Bot** | **Mirrors computed Next Review Due. Trigger fields must be native dates, not formulas.** |
| `Permission Last Asserted`| Date | Auto | Written by the nightly reconciliation job (`SC-004`). |

### 6.2 T4: User Access Register (Matrix Engine)
Dictates exact systemic permissions. 

| Field | Type | Function |
|---|---|---|
| `Database App Access` | Select | Enforces the Agent Lockdown (View Only). |
| `Bot Command Access` | Select | Standard, Extended, Admin. |
| **`Market Scope`** | **Multi-Select** | **Drives every branch grant. Values: The `40` reference ISO codes or `ALL`.** |

### 6.3 T10: Bot Interaction Log (Audit Trail)
Bot commands, publish/archive moves, reconciliation jobs, and Console bulk operations write here (single-record Console edits rely on native record history per Chapter IV).

| Field | Type | Function |
|---|---|---|
| `Interaction ID` | Auto | `BOT-YYYYMMDD-HHMMSS-NNN` |
| `Command / Workflow` | Text | e.g. `PUBLISH`, `ARCHIVE`, `RECONCILE`, `SCAN_REVIEW` |
| `Input Parameters` | Text | Sanitised command parameters |
| `Fault ID` | Text | F-001 to F-029 (Identifies systemic breakdowns) |
| `Error Code` | Text | API error code if failed (e.g., 429 Rate Limit) |

---

## 7. Document Lifecycle & State Machine

### 7.1 Asynchronous Publish Sequence
Publishing is a physical node move, not a permission change. It is executed asynchronously to prevent API timeout race conditions.

1. Reviewer approves via interactive webhook card.
2. Server ACKs the callback within 3 seconds to satisfy platform timeout limits.
3. Bot queries the API for the target node token.
4. Bot executes the document move operation.
5. **Critical Verification:** Bot polls the async task ID. Once complete, it queries the node again to assert `parent_node_token` matches the intended market folder.
6. **Commit:** ONLY upon verification does the Bot write `Publication State = Published` to T1.
7. Document dynamically inherits the market branch permissions.
8. Bot writes `PUBLISH` transaction to T10.

---

## 8. Bot & API Layer Operations

### 8.1 API Throttling & Fault Tolerance
*   **Batch Writes:** T1 and T2 updates are chunked at 500 records per batch call with whole-chunk rollback handling.
*   **429 Backoff:** The system detects HTTP 429 (Rate Limit Exceeded) responses, reads the suggested wait-time header, and implements an exponential backoff sequence (Max 5 retries before logging F-011 Fault).

### 8.2 Core Conversational Commands
Agents operate the library via DM or channel commands (`14` total commands documented in Chapter VI: `7` core utilities + `7` domain extensions).

| Command | Action / Resolution |
|---|---|
| `@Bot ask [query]` | Quick-answer endpoint. Facet-extracts the query, searches T1, returns the single best file link plus a 2-line text extract. |
| `@Bot check [vertical] [market]`| Fast compliance screen. Returns policy tier and gating requirements. |
| `@Bot gap [question]` | Autonomously writes a T3 Gap Tracker record and notifies the market lead for content creation. |
| `@Bot reconcile [CC]` | Admin-only. Triggers manual on-demand state and permission reconciliation. |

---

## 9. Operational Integrity (Self-Healing Sub-Routines)

### 9.1 Database vs. Wiki State Reconciliation (`SC-003`)
Because wiki node moves are asynchronous and emit no webhooks, the Database and the Wiki can diverge silently. 
*   **Forward Check:** Queries all T1 rows marked `Published`, fetches the actual wiki node via API, and asserts the parent node matches the expected folder. Detects F-027 (Published in Database, stuck in Staging).
*   **Reverse Check:** Enumerates children of every live market folder. Asserts each has a corresponding `Published` T1 row. Detects F-028 (Live in Wiki, missing from Database).

### 9.2 The Mover Protocol (`DT-002`)
When a user changes market scopes in T4, the system must sever old access to prevent privilege accumulation.
1. **Revoke First:** Script enumerates departing market branch tokens and executes permission-member delete.
2. **Grant Second:** Standard provisioning script runs for the new market scope.
3. **Reassign Ownership:** Bot queries T1 for records owned by the mover in the old scope and triggers an interactive card to the FLM to reassign file ownership. 

---

## 10. Console (Custom Application Interface)
Console (`[Status: Designed]`, interactive specification `[Status: Prototype]`) is the administrative operating surface for the platform, designed as a custom frontend application loading directly inside the database interface via a native JS SDK.

**Architectural Decision: Why a native JS SDK instead of a Standalone Web App?**
A standalone web app writing via a service token attributes every system change to "The Bot". A native JS SDK loads client-side and runs under the signed-in user's identity. This preserves human attribution in the record history, a strict requirement for enterprise auditability.

**Console Capabilities:**
*   **Batch Import & Dry Run:** Chunked 500-record bulk imports with full rollback handling. Validates every row locally before attempting API writes.
*   **Permission Inspection:** Reverse lookup mapping showing effective access limits for any user, resolving the delta between Role, Branch Grant, and Publication State.
*   **Publish Queue Management:** Surfacing orphaned nodes (F-028) and stuck publishes (F-027) with 1-click re-issue capabilities.

---

## 11. Measurement & Declarative KPIs
Database tables hold current state, not history. The platform requires a snapshot engine to track trends. 

**The Version Trap Mitigation:**
If a KPI definition (e.g., "Files overdue") changes its filter criteria, historical trend lines silently corrupt because they compare two different measurements. 
*   **Solution:** KPIs are defined declaratively as JSON data in `T-KPI-03`. Any change to a KPI's filter logic automatically increments the `Definition Version`. Trend charts spanning a version change show a physical break marker on the UI, preventing confident but factually wrong reporting.

---

## 12. Disaster Recovery & Rollback (`[Status: Designed]`)

The architecture specifies external extraction to satisfy enterprise RTO/RPO targets, rather than relying on time-bounded native platform trash or restore windows.

| Element | Specification |
|---|---|
| **Database Export** | Nightly. All operational tables export to CSV/XLSX via the scheduled export API. |
| **Document Export** | Weekly. Full document content exported to DOCX/PDF. |
| **Structural Map** | Weekly. Full branch map (Node tokens, paths, permission grants) exported to JSON. |
| **Destination** | EU-region external object store (preserves residency outside the workspace vendor environment). |
| **RPO / RTO** | **RPO:** 24 hours. **RTO:** 8 hours for Database, 48 hours for document corpus. |
| **Pre-Destructive Rule** | Any bulk deletion or state rollback requires a fresh, verified export before the script executes. |

---

## 13. Target Deployment Rollout Sequence (`[Status: Designed]`)
Specified as a **9-stage gated rollout sequence (`Stage 0` through `Stage 8`)** to isolate failure modes before multi-market scale-out:

1. **Stage 0 (Sandbox Stress Test):** Stress-test child-node and tree-depth limits using synthetic fixtures.
2. **Stage 1 (Container Skeleton):** Provision the dual-root private space, staging branches, and archive container.
3. **Stage 2 (Relational Schema):** Deploy all `11` tables across the Data Layer (`9` tables) and Audit Layer (`2` tables) in strict foreign-key order.
4. **Stage 3 (Access Matrix Seeding):** Seed `T4` with the standardized `100-seat` reference team (`6` operating roles) and verify Agent Lockdown (`AGT` View-Only).
5. **Stage 4 (Bot & Webhook Harness):** Deploy conversational handlers, 3-second callback ACK queues, and HTTP `429` exponential backoff harnesses.
6. **Stage 5 (Automated Control Loop):** Enable the `5` scheduled scanners, `5` event detectors, and external dead-man heartbeat monitor in shadow mode.
7. **Stage 6 (Single-Market Validation Gate):** Publish all `75` standard market templates for one reference pilot market (e.g., `NL`) and hold exit criteria across a 14-day burn-in target.
8. **Stage 7 (Multi-Market Wave Scale-Out):** Expand across the remaining `39` reference markets while running parallel Document Storage API discovery (`D1` to `D4`) on legacy internal folders.
9. **Stage 8 (Internal Estate Migration):** Strip legacy per-document ACLs and relocate internal files into the `15` container-governed areas (`I-0` to `I-4`).
