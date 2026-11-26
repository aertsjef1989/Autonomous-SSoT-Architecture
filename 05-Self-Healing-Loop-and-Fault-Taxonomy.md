# V. Self-Healing Loop and Fault Taxonomy

**Focus:** Single Daily Scan, 10 Automated Controls (`5` Scanners + `5` Detectors) & 29-Fault Taxonomy · **Status:** `Designed` (Simulated in `Prototype`)

---

## 1. Architectural Philosophy of the Loop
A system without an automated governance loop will inevitably decay. Manual auditing fails because it scales linearly with content volume while rot compounds exponentially. 

To maintain bounded state consistency across `3,055` public reference nodes and `~1,200` internal nodes without manual micromanagement, the architecture specifies a continuous 5-phase control loop (`[Status: Designed]`):

    DETECT   --> Scanners and detectors write a fault to the audit log
    CLASSIFY --> Assign category, severity (P1 to P4), and correction tier
    CORRECT  --> Tier 1 (Automatic) through Tier 4 (Executive Escalation)
    VERIFY   --> Re-scan at T+24h. Only then is the fault marked "Resolved"
    LEARN    --> Recurring faults trigger systemic configuration changes, not just record patches

*Critical Principle:* **Verification is separate from correction.** A correction applied and logged as done is untested. The automated re-scan at T+24 hours is what confirms whether the fix held.

---

## 2. Optimized Execution: The Single Daily Scan
Naive workspace implementations attach native per-record date automations inside the database UI, firing roughly `1,700` **platform automation runs** per month across active review schedules.

### Platform Automation Runs vs. External Server Job Runs
*   **Platform Automation Runs:** Metered native UI workflow triggers inside the workspace database product (subject to monthly enterprise automation quotas).
*   **External Server Job Runs:** Unmetered cron executions on the Bot/worker service calling batched REST APIs.

Rather than firing `1,700` per-record UI triggers, the architecture replaces review-date UI automations with **one native daily review-trigger handoff at 07:30 UTC** (`SC-002`):
*   **Efficiency (`98.2%` Metered Run Reduction):** `SC-002` consumes **`30` platform automation runs per 30-day month** against the `1,700 / month` per-record baseline (`1 - 30 / 1,700 = 98.2%`, cited as `~98%`), while `SC-001`, `SC-003`, `SC-004`, and `SC-005` execute on the external worker cron (`120` server cron runs/month, `0` metered UI runs). *(For comparison, scheduling `3` daily UI triggers would consume `90` runs = `94.7%` reduction, and running all `5` scanners as UI triggers would consume `150` runs = `91.2%` reduction.)*
*   **Native Date Dependency:** Because database automations cannot reliably trigger off formula-derived dates, the Bot copies calculated review dates into a native date field (`Review Due (native)`) on every write. This is the only date the daily scan reads.

### The Escalation Ladder
When a file reaches its review threshold, the daily scan triggers an automated escalation sequence:
*   **Days 1 to 13:** Automated direct message card sent to the content owner ("Verify or Update").
*   **Days 14 to 29:** Escalation card sent to the Owner, the Space Owner, and the Market First Line Manager (FLM).
*   **Day 30:** **Automatic Deprecation.** If unaddressed, the node is automatically moved to the archive branch, and its state changes to `Archived`. Leaving unverified policy or operational files in active circulation is a compliance liability worse than an empty folder.

*Exemption:* High-velocity, record-class internal areas (Meeting Notes, Escalations, Internal Updates) carry a `Review Exempt` flag. Feeding 720 dated records a year into a review scan creates noise; they are governed via strict retention periods instead.

---

## 3. Scanners & Event Detectors (`[Status: Designed]`)
The loop specifies **10 automated controls** (`5` scheduled scanners + `5` event detectors) plus `1` external dead-man heartbeat monitor:

