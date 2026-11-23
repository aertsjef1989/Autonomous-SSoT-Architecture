# XIII. Contracts, Testability & Readiness
**Document ID:** `13-Contracts-and-Readiness.md`  
**Focus:** Acceptance Criteria, API Contract Boundaries, Deterministic Fixtures, String Catalogue, and Reviewer Calibration  

## 1. Engineering Readiness Suite
Architecture documents explain *intent*; readiness contracts define **pass/fail proof** before production deployment. Five structured artifacts govern build verification:

| Artifact | Format | Governing Scope |
| :--- | :--- | :--- |
| **Acceptance Criteria** | Structured JSON / Spec | One atomic, testable assertion per workflow, state transition, and Console surface |
| **API Contract** | Endpoint & Error Spec | Request/response envelopes, 500-record chunking, HTTP 429 backoff bounds, and 3-second ACK SLA |
| **Deterministic Fixtures** | Reference-Date Generator | Repeatable synthetic dataset with zero system-clock dependencies |
| **String Catalogue** | Versioned Message Registry | Exact copy for all bot replies, staleness banners, error toasts, and escalation cards |
| **Reviewer Calibration Pack** | 6 Blinded Files + Locked Key | Proves >80% inter-rater reliability across human QA reviewers before live publishing |

---

## 2. Acceptance Criteria Matrix (Representative Assertions)
No feature is marked complete until its negative (failure-branch) assertion passes alongside its happy path:

| Flow / Surface | Assertion ID | Given (Precondition) | When (Action) | Then (Required Verifiable Outcome) |
| :--- | :--- | :--- | :--- | :--- |
| **Async Publish** | `AC-PUB-02` | File in `_STAGING/`, move API forced to fail | Reviewer clicks Approve | `T1.Publication State` remains `Awaiting Approval`; fault `F-027` logged in `T10`; zero silent state drift |
| **Agent Lockdown** | `AC-SEC-01` | User holds `AGT` role in `T4` | User attempts direct edit on `T1` cell | Platform rejects write; same user running `@Bot review` succeeds via Bot proxy and logs to `T10` |
| **Market Scoping** | `AC-BOT-04` | User scoped to `NL` only | User runs `@Bot policy Finance DE` | Bot returns scope-rejection string `STR-ERR-403`; zero `DE` content leaked; attempt logged in `T10` |
| **Mover Protocol** | `AC-IAM-02` | User transfers `NL -> FR` in `T4` | Mover detector `DT-007` fires | `NL` branch tokens revoked *before* `FR` tokens granted; `T1` owned files queued for FLM reassignment |
| **KPI Versioning** | `AC-KPI-03` | KPI filter edited in `T-KPI-03` | Admin saves new numerator rule | `Definition Version` increments (`v1 -> v2`); UI trend chart renders physical version-break marker |

---

## 3. API Contract & Fault-Tolerance Boundaries

### 3.1 Batch & Rate-Limit Contract
*   **Chunk Ceiling:** Maximum `500` records per batch read/write call.
*   **Atomicity Guard:** Because vendor batch writes are all-or-nothing, client-side schema validation runs locally on all 500 rows *before* transmission.
*   **HTTP 429 Backoff Policy:**

| Retry Attempt | Wait Strategy | Action on Failure |
| :--- | :--- | :--- |
| **Attempts 1–4** | Respect `Retry-After` header; fallback exponential backoff (`2s, 4s, 8s, 16s`) + jitter | Re-attempt identical idempotent payload |
| **Attempt 5 (Final)** | `32s` backoff | Abort batch, preserve local cursor, log `F-011` (`429_EXHAUSTED`) to `T10`, alert Admin |

### 3.2 Webhook Callback Contract (The 3-Second Rule)
Every interactive card callback must return `HTTP 200` within `3,000 ms` containing a non-blocking status toast. Downstream wiki moves, polling loops, and database writes execute asynchronously via worker queue. Exceeding 3 seconds triggers platform retry storms and duplicate state mutations.

---

## 4. Deterministic Test Fixtures (Zero Clock Reads)
A test fixture that calls `Date.now()` passes on build day and breaks 15 days later when mock records cross escalation thresholds.

*   **Fixed Anchor:** Every date in the test dataset is computed as `REFERENCE_DATE + offset_days`.
*   **Coherent Shift:** Advancing `REFERENCE_DATE` shifts the entire corpus in lockstep while preserving exact boundary states:

| Fixture Record | Offset Formula | Resulting State Under Test |
| :--- | :--- | :--- |
| `FIX-001` (Healthy) | `Next Review = REF + 45d` | `Active`, Health Score `100` |
| `FIX-002` (Escalation Edge) | `Next Review = REF - 14d` | Triggers Day-14 FLM escalation card |
| `FIX-003` (Stepped Penalty) | `Next Review = REF - 20d` | `Days Overdue = 20`, Health Score `72` (verifies stepped `-28` penalty vs. `-20` linear) |
| `FIX-004` (Kill-Switch Edge) | `Next Review = REF - 30d` | Surfaces in Console S7 Archive Queue (final intervention window before midnight archive) |

---

## 5. String Catalogue & Reviewer Calibration

### 5.1 String Catalogue Governance
All user-facing copy is centralized by ID (`STR-WARN-STALE`, `STR-ERR-SCOPE`, `STR-ESC-DAY14`, `STR-CONF-PUBLISH`) rather than scattered across handlers. Updating a compliance disclaimer requires a single catalogue edit and guarantees uniform rendering across DM cards, channel replies, and Console toasts.

### 5.2 Reviewer Calibration (Measurement System Analysis)
Human reviewers are treated as a measurement instrument and calibrated prior to live market waves:
1. **Blinded Corpus:** Six realistic test files (`CALIB_A`–`CALIB_F`) seeded with deliberate failure modes (subtle threshold errors, swap-test failures, missing source classifications, ceiling-vs-floor budget errors).
2. **Key Isolation:** The answer key (`CALIB_00_FACILITATOR`) is strictly withheld from reviewers before scoring.
3. **Release Gate:** Reviewers must reach **>80% inter-rater agreement** against the calibration key before receiving publish-approval permissions.
