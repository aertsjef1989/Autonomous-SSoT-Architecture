# XIII. Contracts, Testability & Readiness
**Document ID:** `13-Contracts-and-Readiness.md`  
**Focus:** Acceptance Criteria, API Contracts, Deterministic Fixtures, String Catalogue, and Reviewer Calibration  

## 1. Closing the Specification-to-Build Gap
Architecture documents describe what a system *should* do; engineering contracts define **what correct means in testable terms**. Before production build, five machine-readable and operational readiness artifacts lock down behavior:

| Artifact | Scope | Purpose |
| :--- | :--- | :--- |
| **Acceptance Criteria** | One testable pass/fail statement per flow and Console surface | Eliminates ambiguous "looks good" sign-offs during QA |
| **API Contract** | Exact request/response schemas, error codes, and 429 backoff bounds | Allows parallel frontend/backend development and mock generation |
| **Deterministic Test Fixtures** | Synthetic dataset anchored to a fixed reference date | Guarantees repeatable tests without clock drift |
| **String Catalogue** | Every user-facing bot message, error toast, and escalation card | Prevents ad-hoc copy drift and ensures consistent compliance warnings |
| **Reviewer Calibration Pack** | 6 blinded test files (`CALIB_A`–`CALIB_F`) + locked Facilitator Answer Key | Proves human QA reviewers agree before live content review begins |

---

## 2. Deterministic Test Fixtures (Zero Clock Reads)
A test suite that reads the system clock will pass today and fail next month when a mock document crosses its 14-day or 30-day review threshold.

*   **Design Rule:** Every date in the fixture set resolves relative to a single configurable **Reference Date**.
*   **Coherent Shifting:** Moving the reference date shifts the entire dataset in lockstep—preserving exact edge cases (e.g., a file sitting precisely at Day 14 escalation, Day 30 archive queue, or Health Score `72`).

---

## 3. Reviewer Calibration & Measurement System Analysis (MSA)
Because human reviewers are the final gate against AI hallucination, reviewer judgment is treated as a measurement instrument that must be calibrated.

1.  **Blinded Evaluation:** Reviewers independently score six calibration files (`CALIB_A` through `CALIB_F`) containing deliberate, realistic defects (e.g., plausible but wrong thresholds, country-swap failures, missing source classifications).
2.  **Answer Key Isolation:** The Facilitator Pack (`CALIB_00_FACILITATOR`) holds the defect key and is strictly withheld from reviewers prior to calibration.
3.  **Certification Gate:** Reviewers must achieve **>80% inter-rater agreement** against the calibration key before being granted approval rights on live market branches.
