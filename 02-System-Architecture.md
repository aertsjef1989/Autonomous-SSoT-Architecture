# II. System Architecture, Schema and Build Specification

**Document ID:** `02-System-Architecture.md`  
**Status:** Approved. Master reference for the Architecture suite.  
**Track:** Engineering & Infrastructure  

## 1. Purpose and Scope
This is the master specification for the Autonomous Knowledge Architecture: an enterprise advertising knowledge library of 3,386 public files plus a governed internal layer, deployed in a workspace wiki space, governed by a custom relational database, and operated by a custom conversational application (`Bot`).

**Two different starting states.** The public layer is greenfield: nothing exists, and files are generated with AI assistance then verified by a human. The internal layer is not: the content already exists as legacy docs spread across multiple owners, cross-linked, with inconsistent permissions. There, the work is triage, consolidation, and permission repair.

---

## 2. Platform Prerequisites
Established before any build work. Two are hard gates.

| # | Prerequisite | Status | Architectural Rationale |
|---|---|---|---|
| P1 | **Enterprise Plan Tier** | **CLOSED** | Requires 50,000 rows per table, unlimited Basic API calls, full advanced permission depth, and 500,000 automation runs per month. |
| P2 | **Data Residency** | **CLOSED** | Operation is Lisbon-based. EU server residency is a hard legal requirement. |
| P3 | **Advanced Permissions** | **CLOSED** | Requires full depth: record-level conditions, field-level restrictions, and dynamic role assignment. |
| P4 | **Agent Lockdown** | **GATE** | Database tables strictly read-only for agents. Write operations forced through the Bot layer. |

---

## 3. Content Architecture & Topology

### 3.1 Space Topology
One private team space, two root nodes.

*   **Visibility:** Private. Nodes are invisible to the tenant until access is explicitly granted. Foundation of the "deny-by-default" access model.
*   **Root node 1:** `Public_Information_Layer` (Greenfield, 3,386 nodes).
*   **Root node 2:** `Internal_Operations_Layer` (Legacy, ~1,200 nodes).

*A second space would double the administration surface and break cross-linking between an internal SOP and the public file it governs. Hence, two root nodes within one space.*

### 3.2 Folder Tree & File Limits
Deepest public content path is 5 levels. The structure spans 45 markets across 3 regions (EMEA, MENA, LATAM).

    Enterprise_WikiSpace/                                  
    │
    ├── Public_Information_Layer/                          
    │   ├── 00_INDEX.md                                    
    │   ├── 01_Campaigns/ (12 files/country)               
    │   │   ├── EMEA/{NL,BE,DE,FR...}/
    │   │   ├── MENA/{SA,AE,EG...}/
    │   │   └── LATAM/{BR,MX,CO...}/
    │   ├── 02_Verticals/ (31 files/country)               
    │   ├── 03_Policy/ (15 files/country)                  
    │   ├── 04_Markets/ (1 file/country)                   
    │   ├── 05_Formats_and_Tools/GLB/ (35 files, Global)   
    │   ├── 06_Templates/GLB/ (20 files, Global)           
    │   ├── 07_Lifecycle/ (8 files/country)                
    │   └── 08_Onboarding/ (7 files/country)               
    │
    └── Internal_Operations_Layer/                         
        └── 15 areas, 6 access tiers, 3 naming patterns   

### 3.3 Strict Naming Convention
`ENT_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md`

| Element | Rule | Values |
|---|---|---|
| `ENT` | Fixed prefix | Always `ENT` (Enterprise) |
| `FOLDER` | Three-letter folder code | `CAM`, `VRT`, `POL`, `MKT`, `FMT`, `TPL`, `LIF`, `ONB` |
| `CC` | ISO country code, or `GLB` | Any of the 45 ISO codes, or `GLB` |
| `COUNTER` | Zero-padded 3 digits. Resets per country/folder | `001` to `031` |
| `TOPIC` | Title case, underscores | e.g., `Financial_Services` |

---

## 4. The Internal Operations Layer
The internal layer is roughly a third of the total file count at launch and scales to half by year three. 

### 4.1 Migration via Scripted Discovery
Migration is a scanner problem before it is a content problem.
1. **D1:** Enumerate every legacy doc via the Drive API.
2. **D2:** Read current permission state per document (identifying broken ACLs).
3. **D3:** Extract inbound/outbound link graph to identify "Link Hubs". Moving a hub without mapping its inbound links breaks navigation silently.
4. **D4:** Cluster by title similarity for deduplication.

### 4.2 The 15 Governance Areas & Access Tiers
Every internal file inherits its read/write tier directly from the container area. **Per-document ACLs are strictly stripped during migration.**

| Area | Code | Read Tier | Write Tier | Growth | Review Cadence |
|---|---|---|---|---|---|
| `01_SOPs` | SOP | I-1 (All) | I-3 (Reviewer) | Slow | Bi-Annual |
| `03_Internal_Updates` | UPD | I-1 | I-3 | High | **None. Archive/Retention instead** |
| `05_Meeting_Notes` | MTG | Varies | Varies | Very High | **None. Archive/Retention instead** |
| `07_Escalations` | ESC | I-1 | I-2 | High | **None. Archive/Retention instead** |
| `11_Client_Accounts` | ACC | I-2 (Market Scoped) | I-3 (Market Scoped) | High | Quarterly |
| `12_Compliance` | LEG | I-3 | I-5 | Low | Bi-Annual |
| `13_Confidential` | CNF | I-5 (Admin Only) | I-5 | Low | Annual |
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

## 6. Relational Database Schema (The Engine)
The governance architecture relies on a strict build order. 

