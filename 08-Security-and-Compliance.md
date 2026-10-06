# VIII. Security & Compliance (Legal & GDPR Package)
**Document ID:** `08-Security-and-Compliance.md`  
**Focus:** Data Residency, GDPR Subject Rights, P1 Breach Protocols, and Internal Layer Retention  
**Format Tier:** *Presented. This document does not constitute legal advice. Placeholder values must be replaced with the organization's actual arrangements before operational use.*

---

## 1. Compliance Position & Governance Context
The system processes personal data across two distinct vectors with differing risk profiles:
1.  **System Governance Data:** Telemetry and identity data regarding team members operating the system.
2.  **Internal Layer Data (Area 11):** Information about client organizations and individuals within them.

| Element | Specification |
| :--- | :--- |
| **Data Controller** | The Organization. |
| **Data Contact** | Named individual. Primary contact for all system compliance matters. |
| **Data Processor** | The Platform Vendor, operating under a signed Data Processing Agreement (DPA). |
| **Legal Framework** | EU General Data Protection Regulation (GDPR - Regulation 2016/679). |
| **Lawful Basis (Primary)** | Art. 6(1)(b) Contractual Necessity & Art. 6(1)(f) Legitimate Interests. |

---

## 2. Data Residency vs. Sovereignty

### 2.1 The Distinction
**Residency and Sovereignty must be answered separately and accurately.** Conflating them produces a compliance narrative that fails at the first informed audit.

*   **Data Residency (Where the data is stored):** A configuration and contract term. This operation is EU-based and physically resides on EU servers.
*   **Data Sovereignty (Who can compel access):** A function of corporate structure and applicable law. A narrative that presents residency as though it resolves sovereignty fails instantly in enterprise procurement.

### 2.2 Evidentiary Requirements (Audit Preparedness)
Evidence is what survives an audit. It is assembled proactively, not reconstructed under pressure.

1.  **The Residency Setting:** Dated screenshot from the administrative console (stored as a regulated file).
2.  **The Signed DPA:** Registered and accessible within 5 minutes.
3.  **Processor Certifications:** Verified annually against the active register. *(Note: The certifying legal entity of the Data Privacy Framework is frequently not the same as the product-developing entity).*

*Recognized Certifications:* ISO 27001, ISO 27017, ISO 27018, ISO 27701, ISO 42001, and SOC 2 Type II.

---

## 3. Personal Data Inventory & Lawful Basis
This inventory is the primary reference for Subject Access Requests (SARs) and must be updated whenever a new personal data field is introduced.

| Table / Area | Fields | Category | Lawful Basis | Retention Rule |
| :--- | :--- | :--- | :--- | :--- |
| **T4 User Access** | Name, handle, email, role, access tiers | Identity | Art. 6(1)(b) & (f) | 30 days post-employment. |
| **T5 Onboarding** | Satisfaction score, champion, manager | Wellbeing | Art. 6(1)(a) Consent | Scores anonymized at 90 days. |
| **Operational Tables** | Owner handle, assigned writer | Governance | Art. 6(1)(f) | Anonymized on departure. |
| **Internal Area 11** | Client contact names, relationship context | 3rd-Party | Art. 6(1)(f) | Duration of commercial relationship. |
| **Internal Area 15** | Personal workspace contents | Unknown | Art. 6(1)(b) | Transfers to manager on offboarding. |
| **T10 Audit Log** | Actor ID, Event Timestamp | Audit | Art. 6(1)(c) Legal Obligation | **Cannot be erased during retention period.** |

### 3.1 The Audit Log (T10) Erasure Exception
The T10 Audit Log carries the longest retention in the system. Because it is governed by Art. 6(1)(c) Legal Obligation, **it cannot be erased upon request.** This limitation must be explicitly disclosed to any data subject making an Art. 17 erasure request. It is the only data set in the system where erasure is legally refused.

---

## 4. Breach Response Protocol (The 72-Hour Clock)
**Art. 33 Requirement:** 72 hours from awareness to supervisory authority notification. The clock starts the moment *anyone* in the organization becomes aware, not when the Data Contact is informed.

| Hour Window | Required Action | Owner |
| :--- | :--- | :--- |
| **0 to 2** | Assess whether a personal data breach has occurred. | Data Contact |
| **0 to 4** | Document scope, affected subjects, likely consequences, and cause. | Data Contact / Admin |
| **4 to 12** | **Containment:** Revoke access, isolate accounts, prevent exposure. | System Admin |
| **12 to 24** | Notify affected subjects if there is a high risk to rights and freedoms. | Data Contact |
| **24 to 48** | Prepare the supervisory authority notification. | Project Lead |
| **48 to 72** | **Submit official notification.** | Data Contact |

### 4.1 Tracked Breach Scenarios
These are not hypothetical failure modes; they are explicit fault events tracked by the system's Self-Healing Loop:
*   **F-019 (Permission Drift):** Exposes restricted internal areas (Areas 11, 12, or 13).
*   **F-023 (Failed Deprovisioning):** A departed employee retains platform access.
*   **Block C1 Violation:** Client contact details inappropriately placed in a public-layer file.

---

## 5. Internal Layer Specific Obligations

### 5.1 Area 11: Client Accounts
This area holds third-party personal data. Market scoping here is a strict data protection control, limiting access only to individuals with a legitimate commercial reason to view it. **Special category data (Art. 9) is strictly prohibited.**

### 5.2 Area 15: Personal Workspaces (The "Continuity, Not Privacy" Rule)
Because contents are unknown by design, Area 15 is the most delicate tier in the system.
*   **Purpose:** Work-in-progress organizational continuity, *not* personal privacy.
*   **Access:** Tier I-0 (The individual only).
*   **Offboarding Protocol:** The folder **transfers to the manager within 48 hours** of departure; it is not erased.
*   **Mandatory Disclosure:** This transfer policy *must* be disclosed at the time of provisioning. A person told at creation that the folder transfers can choose what to put in it; a person told at offboarding has had a reasonable expectation of privacy defeated.

---

## 6. The Annual Compliance Tabletop Exercise
The organization must prove operational readiness annually via a timed tabletop simulation:

- [ ] Data Contact can explain Art. 33 (72-hour rule) and identify the supervisory authority from memory.
- [ ] System Admin can successfully revoke a specific user's access across all tiers within 30 minutes.
- [ ] A specific T10 incident record can be located and exported within 10 minutes.
- [ ] Signed DPA is accessible within 5 minutes.
- [ ] End-to-end timing confirms a 72-hour breach submission is operationally achievable.
