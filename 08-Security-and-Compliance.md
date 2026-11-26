# VIII. Security & Compliance (GDPR Governance Draft)

**Focus:** Proposed GDPR Lawful-Basis Mapping, Residency vs. Sovereignty & Art. 33 Breach Protocol · **Status:** `Designed` (Draft for Legal/DPO Review)

> **Draft Notice (For Owner & Legal Review - Not Legal Advice):** This chapter is an engineering data-protection design draft prepared to structure controller/DPO review under Regulation (EU) 2016/679 (GDPR). Lawful-basis selections, Legitimate Interests Assessments (LIAs), retention schedules, and erasure exceptions depend on jurisdiction-specific employment law and controller counsel sign-off; nothing below constitutes legal advice or a final legal conclusion.

---

## 1. Compliance Position & Governance Context
The reference architecture models personal data across two operational vectors with distinct risk profiles:
1.  **Workspace Governance Data:** Identity, role-scoping, ramp-milestone, and audit telemetry for the `100-seat` internal team.
2.  **Internal Layer Data (`Area 11`):** Business-to-business client contact context scoped by market.

| Element | Proposed Design Specification |
| :--- | :--- |
| **Data Controller** | Deploying Organization (subject to local corporate entity mapping). |
| **Data Contact / DPO** | Named Data Protection Contact (or statutory DPO where appointed). |
| **Data Processor** | Enterprise Workspace Vendor, operating under an executed Art. 28 Data Processing Agreement (DPA). |
| **Reference Framework** | EU General Data Protection Regulation (GDPR - Regulation (EU) 2016/679). |
| **Proposed Primary Bases** | Art. 6(1)(b) Contractual Necessity (where strictly required for role execution) & Art. 6(1)(f) Legitimate Interests (backed by documented LIAs). |

---

## 2. Data Residency vs. Sovereignty

### 2.1 The Distinction
**Residency and Sovereignty must be evaluated separately.** Conflating physical storage location with jurisdictional immunity fails informed procurement and DPO review.

*   **Data Residency (Where data is stored at rest):** A technical region setting and contractual DPA commitment (modeled here as EU server residency).
*   **Data Sovereignty (Which authorities can compel disclosure):** Determined by the processor's corporate parent structure, sub-processors, and extraterritorial statutes (requiring Transfer Impact Assessments and supplementary safeguards where applicable).

### 2.2 Evidentiary Preparedness (`[Status: Designed]`)
1.  **Residency Configuration Record:** Dated administrative console capture stored in `12_Compliance` (`I-4`).
2.  **Executed Art. 28 DPA & Sub-processor List:** Indexed for retrieval within `5 minutes`.
3.  **Processor Security Attestations:** Reviewed annually against active scope (e.g., ISO/IEC 27001, 27017, 27018, 27701, and SOC 2 Type II, verifying the exact legal entity covered by each certificate).

---

## 3. Proposed Personal Data Inventory & Lawful-Basis Candidates
This register structures Art. 30 Records of Processing Activities (RoPA) and Subject Access Request (SAR) scoping for DPO review:

| Table / Area | Modeled Fields | Data Category | Proposed Lawful-Basis Candidate (For Legal Review) | Proposed Retention & Minimization |
| :--- | :--- | :--- | :--- | :--- |
| **`T4` User Access** | Name, handle, work email, role (`AGT`..`ADM`), market scopes | Workforce Identity & IAM | Art. 6(1)(b) / Art. 6(1)(f) (access control LIA) | Active employment + `30 days` post-departure deprovision verification, then purged. |
| **`T5` Onboarding** | Certification gate dates, assigned buddy/champion, manager handle | **Operational Ramp Milestones** *(no individual wellbeing/health fields)* | **Art. 6(1)(f) Legitimate Interests** (with documented LIA) | Identifiable ramp rows anonymized `90 days` post-certification. *(See Section 3.1 on consent & Art. 9 limits.)* |
| **Operational Tables (`T1`..`T3`)** | Owner handle, reviewer handle | Content Governance | Art. 6(1)(f) (operational accountability LIA) | Reassigned on departure (Leaver Protocol `DT-003`); former handle stripped from active rows. |
| **Internal `Area 11`** | B2B client contact names, role context | Third-Party B2B Contact | Art. 6(1)(f) (commercial relationship LIA; market-scoped `I-2`/`I-3`) | Duration of active commercial relationship + statutory limitation review *(longest multi-year retention in the estate)*. |
| **Internal `Area 15`** | In-progress SOP/playbook working drafts | **Work-in-Progress Operational Drafts** *(private content prohibited)* | Art. 6(1)(f) (business continuity LIA) | Screened by HR / Data Contact upon departure prior to 48-hour manager handover of approved work items. *(See Section 5.2.)* |
| **`T10` Audit Log** | Actor handle/ID, command, timestamp, fault code | Security & Integrity Audit | **Art. 6(1)(f) Legitimate Interests** (Art. 32 security & accountability LIA; Art. 6(1)(c) only if counsel maps a specific Union/Member State statute) | Append-only within **`12-month`** active window, then archive-exported and purged per counsel schedule. *(See Section 3.2.)* |

