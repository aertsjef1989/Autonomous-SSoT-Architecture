# VIII. Administrator Operations Runbook
**Document ID:** `08-Operations-Runbook.md`  
**Focus:** Continuity, Incident Response, Mover/Leaver Procedures, and Backup Validation  
**Format Tier:** *Working Reference with PDF rendering. Intended to be accessible offline during P1 incidents.*

---

## 1. Access and Secrets Management
**Critical Rule:** Never write the Application Secret in this document. Record only where it is stored.

| System | Authentication Vector | Recovery Protocol if Access is Lost |
| :--- | :--- | :--- |
| **Admin Console** | Platform SSO (Requires System Admin Role) | Engage secondary administrator or Executive Sponsor. |
| **Application ID** | Developer Console | Visible in console. Not classified as sensitive. |
| **Application Secret** | Developer Console (Credentials) | **Only held in Developer Console and one server environment variable.** If lost/compromised: Regenerate and update server immediately. |
| **Relational Database** | Inherited via Admin Console / Base | Access via Admin Console application panel. |
| **Wiki Administration** | Inherited via Admin Console / Wiki | Admin panel role management. |

---

## 2. Daily Standup (5-Minute Protocol)
Execute at the start of each working day.

| # | Inspection Target | Dashboard Surface | Required Action on Failure |
| :--- | :--- | :--- | :--- |
| 1 | **Overview Tiles** | Console S1 | Escalate any red-status metrics to their respective surfaces. |
| 2 | **Failed Deliveries** | Audit Log (Last 24h) | Retry transmission or explain failure to sender. |
| 3 | **Open P1 Faults** | Console S4 | **2-Hour SLA. Begin resolution immediately.** |
| 4 | **Archive Queue** | Console S7 | **Time Sensitive:** Any file reaching Day 30 is automatically archived tonight. Today is the final window for intervention. |
| 5 | **Job Executions** | Console S5 | A missing automated run triggers Fault F-011. |
| 6 | **State Divergence** | Console S1 | Any F-027 (Stuck Publish) or F-028 (Orphan Node) must be investigated same-day. |

---

## 3. The Mover Protocol (Cross-Market Transfers)
The most frequent lifecycle event, and the most dangerous vector for permission drift. When an agent changes markets but keeps ownership of files in their old market, they can edit content outside their new scope while locking out the incoming owner.

| # | Execution Step | Actor | Timing |
| :--- | :--- | :--- | :--- |
| 1 | Trigger: User scope or role changed. Fault F-029 opens. | System Admin | Immediate |
| 2 | **Revoke First:** Strip all branch tokens for departing markets. | Script | Same day |
| 3 | **Grant Second:** Standard provisioning for the new markets. | Script | Same day |
| 4 | Inventory records owned in the departing scope. | Console S2 | Same day |
| 5 | Present inventory to departing market's Team Lead for reassignment. | Console S2 | Same day |
| 6 | Reassign ownership. (Defaults to Team Lead if left unassigned). | Bulk Edit | ≤ 5 working days |
| 7 | Hand over or finish in-flight drafts. | Mover | ≤ 10 working days |
| 8 | Verify clean sweep on the next nightly reconciliation job. | Automatic | Next night |

*Security Principle:* **Revoke before grant, never the reverse.** Granting first creates a vulnerability window where the user holds both scopes.

---

## 4. Offboarding (The Leaver Protocol)
Must be completed **before** the final working day. Failure to deprovision an account cleanly triggers a P1 incident (F-023).

| # | Execution Step | System | Timing |
| :--- | :--- | :--- | :--- |
| 1 | List all records owned by the departing person. | Console S2 | Before last day |
| 2 | Manager assigns new owners. | Human | 3+ days prior |
| 3 | Update ownership for all affected records. | Console S2 | Before last day |
| 4 | Status set to `Deprovisioned`. | Access Register | On or before last day |
| 5 | Revoke wiki access & platform channels. | Admin Console | Within 24 hours |
| 6 | **Transfer personal workspace to their manager.** | Wiki | **Within 48 hours** |

*Data Integrity Rule:* Because the platform only offers a 30-day restore window, and transferred data does not restore automatically, **resources must transfer before the account is deleted.**

---

## 5. Backup, RPO, and RTO
"The vendor probably backs it up" is not a recovery plan for a governed system of record.

| Element | Specification |
| :--- | :--- |
| **Database Export** | Nightly. All tables to spreadsheet format. |
| **Document Export** | Weekly. Every `Published` node content. |
| **Structure Export** | Weekly. Branch map and permission grants. |
| **Destination** | EU-region storage outside the vendor platform. |
| **Recovery Time Objective (RTO)** | **8 hours** for the database register; **48 hours** for full document restoration. |
| **Recovery Point Objective (RPO)** | **24 hours.** |
| **Restore Validation** | **Monthly:** Restore 5 documents and 50 rows into a sandbox. An untested backup is merely a hypothesis. |

---

## 6. P1 Incident Response SLA
A P1 requires a **2-hour SLA** from detection to resolution.

| Time Window | Response Phase | Expected Output |
| :--- | :--- | :--- |
| **0 - 15 min** | Identify: Read Audit Log fault row, classify F-001 to F-029. | Fault ID & Severity Confirmed |
| **15 - 30 min** | Contain: Revoke access, disable bot, or alert Data Contact. | Threat Contained |
| **30 - 60 min** | Resolve: Execute fault playbook. | Root Cause Mitigated |
| **60 - 90 min** | Verify: Manually re-run the failed scanner. | Fix Confirmed |
| **90 - 120 min** | Document: Log resolution notes, notify Project Lead. | Audit Trail Closed |

### The Three P1 Faults
1.  **F-013 (Audit Log Write Failure):** The audit trail is down. Treat the entire platform as down.
2.  **F-019 (Restricted Content Breach):** Revoke immediately, trigger 72-hour breach assessment clock.
3.  **F-023 (Deprovisioning Incomplete):** Revoke immediately, execute offboarding protocol.

---

## 7. Operational Troubleshooting Guide

| Symptom | Diagnostic Vector | Resolution |
| :--- | :--- | :--- |
| **Every Bot call fails, but credentials are correct.** | Check client domain configuration. | Hardcode the international API domain instead of relying on default routing. |
| **Published file is missing from its branch.** | Check Console S7 (Stuck Publishes). | **Move failed after the state write.** Re-issue the move, then debug the publish handler order. |
| **Interactive Card does nothing on click.** | Server logs (Check callback speed). | The platform requires an HTTP 200 within 3 seconds. Acknowledge immediately, process asynchronously. |
| **Interactive Card stopped working after 2 weeks.** | Card age logic. | Under JSON Schema 2.0, cards have a hard 14-day update window. Issue a fresh card. |
| **Batch import lost 500 rows.** | Import report (All-or-Nothing failure). | One bad row failed the entire chunk. Validate data locally before chunking. |
| **Audit Log not receiving rows.** | **P1 Alert.** | Permission or token failure. Fix immediately. |
