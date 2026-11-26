# VII. Role-Based Access Matrix & Security Architecture

**Focus:** 4-Layer Permission Topology, 6 Operating Roles vs. 5 Internal Tiers (`I-0`..`I-4`), Agent Lockdown & Mover/Leaver IAM · **Status:** `Designed`

---

## 1. The Four-Layer Access Topology
The architecture relies on a multi-layered security model. Omitting any layer from the governance strategy results in invisible permission drift.

| Layer | Control Scope | Management Surface |
| :--- | :--- | :--- |
| **1. Platform** | Whether a person can sign in to the workspace. | Enterprise Identity Provider / Admin Console |
| **2. Wiki Branch** | Whether a person can open a physical **document**. | Wiki node permissions, granted per branch via `perm_type: "container"` |
| **3. Database** | Whether a person can see a **register row** (metadata). | Advanced table-level permissions |
| **4. Application** | Whether the Bot will execute a command on their behalf. | User Access Matrix (T4), enforced in application code |

### 1.1 The Two-Mechanism Rule
**Layers 2 (Wiki) and 3 (Database) are strictly independent, and both must be explicitly set.** This is the single most misunderstood dynamic in enterprise wiki systems.

| Actor Scenario | Sees the Database Row for an out-of-scope draft? | Can Open the Document? |
| :--- | :--- | :--- |
| Agent scoped to a different market | **Yes** | **No** |
| QA Specialist scoped to that market | **Yes** | **Yes** |

An agent seeing a database catalog entry for a document they cannot open is **correct behavior**. The register is an index of what exists, not a bypass around branch grants. If a document title itself is considered sensitive, the document belongs in a restricted internal tier, not the public market tree.

---

## 2. Layer 1: The 6 Operating Roles (`AGT` to `ADM`)
The architecture models a standardized `100-seat` reference team (`60` `AGT` seats + `40` QA, management, and admin seats) across **6 Operating Roles** (distinct from the **5 Internal Container Access Tiers** defined in Section 5):

| Role | Code | Reference Seats | Platform Access | Standard Market Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Agent** | AGT | 60 | Editor | 1 to 2 markets |
| **QA Specialist** | QAS | 16 | Editor | 4 to 12 markets |
| **First Line Manager** | FLM | 12 | Editor | 2 to 12 markets |
| **Manager** | MGR | 8 | Full Access | 1 region or ALL |
| **Upper Management** | UPM | 2 | Full Access | ALL |
| **Administrator** | ADM | 2 | System Admin | ALL |

*Continuity Rule:* Two administrators is a hard continuity requirement, not a nicety. The Application Secret and the Archive Branch are restricted strictly to Administrators. A single administrator creates a single point of failure for systemic continuity and offboarding procedures.

---

## 3. Layer 2: Wiki Branch Grants
Access is granted at the **branch container** level, not on individual documents. 

### 3.1 Inheritance (Applied Once)
A document moved into a branch inherits that branch's permissions **at the exact moment of the move**. It is not continuously synced.
*   *Consequence:* A branch permission grant changed *after* publication does not automatically reach documents already residing there. Drift is therefore expected, not exceptional.

### 3.2 Nightly Permission Reconciliation (`SC-004`)
To counter post-move drift, external cron scanner `SC-004` runs nightly against the API:
1. Reads the Access Matrix (`T4`) and computes intended grants from the branch map.
2. Reads actual grants on the wiki branches.
3. Computes the diff.
4. On divergence, **re-asserts the intended container grant**, writes to the Audit Log (`T10`), and logs fault `F-019` or `F-020`.

---

## 4. The Agent Lockdown (Systemic Integrity)

### 4.1 Specification
Agents (`AGT`) hold strictly **View Only** rights on the central database (`T1`), with no record conditions permitting direct cell edits. Agents cannot write to the register directly.

This is not a downgrade of the Agent role; it is the foundation of the platform's integrity. A register whose accuracy depends on `60` frontline agent seats never typing into the wrong database cell is not governed; it is merely trusted.

### 4.2 Conversational Proxy
Because agents are locked out of the database interface, they execute all state changes via the Bot. 
*   `@Bot review` records a self-review.
*   `@Bot gap` writes to the Gap Tracker.
*   Approval cards manage publication state changes.

*Testing Gate:* The lockdown relies entirely on the Bot's ability to act as a proxy. If a test agent cannot edit a database cell directly, but successfully updates their review timestamp via `@Bot review`, the lockdown is successfully operational.