`T4 (User Access) -> T1 (Page Ownership) -> T5 (Onboarding) -> T3 (Gap Tracker) -> T2 (Build Tracker) -> T10 (Bot Interaction Log)`

### 6.1 T1: Page Ownership Register (Core Governance)
*Selected critical fields out of 42 total.*

| Field | Type | Required | Values / Formula / Logic |
|---|---|---|---|
| `Page Title` | Text | Yes | Exact wiki page title. |
| `Owner` | Text | Yes | Handle. Must validate against T4. |
| `Next Review Due` | Formula | Auto | `IF(Cadence='Monthly', Last+30, IF(Cadence='Quarterly', Last+90...))` |
| `Health Score` | Formula | Auto | `100 - (IF(Owner='',20,0)) - (IF(Tags<2,20,0)) - (IF(DaysOverdue>0,MIN(40,DaysOverdue),0))` |
| `Publication State` | Select | Yes | Draft, WIP, Awaiting Approval, Published, Archived. |
| `Market (CC)` | Select | Yes | Routes the branch grant. |
| **`Review Due (native)`** | **Date** | **Bot** | **Mirrors computed Next Review Due. Trigger fields must be native dates, not formulas.** |
| `Permission Last Asserted`| Date | Auto | Written by the nightly reconciliation job. |

### 6.2 T4: User Access Register (Matrix Engine)
Dictates exact systemic permissions. 

| Field | Type | Function |
|---|---|---|
| `Database App Access` | Select | Enforces the Agent Lockdown (View Only). |
| `Bot Command Access` | Select | Standard, Extended, Admin. |
| **`Market Scope`** | **Multi-Select** | **Drives every branch grant. Values: The 45 ISO codes or ALL.** |

### 6.3 T10: Bot Interaction Log (Immutable Audit)
Every API operation writes here. Grows unboundedly.

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
Agents operate the library via DM or channel commands.

| Command | Action / Resolution |
|---|---|
| `@Bot ask [query]` | Quick-answer endpoint. Facet-extracts the query, searches T1, returns the single best file link plus a 2-line text extract. |
| `@Bot check [vertical] [market]`| Fast compliance screen. Returns policy tier and gating requirements. |
| `@Bot gap [question]` | Autonomously writes a T3 Gap Tracker record and notifies the market lead for content creation. |
| `@Bot reconcile [CC]` | Admin-only. Triggers manual on-demand state and permission reconciliation. |

---

## 9. Operational Integrity (Self-Healing Sub-Routines)

### 9.1 Database vs. Wiki State Reconciliation (`SC-006`)
Because wiki node moves are asynchronous and emit no webhooks, the Database and the Wiki can diverge silently. 
*   **Forward Check:** Queries all T1 rows marked `Published`, fetches the actual wiki node via API, and asserts the parent node matches the expected folder. Detects F-027 (Published in Database, stuck in Staging).
*   **Reverse Check:** Enumerates children of every live market folder. Asserts each has a corresponding `Published` T1 row. Detects F-028 (Live in Wiki, missing from Database).

### 9.2 The Mover Protocol (`DT-007`)
When a user changes market scopes in T4, the system must sever old access to prevent privilege accumulation.
1. **Revoke First:** Script enumerates departing market branch tokens and executes permission-member delete.
2. **Grant Second:** Standard provisioning script runs for the new market scope.
3. **Reassign Ownership:** Bot queries T1 for records owned by the mover in the old scope and triggers an interactive card to the FLM to reassign file ownership. 

---

## 10. Console (Custom Application Interface)
Console is the administrative operating surface for the platform, built as a custom frontend application loading directly inside the database interface via a native JS SDK.

**Architectural Decision: Why a native JS SDK instead of a Standalone Web App?**
A standalone web app writing via a service token attributes every system change to "The Bot". A native JS SDK loads client-side and runs under the signed-in user's identity. This preserves human attribution in the record history—a strict requirement for enterprise auditability.

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

## 12. Disaster Recovery & Rollback

The platform relies on external extraction to satisfy enterprise RTO/RPO limits, as native vendor restoration is limited to 90 days.

| Element | Specification |
|---|---|
| **Database Export** | Nightly. All operational tables export to CSV/XLSX via the export-task API. |
| **Document Export** | Weekly. Full document content exported to DOCX/PDF. |
| **Structural Map** | Weekly. Full branch map (Node tokens, paths, permission grants) exported to JSON. |
| **Destination** | EU-region external object store (preserves residency outside the vendor tenant). |
| **RPO / RTO** | **RPO:** 24 hours. **RTO:** 8 hours for Database, 48 hours for document corpus. |
| **Pre-Destructive Rule** | Any bulk deletion or state rollback requires a fresh, verified export before the script executes. |

---

## 13. Deployment Rollout Sequence
Deployed via an 8-stage sequence to isolate failure early.

1. **Stage 0-1 (Sandbox):** Platform limits stress-tested using synthetic data to establish true child-node and tree-depth ceilings.
2. **Stage 2-3 (Schema & Permissions):** T1-T10 tables deployed. User matrix (T4) seeded with the 200-person active roster.
3. **Stage 4-5 (Automations):** Webhooks, interactive cards, and 429 rate-limit backoff harnesses deployed.
4. **Stage 6 (Single-Market Pilot):** 74 files published for a single test market to establish a baseline for AI-generation verification effort. 
5. **Stage 7 (Scale & Discovery):** Scaled to the remaining 44 markets. **Parallel execution:** Drive API discovery script enumerates all legacy tenant documents, extracting inbound/outbound link graphs to identify "link hubs" prior to internal migration.
6. **Stage 8 (Internal Layer):** Per-document ACLs stripped from legacy files, moving them into the 15 governed areas to inherit the new tier permissions.
