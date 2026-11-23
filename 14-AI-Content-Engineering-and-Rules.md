# XIV. AI Content Engineering & Verification Rules
**Document ID:** `14-AI-Content-Engineering-and-Rules.md`  
**Focus:** Scaling 3,386 AI-Assisted Files Without Hallucination, Mechanical Linting vs. Semantic QA  

## 1. The Two-Layer Quality Gate
Generating 3,386 operational files across 45 markets requires AI acceleration, but unverified AI output carries the highest risk in the FMEA (**RPN 560**). Quality control is therefore split into two non-overlapping layers: **15 automated mechanical checks** (fast, deterministic) and **5 human semantic checks** (the ones that actually protect accuracy).

### 1.1 The 15 Mechanical Checks (Automated Pre-Submission Linting)
No content file reaches a human reviewer until it passes automated validation returning `PASS` or a line-numbered defect list:
*   **Structural Hygiene:** Required template sections present, valid Markdown formatting, no prohibited dash/punctuation artifacts.
*   **Scope & Density:** Word count within folder-specific bounds; tag count within schema limits.
*   **Register Alignment:** Required metadata register fields populated; strict market/country code consistency (`CC`) across title, path, and body.
*   **Claim Discipline:** Every external source explicitly classified (`Verified` vs. `Needs Confirmation`); automated flagging of vague authorities, unsubstantiated superlatives, and daily budget figures mistakenly phrased as ceilings rather than floors.

### 1.2 The 5 Semantic Checks (Human Verification Only)
Automated linters cannot verify truth. Human reviewers focus 100% of their time on the five checks machines cannot perform:
1.  **The Swap-the-Country-Name Test:** If swapping `NL` for `BE` leaves the file reading naturally, it is generic filler and fails immediately.
2.  **Named Entity Accuracy:** Confirming local regulators, statutory decrees, and payment rails are exact for that jurisdiction.
3.  **Local-Language Register:** Ensuring regional language accuracy (e.g., never blending Netherlands Dutch into Flemish, or informal register into formal markets).
4.  **Structural Utility:** Judging whether dense prose should be converted into a decision table for 3-click agent findability.
5.  **Claim-to-Source Fidelity:** Confirming the cited primary source actually supports the specific claim made in the text.

---

## 2. The House Rules (Anti-Anchoring Protocol)
To prevent reviewers from Rubber-Stamping plausible AI text:
*   **Identify Perishable Claims First:** Thresholds, UI paths, fees, and legal rules are extracted *before* drafting.
*   **Document Conflicts:** When two primary sources disagree, the conflict is surfaced explicitly rather than smoothed over.
*   **Flag the Unverifiable:** An explicit *"Needs in-account confirmation"* table is mandatory in every technical guide; an honest gap is always safer than a confident guess.