### 3.1 `T5` Onboarding: Why Employee Consent & Individual Wellbeing Scores Are Avoided (`R26`, `D8`)
*   **Imbalance of Power on Employee Consent:** Earlier drafts mapped `T5` satisfaction/wellbeing fields to `Art. 6(1)(a)` Consent. Because of the structural imbalance of power between employer and employee, consent in employment is rarely considered freely given (see **Article 29 Data Protection Working Party, *Opinion 2/2017 on data processing at work* (`WP 249`, adopted 8 June 2017), https://ec.europa.eu/newsroom/article29/item-detail.cfm?item_id=610169, accessed 2026-11-26**).
*   **GDPR Art. 9 Special-Category Risk:** Recording individual "wellbeing", stress, or health-adjacent notes alongside named employee IDs risks capturing **Art. 9 special-category health data** without an Art. 9(2) condition.
*   **Proposed Split (`D8`):**
    1. `T5` stores **strictly objective ramp milestones** (training completion, calibration pass/fail, buddy assignment) proposed under **Art. 6(1)(f)** with a written LIA and `90-day` post-ramp anonymization.
    2. Sentiment feedback is separated into an **optional, non-identifiable aggregate cohort pulse** (minimum aggregation threshold `k >= 5` respondents, no user handle or timestamp joinable to `T4`, and free-text disabled or scrubbed so no Art. 9 data enters governance tables).

### 3.2 `T10` Audit Log: Lawful Basis, Retention Rank & Erasure Balancing (`R27`, `D8`)
*   **Art. 6(1)(c) vs. Art. 6(1)(f):** GDPR `Art. 6(1)(c)` applies only where processing is required by a specific Union or Member State legal obligation to which the controller is subject. Unless counsel identifies a binding sector statute mandating bot-command logs, `T10` is instead proposed under **Art. 6(1)(f) Legitimate Interests** (maintaining `Art. 32` access security, detecting unauthorized cross-market queries, and verifying administrative integrity), supported by a documented LIA.
*   **Retention Comparison:** `T10` does **not** carry the longest retention in the architecture: active `T10` partitions are held for `12 months` before archive/purge, whereas **Internal Area 11 (`Client Accounts`)** retains B2B relationship context across multi-year active client engagements.
*   **Art. 17 Erasure & Art. 21 Objection Handling:** `T10` is neither automatically exempt from all erasure requests nor uniquely exempt across the organization (statutory holds or `Art. 17(3)(e)` establishment/exercise/defence of legal claims may also restrict erasure elsewhere). When a data subject submits an `Art. 17` erasure or `Art. 21` objection request covering `T10`, the Data Contact/DPO evaluates on a case-by-case basis whether compelling legitimate security/audit grounds (`Art. 21(1)`) or `Art. 17(3)(b)/(e)` exceptions require retaining integrity-critical log entries until the `12-month` expiry, or whether actor identifiers can be pseudonymized without breaking audit continuity. This policy is disclosed in the workforce privacy notice at onboarding.

---

## 4. Personal Data Breach Response Protocol (`Art. 33` & `Art. 34`, `R29`)

*   **Statutory Rule vs. Internal Escalation Clock:** Under **EDPB *Guidelines 9/2022 on personal data breach notification under GDPR* (Version 2.0, adopted 28 March 2023, paras. 31-41, https://www.edpb.europa.eu/system/files/2023-04/edpb_guidelines_202209_personal_data_breach_notification_v2.0_en.pdf, accessed 2026-11-26)**, the 72-hour supervisory notification period under `Art. 33(1)` runs from when the controller has a *reasonable degree of certainty* that a security incident compromising personal data has occurred (allowing a brief initial investigation after an alert, while containment and documentation begin immediately). As a **conservative internal operational policy**, this runbook starts internal SLA tracking at **`Hour 0` upon first staff or detector alert** so internal escalation cannot consume the statutory window.
*   **Risk Threshold & Mandatory Internal Register (`Art. 33(1)` & `Art. 33(5)`):**
    *   **`Art. 33(5)` Universal Duty:** **Every** personal data breach (facts, effects, and remedial action taken) **must** be recorded in the internal Breach Register regardless of risk severity.
    *   **`Art. 33(1)` Notification Branch:** If assessment indicates the breach is **unlikely to result in a risk to the rights and freedoms of natural persons**, supervisory notification is not required, provided the reasoning is documented in the `Art. 33(5)` register and signed off by the Data Contact/DPO. Otherwise, notify the competent supervisory authority without undue delay and, where feasible, within **72 hours** (using phased notification under `Art. 33(4)` if forensic details are still developing).
    *   **`Art. 34(1)` Data-Subject Branch:** Where the breach is likely to result in a **high risk** to individuals' rights and freedoms, communicate the breach to affected data subjects without undue delay.

| Hour Window (Internal Policy Clock) | Parallel Required Actions | Responsible Role (Defined in Ch. VII) |
| :--- | :--- | :--- |
| **`0 to 2` (Immediate & Parallel)** | **Contain immediately** (revoke compromised tokens/scopes, isolate affected containers, pause Bot writes if needed) **in parallel** with initial triage to establish whether personal data is involved. Open `Art. 33(5)` Breach Register entry. | `System Administrator (ADM)` + `Data Contact / DPO` |
| **`0 to 4`** | Assess scope, categories/approximate volume of subjects and records, likely consequences, and risk tier (`unlikely risk` vs. `risk` vs. `high risk`). | `Data Contact / DPO` + `ADM` |
| **`4 to 12`** | Verify containment held; if `unlikely to result in a risk`, record reasoned `Art. 33(5)` determination with legal/DPO sign-off. If `high risk`, prepare `Art. 34` subject communication. | `Data Contact / DPO` + `Upper Management (UPM)` |
| **`12 to 24`** | Dispatch `Art. 34` communication to affected individuals where high-risk threshold is met (subject to `Art. 34(3)` exceptions). | `Data Contact / DPO` |
| **`24 to 48`** | Draft supervisory authority notification package (`Art. 33(3)` required elements, or initial phased submission under `Art. 33(4)`). | `Data Contact / DPO` + `ADM` |
| **`48 to 72` (Ceiling)** | Submit supervisory authority notification (without undue delay; never later than 72h from controller awareness) and log filing receipt in `Art. 33(5)` register. | `Data Contact / DPO` |

### 4.1 Tracked Security Fault Triggers (`[Status: Designed]`)
*   **`F-019` (Container Permission Drift):** Unexpected exposure on restricted internal areas (`11_Client_Accounts`, `12_Compliance`, or `13_Confidential`).
*   **`F-023` (Incomplete Leaver Deprovisioning):** Departed user account retains active workspace or container grants past offboarding cutoff.
*   **`M14` / Layer-Isolation Fault:** B2B contact details inadvertently drafted into a `Public_Information_Layer` staging node.

---

## 5. Internal Layer Specific Safeguards

### 5.1 Area 11: Client Accounts (`I-2` Read / `I-3` Write, Market-Scoped)
Holds business-to-business client contact records. Market-scoped container permissions enforce need-to-know access per jurisdiction, and **GDPR Art. 9 special-category personal data is strictly prohibited**.

### 5.2 Area 15: Work-Continuity Draft Space (`R28`)
Earlier designs labeled Area 15 contents `"Unknown"`, creating ambiguity around employee privacy expectations at offboarding. Area 15 is strictly defined as **`Work-in-Progress Operational Drafts`**:
*   **Prohibition of Private Content:** Area 15 is an employer-governed work-continuity drafting scratchpad (`I-0` during active work). Storing private personal files, personal correspondence, medical notes, or any `Art. 9` data in Area 15 is **expressly prohibited** by acceptable-use policy and Banner-disclosed when the folder is provisioned.
*   **HR / Data Contact Review Gate Before Manager Transfer:** Upon offboarding (`DT-003`), Area 15 is **not** transferred blindly to a line manager. Within the 48-hour offboarding window, **HR or the Data Contact/DPO conducts a title/metadata scoping screen** to quarantine or delete any inadvertently stored private item; only verified business-continuity drafts transfer to the `FLM`/`MGR`.

---

## 6. Annual Compliance & Incident Tabletop Drill (`[Status: Designed]`)
Operational readiness is tested annually via a timed simulation with counsel/DPO participation:

- [ ] `Data Contact / DPO` walks through `Art. 33(1)` (72h rule + risk exception), `Art. 33(5)` breach register logging, and competent supervisory authority contacts.
- [ ] `System Administrator (ADM)` revokes a test user's access across Platform, Wiki Branch, Database, and Bot layers within `30 minutes` (`Hour 0` containment).
- [ ] Specific `T10` incident records are exported and verified within `10 minutes`.
- [ ] Executed `Art. 28` DPA and EU residency configuration evidence are retrieved within `5 minutes`.
- [ ] End-to-end simulation confirms parallel containment (`Hour 0`) and `<= 72h` notification readiness.
