# III. Design Methodology (DMADV)

**Document ID:** `03-Design-Methodology-DMADV.md`  
**Methodology:** Lean Six Sigma (Design for Six Sigma / DFSS)  
**Scope:** Greenfield Architecture (Public-Information Layer)  

## 1. Methodology Selection: Why DMADV?
The public-information layer of the architecture had no incumbent. There was no existing process producing the required market documentation, no defect rate to measure, and no baseline to improve against. 

Applying the standard **DMAIC** (Define, Measure, Analyze, Improve, Control) methodology here would have required inventing a baseline, and an invented baseline produces an invented improvement. 

Because we were designing a system that did not previously exist, the project utilized **DMADV** (Define, Measure, Analyze, Design, Verify)—the core methodology of Design for Six Sigma (DFSS).

| Aspect | Public Layer (Greenfield) | Internal Layer (Legacy) |
| :--- | :--- | :--- |
| **Current State** | Does not exist | Exists (~1,200 scattered documents) |
| **Defect Rate** | Not measurable | Measurable |
| **Selected Methodology** | **DMADV** | **DMAIC** |
| **Output** | A designed, autonomous system | A repaired, governed estate |
| **Verification** | Does the design meet its CTQs? | Did the defect rate fall? |

---

## 2. Voice of the Customer (VOC) & CTQ Translation
A system designed to optimize for management will fail the end-user. The primary customer is the operational agent; a library that satisfies QA but goes unused by agents is a silent failure.

We translated the conflicting needs of three distinct customer groups into measurable **Critical-to-Quality (CTQ)** parameters.

| # | Customer Need | CTQ Parameter | Measurement Strategy | Target Tolerance |
| :--- | :--- | :--- | :--- | :--- |
| **CTQ-1** | Find it fast (Agent) | Time to correct file | Clicks or commands from query | 90% resolution in ≤3 clicks or 1 command |
| **CTQ-2** | Trust the answer (QA) | Source Verification Currency | Days since `Last Source Verification` | 100% of published files verified within cadence |
| **CTQ-3** | Answer is specific (Agent) | Market Specificity | Passes the "swap-the-country-name" test | 100% pass rate at review |
| **CTQ-5** | Complete coverage (Mgmt) | Publish vs. Planned | Percent of 3,386 total nodes | No market below 90% completion while others are at 100% |
| **CTQ-7** | Stays correct (QA/Mgmt) | Governance decay | Files past review + 30 days | **Zero** (Any occurrence is a systemic defect) |

*Defect Definition: The design target was set at **4.5 sigma** (roughly 1,350 defects per million opportunities). Claiming 6 sigma on a body of work involving human authorship and quarterly platform changes is statistically dishonest.*

---

## 3. Risk Mitigation (FMEA)
Failure modes were ranked by their Risk Priority Number (RPN), calculated as `Severity × Occurrence × Detection` (each scored 1 to 10). 

**The highest risk to the architecture was the use of AI for content generation.** 

| Failure Mode | Effect | S | O | D | RPN | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Generated content is plausible but wrong** | Agent acts on false advice | 10 | 7 | 8 | **560** | **Mandatory Research Verification Protocol:** Perishable claims identified *before* drafting. (See Section 4) |
| **Counter drift between markets** | Cross-market comparisons break silently | 7 | 5 | 9 | **315** | Lists locked in blueprint before the first market is built. Post-lock changes require renumbering all 45 markets. |
| **Publish writes DB but node does not move** | Database claims a file exists where it does not | 8 | 5 | 7 | **280** | Move-then-confirm sequence, plus nightly state reconciliation scans. |
| **Permission drift after publication** | Wrong audience sees a file | 9 | 4 | 7 | **252** | Nightly permission reconciliation; re-assert on divergence. |

*F1 dominates the risk profile. Severity is 10 because false advice is the worst possible outcome. Detection is 8 because a plausible AI hallucination reads exactly like a correct fact. The mitigation strategy attacked the Detection score.*

---

## 4. The Verification Protocol (Attacking F1)
To mitigate the RPN 560 risk of AI hallucination, the architecture strictly separated generation from verification.

**The Rule: Never write a perishable claim from memory or AI output.**
A perishable claim is anything that could change or varies by source (e.g., UI paths, API limits, policy thresholds, compliance rules). Confidence from an AI model during generation is not evidence of current accuracy.

1.  Identify every perishable claim *before* writing a draft. Writing first anchors the author to the generated text, even against a contradicting result.
2.  Search each claim individually against primary sources.
3.  If primary sources conflict, document the conflict. Do not silently pick the one that sounds more confident.
4.  If a claim cannot be verified, explicitly flag it as unverifiable. An honest "could not confirm as of [date]" is worth more than a confident, wrong answer.

---

## 5. Verification Phase (The Pilot)
The design was verified not through a "soft launch," but through a controlled experiment: **The NL (Netherlands) Pilot.** 74 files across all 8 domains were generated, reviewed, and published.

**Verification Results against CTQs:**
*   **V1 (CTQ-1):** 30-query set run by an external assessor achieved the 90% resolution target within 3 clicks/1 command.
*   **V2 (CTQ-3):** Measurement System Analysis (MSA) conducted on Market Specificity. Three reviewers achieved >80% agreement on the "swap-the-country-name" test before the standard was considered operational.
*   **V3 (Cost Model):** Hours per file from the pilot timesheet validated the baseline assumption of 0.25 person-days per generated file.
*   **V6 (CTQ-7 & 8):** Self-healing scanners and permission reconciliation scripts ran for 14 consecutive nights with zero unexplained faults and zero permission divergence.

Upon passing V1 through V6, the design was mathematically verified, and scale-out to the remaining 44 markets was authorized.
