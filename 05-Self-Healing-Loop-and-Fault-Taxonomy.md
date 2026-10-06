# V. Self-Healing Loop and Fault Taxonomy
**Document ID:** `05-Self-Healing-Loop-and-Fault-Taxonomy.md`  
**Focus:** Automated Governance, Fault Tolerance, and Self-Healing Control Loops  

## 1. Architectural Philosophy of the Loop
A system without an automated governance loop will inevitably decay. Manual auditing fails because it scales linearly with content volume while rot compounds exponentially. 

To maintain 100% data integrity across 3,386+ nodes without human micromanagement, the architecture operates a continuous, autonomous 5-phase control loop.

    DETECT   --> Scanners and detectors write a fault to the audit log
    CLASSIFY --> Assign category, severity (P1–P4), and correction tier
    CORRECT  --> Tier 1 (Automatic) through Tier 4 (Executive Escalation)
    VERIFY   --> Re-scan at T+24h. Only then is the fault marked "Resolved"
    LEARN    --> Recurring faults trigger systemic configuration changes, not just record patches

*Critical Principle:* **Verification is separate from correction.** A correction applied and logged as done is untested. The automated re-scan at T+24 hours is what confirms whether the fix held.

---

## 2. Optimized Execution: The Single Daily Scan
Early iterations of the architecture utilized per-record date automations, which would have fired roughly 1,700 automation runs per month. 

### The Run Budget & Enterprise Ceiling
Evaluating the platform's constraints against full-suite enterprise entitlements established a ceiling of **500,000 automation runs per month**. 

Rather than running per-record triggers, the architecture employs a **Single Daily Scan** running at 07:30.
*   **Efficiency:** The daily scan consumes roughly **30 automation runs per month**—a 98% reduction that preserves massive headroom while centralizing escalation logic into testable server code.
*   **Native Date Dependency:** Because database automations cannot reliably trigger off formula-derived dates, the Bot copies calculated review dates into a native date field (`Review Due (native)`) on every write. This is the only date the daily scan reads.

### The Escalation Ladder
When a file reaches its review threshold, the daily scan triggers an automated escalation sequence:
*   **Days 1–13:** Automated direct message card sent to the content owner ("Verify or Update").
*   **Days 14–29:** Escalation card sent to the Owner, the Space Owner, and the Market First Line Manager (FLM).
*   **Day 30:** **Automatic Deprecation.** If unaddressed, the node is automatically moved to the archive branch, and its state changes to `Archived`. Leaving unverified policy or operational files in active circulation is a compliance liability worse than an empty folder.

*Exemption:* High-velocity, record-class internal areas (Meeting Notes, Escalations, Internal Updates) carry a `Review Exempt` flag. Feeding 720 dated records a year into a review scan creates noise; they are governed via strict retention periods instead.

---

## 3. Scanners & Event Detectors
The loop relies on scheduled scanners (pull-based polling) and event detectors (push-based triggers).

| Type | Name & Schedule / Trigger | Function / Target |
| :--- | :--- | :--- |
| **Scanner** | **Metadata Integrity Scanner** (Daily 07:00) | Catches missing owners, cadences, descriptions, and tag violations. |
| **Scanner** | **Expected Run Audit Scanner** (Daily 07:30) | **Audits the other scanners.** Checks for the absence of expected audit log rows in the last 25 hours. If a scanner fails silently, this raises an alarm. |
| **Scanner** | **State Reconciliation Scanner** (Nightly 02:00) | **Resolves the Async Publish Gap.** Because wiki node moves are asynchronous and emit no webhooks, the Database and the Wiki can diverge. *Forward Check:* Asserts Published records live in the correct folder. *Reverse Check:* Asserts live wiki nodes have a valid database record. |
| **Detector** | **Audit Failure Detector** (Audit Log Write Error) | Immediate **P1 Alert**. If the audit log stops accepting writes, the platform is unaudited and halts execution. |
| **Detector** | **The Mover Protocol Detector** (User Scope Update) | Detects when an agent changes markets/scopes in the user directory but retains file ownership in their old market. Prevents cross-market permission leaks. |

---

## 4. Fault Taxonomy (Summary Categories)
The taxonomy classifies operational and governance failures across five strict categories, mapping them directly to automated correction tiers (Tier 1 = Fully automated; Tier 4 = Executive escalation).

| Category | Description | Representative Faults |
| :--- | :--- | :--- |
| **A. Metadata** | Register hygiene failures | Missing owners, missing cadences, insufficient tags. |
| **B. Structural** | Tree and navigation integrity | Broken links, dead URLs, duplicate titles, orphaned nodes. |
| **C. Data Integrity** | Systemic state synchronization | Formula errors, Database-vs-Wiki state divergence. |
| **D. Operational** | Infrastructure health | Missing job runs, API timeouts, audit write failures. |
| **E. Access & Security** | Permission and scoping breaches | Unauthorized commands, privilege drift, retention violations, Mover leakage. |

*Severity SLA Enforcement:* **P1 Faults** (such as audit failure or incorrect restricted node access) carry a strict **2-hour resolution SLA** and automatically escalate to Tier 4.

---

## 5. Systemic Learning & Operational Readiness
Correction without learning is just manual maintenance with extra steps. 

### The 3-Strike Rule
If the exact same fault ID occurs **3 or more times within 30 days**, the loop halts minor patching and triggers a mandatory **Configuration Review**. For example, repeated metadata failures in a specific market indicate a provisioning failure in that market's onboarding workflow, not a series of individual author errors.

### Operational Exit Criteria
The self-healing architecture was not assumed to work; it was proven via rigorous verification. The loop was declared officially operational only after holding the following criteria for **14 consecutive days**:
1. Zero missing scheduled scanner runs.
2. 100% of "Resolved" faults successfully passing their T+24h verification re-scan.
3. Zero P1 faults open past their 2-hour SLA.
4. **Zero state divergence (Reconciliation returning clean).**
5. Successful execution of an injected test fault across every category to prove the detection-to-verification pipeline end-to-end.
