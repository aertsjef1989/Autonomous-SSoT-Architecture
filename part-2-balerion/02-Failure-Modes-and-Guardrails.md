# Balerion II. Failure Modes, Guardrails & Telemetry

**Focus:** Silent Agent Failures, Permission Containment, Idempotency, and Outcome Metrics

---

## 1. Failure Modes & Architectural Controls
Multi-agent systems fail silently when confident drafts bypass verification, duplicate events mutate state twice, or volume metrics mask pipeline friction.

| Failure Mode | Operational Impact | Architectural Guardrail |
| :--- | :--- | :--- |
| **Unverified Account Claim** | Plausible but inaccurate trigger or company details in outreach | Source-backed brief fields + mandatory verification status before sequencing |
| **Over-Privileged Mutation** | Accidental CRM overwrite or premature outbound send | Least-privilege agent scopes + explicit approval gates on external/state writes |
| **Duplicate Handover Event** | Double-routed accounts, duplicate tasks, or conflicting stage states | Deterministic idempotency keys per account/event + state-transition guard |
| **Vanity Output Illusion** | High draft/message counts hiding poor handover or high revert rates | Track pipeline outcomes: qualified handovers, error/revert rate, cycle time |

## 2. Telemetry & Audit Discipline
- **Pre-Dispatch Gates:** Schema validation, claim verification flags, and human sign-off on outbound/CRM mutations.
- **Append-Only Execution Trace:** Every stage logs actor role, timestamp, idempotency key, input hash, and gate decision.

## 3. Interactive Section Demo
Open [Part II Interactive Demo](demo/index.html) to test approval gates, unverified-claim blocks, and duplicate handover prevention on synthetic B2B accounts.