---

## 5. The 5 Internal Container Access Tiers (`I-0` to `I-4`)
The internal operations estate spans `15` functional areas governed by **5 Internal Container Access Tiers (`I-0` through `I-4`)**. Every area carries an explicit **Read Tier** and **Write Tier** (never a single combined tier, which would lock frontline agents out of reading SOPs they are forbidden from editing):

| Internal Tier | Name | Permitted Operating Roles | Typical Container Scope |
| :--- | :--- | :--- | :--- |
| **`I-0`** | **Owner-Isolated** | Individual workspace owner only (transfers to `FLM`/`MGR` on offboarding after review) | `15_Personal_Space` (`PER`) |
| **`I-1`** | **All Active Staff** | `AGT`, `QAS`, `FLM`, `MGR`, `UPM`, `ADM` | `01_SOPs` (Read), `03_Internal_Updates` (Read), `04_Training` (Read) |
| **`I-2`** | **Scoped Contributor** | Market-scoped `QAS`, `FLM`, `MGR`, `UPM`, `ADM` | `04_Training` (Write), `07_Escalations` (Write), `11_Client_Accounts` (Read, market-scoped) |
| **`I-3`** | **Governance Reviewer & Management** | `FLM`, `MGR`, `UPM`, `ADM` (plus designated `QAS` leads) | `01_SOPs` (Write), `11_Client_Accounts` (Write, market-scoped), `12_Compliance` (Read) |
| **`I-4`** | **Restricted Executive & Admin** | `UPM`, `ADM` (and named Data Contact where mandated) | `12_Compliance` (Write), `13_Confidential` (`CNF` Read & Write), `_ARCHIVE/` |

| Representative Area | Read Tier | Write Tier |
| :--- | :--- | :--- |
| `01_SOPs` | `I-1` (All Active Staff) | `I-3` (Governance Reviewer & Above) |
| `04_Training_and_Enablement` | `I-1` (All Active Staff) | `I-2` (Scoped Contributor & Above) |
| `11_Client_Accounts` | `I-2` (Market-Scoped) | `I-3` (Market-Scoped) |
| `12_Compliance_and_Legal` | `I-3` | `I-4` (Restricted Executive & Admin) |
| `13_Confidential` | `I-4` | `I-4` (Restricted Executive & Admin) |
| `15_Personal_Space` | `I-0` (Owner Only) | `I-0` (Owner Only) |

---

## 6. Identity Lifecycle (Joiner, Mover, Leaver)
Standard systems document onboarding and offboarding. Enterprise systems document **Movers**, the most frequent and high-risk vector for permission drift.

### 6.1 The Mover Protocol (`DT-002`)
When an agent moves between markets but retains ownership of files in their previous market, they retain the ability to edit content outside their new scope, while the incoming agent is locked out.

**The Mover Sequence:**
1. Scope change recorded in Access Matrix (`T4`). Detector `DT-002` fires.
2. **Revoke First:** The Bot strips all branch tokens for the departing market on the same day. 
3. **Grant Second:** Standard provisioning is run for the new market. *(Granting first creates a window where the user holds both scopes).*
4. **Reassign Ownership:** The Bot inventories records owned by the mover in the old scope and assigns them to the new owner (or the First Line Manager if vacant).

### 6.2 The Leaver Protocol (`DT-003`)
Order of operations is critical because native workspace trash/recovery windows are time-bounded and deprovisioned account assets do not re-link automatically:
*   Identify all owned records and reassign to new owners *before* the final day.
*   **Route the user's Area 15 work-continuity folder through HR/DPO review and transfer approved work records to their manager within 48 hours.**
*   Only after data transfer is confirmed should the account state be changed to `Deprovisioned`.

---

## 7. Application Security & The App Secret
The Application Secret is the most sensitive credential in the system. Compromise allows an actor to impersonate the Bot and read/write every database table, including bypassing the audit log.

*   **Storage:** Stored exclusively in the Developer Console and as a single server environment variable. Never in the wiki, database, or a document.
*   **Rotation:** Rotated annually. Following rotation, **all 14 Bot commands** must be tested against a staging environment to confirm the new credential propagates cleanly.
*   **Audit Failure as a P1 Incident:** The audit trail (`T10`) is a primary deliverable. If `T10` enters persistent write failure (`F-013b`), state-mutating operations halt and the event is treated as a **P1 Outage**.
