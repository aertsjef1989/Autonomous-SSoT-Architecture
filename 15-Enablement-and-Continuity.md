# XV. Enablement, Adoption & Continuity
**Document ID:** `15-Enablement-and-Continuity.md`  
**Focus:** Organizational Adoption, Champion Enablement, and Eliminating Bus-Factor-1  

## 1. Change & Adoption Strategy
A technically flawless knowledge architecture that frontline agents ignore is a failed build. Adoption is engineered around workflow friction reduction rather than top-down mandates:
*   **Zero-Context Switching:** Frontline agents interact primarily via `@Bot ask` and `@Bot check` inside their existing chat workspace—resolving queries in under 60 seconds without hunting through folder trees.
*   **Role-Based Enablement:** Training is modularized by role (Agent, QA Specialist, First Line Manager, Administrator) using concise **Role-Based Quick Reference Cards** rather than a single monolithic manual.
*   **Champion Network:** Regional Champions are trained ahead of each market wave to run local calibration sessions, triage Gap Tracker (`T3`) submissions, and surface adoption blockers.

---

## 2. The Continuity Pack (Solving Bus-Factor-1)
An enterprise system that only its original architect can operate is an operational liability. The Continuity Pack is designed so a successor can take over the entire platform from the documentation alone:

1.  **Credential & Access Map (Zero Secrets Stored):** Maps *where* every credential, API token, and admin surface lives—and enforces a hard **minimum of two named administrators** against every critical surface.
2.  **ADR Guardrails:** Directs any successor to read all 12 ADRs (and specifically *"what breaks if this changes"*) before modifying schemas, permissions, or automation schedules.
3.  **Reproducible Build Chain:** Enforces the core documentation rule—*Markdown and source scripts are authoritative; PDFs and renders are never edited directly*—ensuring future revisions never drift out of sync.
4.  **Annual Tabletop Readiness:** Combines the 72-hour GDPR breach clock, 30-minute access revocation drill, and monthly sandbox backup restore into a repeatable operational cadence.
