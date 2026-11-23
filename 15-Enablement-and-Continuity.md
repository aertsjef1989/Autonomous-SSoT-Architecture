# XV. Enablement, Adoption & Continuity

| Document ID | Pillar | Focus |
| :--- | :--- | :--- |
| `15-Enablement-and-Continuity.md` | V. Continuity & Readiness | Role-Based Curriculum, Champion Rhythm & Bus-Factor-1 Elimination |

---

## 1. Change & Adoption Architecture
Knowledge bases fail when they add clicks to a frontline workflow. Adoption is engineered around **friction removal** and role-scoped training rather than monolithic documentation:

### 1.1 Role-Based Enablement Curriculum
Every user completes only the track required for their operating role (`T4`):

| Role Track | Format & Duration | Core Competencies Covered | Practical Certification Gate |
| :--- | :--- | :--- | :--- |
| **Agent (AGT)** | 30-min live walkthrough + 1-page Quick Reference Card | `@Bot ask`, `@Bot check`, reading Staleness Warnings, submitting `@Bot gap`, running `@Bot review` | Resolve 3 timed test scenarios in <=60 seconds each |
| **QA Specialist (QAS)** | 90-min workshop + Calibration Pack | Anti-Anchoring Protocol, 5 Semantic Checks, Swap Test, Interactive Approval Cards | Score >80% agreement on blinded `CALIB_A`–`CALIB_F` set |
| **First Line Manager (FLM)** | 45-min briefing + Escalation Card | Day-14 Escalation triage, Mover ownership reassignment, Gap Tracker prioritization | Complete simulated Mover reassignment within SLA |
| **System Administrator (ADM)** | 2-hour hands-on lab + Runbook | 5-Min Daily Standup, Console S1–S7, `F-027`/`F-028` recovery, P1 2-hour response, Secret rotation | Execute live sandbox restore + 30-min access revocation drill |

### 1.2 The Champion Operating Rhythm
Regional Champions bridge central architecture and local market reality:
*   **Pre-Wave (T-2 Weeks):** Run local Reviewer Calibration sessions and verify market branch grants before rollout.
*   **Weekly Triage (30 min):** Review `T3` Gap Tracker frequency counts; promote recurring questions into the content sprint.
*   **Monthly Adoption Check:** Audit active roster metrics (`target >= 80%`) and shadow 5 frontline queries to detect silent workflow friction.

---

## 2. The Continuity Pack (Eliminating Bus-Factor-1)
An enterprise platform that depends on its original architect is an operational failure. The Continuity Pack enables a qualified successor to take full ownership from the documentation alone.

### 2.1 Successor Takeover Sequence (Day 1 to Day 14)
1. **Access & Credentials Verification (Day 1):** Verify dual-administrator access against the Credential Storage Map (Admin Console, Developer Console, Server Environment Variable, External EU Backup Store). Confirm zero secrets exist in plain text inside wiki or docs.
2. **ADR Guardrail Review (Days 2–3):** Read all 12 ADRs in Chapter XII—specifically the *"What Breaks If This Changes"* column—before approving any schema or workflow change.
3. **Daily Standup Shadowing (Days 4–7):** Run the 5-minute Console S1/S4/S5/S7 inspection alongside the outgoing administrator.
4. **Dry-Run Recovery Drill (Days 8–14):** Independently execute a monthly backup restore (5 documents + 50 register rows into sandbox) and trigger a manual `@Bot reconcile` pass.

### 2.2 Reproducible Documentation & Build Discipline
To prevent rendered outputs from drifting out of sync with system reality:
*   **Single Source of Authoring:** Markdown source files and diagram scripts are authoritative; rendered PDFs, DOCX exports, and PNGs are never edited directly.
*   **Controlled Rebuild Chain:** Any update to a source file triggers an automated rebuild of its rendered output and master index.

### 2.3 Annual Continuity & Compliance Scorecard
Readiness is proven annually through a timed, scored simulation:

| Drill | Target SLA | Pass Condition |
| :--- | :--- | :--- |
| **Emergency Access Revocation** | `<= 30 min` | Target user stripped across Platform, Wiki Branch, Database, and Bot layers; verified via `T10` |
| **Audit Evidence Export** | `<= 10 min` | Specific `T10` incident chain located, exported, and verified intact |
| **DPA & Residency Proof Retrieval** | `<= 5 min` | Signed DPA + dated EU residency console screenshot produced on demand |
| **Sandbox Backup Restore** | `<= 8 hrs` (DB) | 50 register rows + 5 docs restored cleanly with zero schema errors |
| **72-Hour Breach Notification Rehearsal** | `<= 72 hrs` | Full Art. 33 timeline walked end-to-end from detection to supervisory authority draft |
