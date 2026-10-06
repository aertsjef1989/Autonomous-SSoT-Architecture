# VII. Role-Based Access Matrix & Security Architecture
**Document ID:** `07-Role-Based-Access-Matrix.md`  
**Focus:** 4-Layer Permission Topology, the Agent Lockdown, and Identity Lifecycle Management  

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

## 2. Layer 1: The Operating Roles
The architecture governs approximately 200 users across 6 distinct roles. 

| Role | Code | Platform Access | Standard Market Scope |
| :--- | :--- | :--- | :--- |
| **Agent** | AGT | Editor | 1 to 2 markets |
| **QA Specialist** | QAS | Editor | 4 to 12 markets |
| **First Line Manager** | FLM | Editor | 2 to 12 markets |
| **Manager** | MGR | Full Access | 1 region or ALL |
| **Upper Management** | UPM | Full Access | ALL |
| **Administrator** | ADM | System Admin | ALL |

*Continuity Rule:* Two administrators is a hard continuity requirement, not a nicety. The Application Secret and the Archive Branch are restricted strictly to Administrators. A single administrator creates a single point of failure for systemic continuity and offboarding procedures.

---

## 3. Layer 2: Wiki Branch Grants
Access is granted at the **branch container** level, not on individual documents. 

### 3.1 Inheritance (Applied Once)
A document moved into a branch inherits that branch's permissions **at the exact moment of the move**. It is not continuously synced.
*   *Consequence:* A branch permission grant changed *after* publication does not automatically reach documents already residing there. Drift is therefore expected, not exceptional.

### 3.2 Nightly Permission Reconciliation
To combat drift, an external cron job runs nightly against the API.
1. Reads the Access Matrix (T4) and computes intended grants from the branch map.
2. Reads actual grants on the wiki branches.
3. Computes the diff.
4. On divergence, it **re-asserts the correct grant**, writes to the Audit Log (T10), and raises an automated fault.

---

## 4. The Agent Lockdown (Systemic Integrity)

### 4.1 Specification
Agents (`AGT`) hold strictly **View Only** rights on the central database (T1), with no record conditions permitting edits. Agents cannot write to the register directly.

This is not a downgrade of the Agent role; it is the foundation of the platform's integrity. A register whose accuracy depends on ~140 people not typing in the wrong database cell is not governed—it is merely trusted.

### 4.2 Conversational Proxy
Because agents are locked out of the database interface, they execute all state changes via the Bot. 
*   `@Bot review` records a self-review.
*   `@Bot gap` writes to the Gap Tracker.
*   Approval cards manage publication state changes.

*Testing Gate:* The lockdown relies entirely on the Bot's ability to act as a proxy. If a test agent cannot edit a database cell directly, but successfully updates their review timestamp via `@Bot review`, the lockdown is successfully operational.

---

## 5. Internal Layer Access Tiers
The internal operations estate spans 15 areas. **Every area carries a discrete read tier and a discrete write tier.** A single tier per area fails operationally (e.g., setting SOPs to a single high tier locks frontline agents out of the very procedures they are required to follow).

| Area Example | Read Tier | Write Tier |
| :--- | :--- | :--- |
| `01_SOPs` | I-1 (All Staff) | I-3 (Reviewer & Above) |
| `04_Training_and_Enablement` | I-1 (All Staff) | I-2 (Contributor & Above) |
| `11_Client_Accounts` | I-2 (Market-Scoped) | I-3 (Market-Scoped) |
| `12_Compliance_and_Legal` | I-3 | I-5 (Restricted) |

---

## 6. Identity Lifecycle (Joiner, Mover, Leaver)
Standard systems document onboarding and offboarding. Enterprise systems document **Movers**—the most frequent and high-risk vector for permission drift.

### 6.1 The Mover Protocol
When an agent moves between markets but retains ownership of files in their previous market, they retain the ability to edit content outside their new scope, while the incoming agent is locked out.

**The Mover Sequence:**
1. Scope change recorded in Access Matrix (T4). Detector fires.
2. **Revoke First:** The Bot strips all branch tokens for the departing market on the same day. 
3. **Grant Second:** Standard provisioning is run for the new market. *(Granting first creates a window where the user holds both scopes).*
4. **Reassign Ownership:** The Bot inventories records owned by the mover in the old scope and assigns them to the new owner (or the First Line Manager if vacant).

### 6.2 The Leaver Protocol
Order of operations is critical, as platform data recovery windows are limited to 30 days, and transferred data does not restore automatically.
*   Identify all owned records and reassign to new owners *before* the final day.
*   **Transfer the user's personal workspace to their manager within 48 hours.** 
*   Only after data transfer is confirmed should the account state be changed to `Deprovisioned`.

---

## 7. Application Security & The App Secret
The Application Secret is the most sensitive credential in the system. Compromise allows an actor to impersonate the Bot and read/write every database table, including bypassing the audit log.

*   **Storage:** Stored exclusively in the Developer Console and as a single server environment variable. Never in the wiki, database, or a document.
*   **Rotation:** Rotated annually. Following rotation, **all 23 Bot commands** must be successfully tested against a staging environment to confirm the new credential propagates cleanly.
*   **Audit Failure as a P1 Incident:** The audit trail (T10) is a primary deliverable. If the audit log stops accepting writes for any reason, the system is fundamentally unaudited and is treated as a **P1 Outage**.