| ID | Type | Name & Schedule / Trigger | Runs On | Target & Fault IDs |
| :--- | :--- | :--- | :--- | :--- |
| `SC-001` | **Scanner** | **Metadata Integrity Scanner** (`Daily 07:00 UTC`) | External Server Cron | Audits `T1` for missing owners, cadences, descriptions, or `<2` tags (`F-001` to `F-005`). |
| `SC-002` | **Scanner** | **Daily Freshness & Escalation Scan** (`Daily 07:30 UTC`) | Platform Automation -> Worker | Reads `Review Due (native)` across `T1`; dispatches Day 1-13 reminders, Day 14-29 FLM escalations, and Day-30 auto-archive moves (`F-006` to `F-010`). |
| `SC-003` | **Scanner** | **State Reconciliation Scanner** (`Nightly 02:00 UTC`) | External Server Cron | Resolves async publish drift via forward (`T1 -> Wiki`) and reverse (`Wiki -> T1`) checks (`F-027`, `F-028`). |
| `SC-004` | **Scanner** | **Container Permission Reconciliation** (`Nightly 02:30 UTC`) | External Server Cron | Diffs `T4` market/tier scopes against live wiki branch container ACLs and re-asserts drifted grants (`F-019`, `F-020`). |
| `SC-005` | **Scanner** | **Expected Run Audit Scanner** (`Daily 08:00 UTC`) | External Server Cron | Verifies `SC-001`..`SC-004` wrote expected completion rows to `T10` within the prior 25 hours (`F-011`, `F-012`). |
| `DT-001` | **Detector** | **Audit Log Failure & Latency Detector** (`On T10 Write`) | Bot API Middleware | Distinguishes **Degraded** (retry latency buffered, `F-013a`) from **Halted** (persistent write failure blocking mutations, `F-013b` P1). |
| `DT-002` | **Detector** | **Mover Scope-Change Detector** (`On T4 Scope Update`) | Webhook -> Worker | Triggers revoke-first / grant-second branch re-provisioning and `T1` ownership handoff (`F-029`). |
| `DT-003` | **Detector** | **Leaver Deprovision Detector** (`On T4 Status = Deprovisioned`) | Webhook -> Worker | Verifies pre-departure ownership reassignment and 48-hour Area 15 manager transfer (`F-023` P1 on miss). |
| `DT-004` | **Detector** | **Out-of-Scope Command Detector** (`On Bot Invocation`) | Bot Auth Guard | Blocks cross-market or unauthorized role invocations and logs security event (`F-021`, `F-022`). |
| `DT-005` | **Detector** | **Stuck Approval Card Detector** (`On Queue Poll / Callback`) | Worker Queue | Flags pending publish cards exceeding the 14-day validity window or `429` retry ceiling (`F-014`, `F-015`). |
| `HB-001` | **External Monitor** | **Dead-Man Heartbeat Switch** (`Daily 08:15 UTC` grace window) | Independent Ping Monitor (`Designed`) | Receives signed outbound ping only when `SC-005` succeeds; pages Administrators if `SC-005` itself fails to run. |

### 3.1 Watching the Watchman: External Dead-Man's Switch (`HB-001`, `[Status: Designed]`)
`SC-005` (Expected Run Audit Scanner) catches silent failures in `SC-001` through `SC-004` by checking `T10` for missing completion rows. However, if the worker host, cron daemon, or OAuth service token fails completely, `SC-005` itself never executes and no internal alarm fires.

To close that single point of failure without adding paid SaaS dependencies, `HB-001` specifies an **inverted (absence-triggered) heartbeat**:
1. Upon verifying `SC-001`..`SC-004` at `08:00 UTC`, `SC-005` issues a signed `HTTPS GET` ping (containing `run_date` and row count, zero PII) to an independent external heartbeat endpoint.
2. If no valid ping arrives before `08:15 UTC` (`15-minute` grace window), the external monitor raises an out-of-band **P1 Infrastructure Alert** directly to both named System Administrators (`ADM`).
3. `HB-001` is registered separately in `facts/facts.json` (`1` external monitor supervising the `10` internal automated controls).

---

## 4. Fault Taxonomy (Summary Categories)
The taxonomy classifies `29` defined fault types (`F-001` to `F-029`) across five categories, mapping each to automated correction tiers (Tier 1 = Automatic; Tier 4 = Executive escalation).

| Category | Description | Representative Faults |
| :--- | :--- | :--- |
| **A. Metadata** | Register hygiene failures | Missing owners, missing cadences, insufficient tags (`F-001`..`F-005`). |
| **B. Structural** | Tree and navigation integrity | Broken links, dead URLs, duplicate titles, Archive thresholds (`F-006`..`F-010`, `F-016`..`F-018`). |
| **C. Data Integrity** | Systemic state synchronization | Formula mismatches, Database-vs-Wiki divergence (`F-024`..`F-028`). |
| **D. Operational** | Infrastructure health | Missing job runs, `429` exhaustion, audit write latency/failure (`F-011`..`F-015`). |
| **E. Access & Security** | Permission and scoping breaches | Unauthorized commands, container ACL drift, incomplete offboarding, Mover leakage (`F-019`..`F-023`, `F-029`). |

*Severity SLA Enforcement:* **P1 Faults** (such as persistent `T10` write failure `F-013b`, restricted ACL exposure `F-019`, or incomplete leaver deprovisioning `F-023`) carry a strict **2-hour resolution SLA** and escalate to Tier 4.

---

## 5. Systemic Learning & Target Operational Readiness Gate
Correction without learning is manual maintenance with extra steps. 

### The 3-Strike Rule (`[Status: Designed]`)
If the exact same fault ID occurs **3 or more times within 30 days**, the loop halts minor patching and triggers a mandatory **Configuration Review**. For example, repeated metadata failures in a specific market indicate a provisioning failure in that market's onboarding workflow rather than isolated author mistakes.

### Target Operational Exit Criteria (`[Status: Designed]`)
Under the target deployment readiness contract, the self-healing loop is declared operational only after holding all five criteria across a **14-consecutive-day burn-in window**:
1. Zero missed scheduled scanner runs (`SC-001` through `SC-005` + `HB-001` green).
2. Every fault marked `Resolved` passing its `T+24h` verification re-scan.
3. Zero P1 faults open past their 2-hour SLA.
4. Zero unresolved state divergence on `SC-003` reconciliation runs.
5. End-to-end pass of one injected synthetic fault across each of Categories A through E.
