# I. Business Case & ROI
**Document:** Executive One-Pager (Project Mandate)
**Focus:** Financial Justification & Structural Strategy

## 1. The Core Vulnerability (The Cost of Asymmetry)
Activation advice across 45 markets was being produced from individual recall, ad-hoc search, and personal notes. The same operational question yielded different answers on the same day because no central artefact governed the truth. 

This systemic fragmentation generated measurable financial hemorrhage across four failure modes:
*   **Re-derivation:** Agents independently researching what the system had already established.
*   **Propagation Failure:** Platform rules change, but the update fails to propagate, surfacing as incorrect advice at the client tier.
*   **Onboarding Drag:** Competence transferred purely by verbal conversation rather than structured consumption.
*   **Knowledge Decay:** Total loss of captured intelligence upon the departure of a Subject Matter Expert.

> **Measured Annual Waste: €1,890,000 to €2,810,000**
> *(Calculated via Eurostat LCS 2024: EU labour at €33.50–€50.00/hr).*

## 2. The Architectural Solution
To eliminate this waste without triggering enterprise procurement blockers, I designed a zero-license-cost architecture built entirely within the existing corporate tooling ecosystem. 

The system operates across three distinct logic layers:

| Layer | Implementation | Strategic Value |
| :--- | :--- | :--- |
| **Content** | 3,386 public files (8 domains, 45 markets). AI-generated, human-verified. | The right answer physically exists. |
| **Governance** | 12 register tables, 8 scanners, 7 detectors, 29 fault types. | The answer stays right, autonomously, without manual auditing. |
| **Delivery** | 23 conversational bot commands, 11 trigger workflows. | The answer reaches the agent mid-workflow in under a minute. |

## 3. The Financial Argument
*   **Total Build Cost:** €406,000 to €606,000 (1,616 person-days / 3.7 FTE over 2 years)
*   **Platform / License Cost:** €0 (Existing ecosystem)
*   **Year One Outlay:** €203,000 to €303,000

**The ROI Thesis:** Year One development costs constitute just *one-sixth* of the low end of the measured annual waste. The build pays for itself inside the first year, with the library only half complete. 

*Strategic Note: Standard business cases rely on ROI multiples. I deliberately excluded multiples here. A raw fractional comparison is mathematically stronger because a multiple invites executive arguments about derivation; raw cost-vs-waste does not.*

## 4. Execution & Rollout Phasing
The build was sequenced to isolate and measure failure early.

1.  **Sandbox (1 Week):** Platform limit testing. 
2.  **Platform (8 Weeks):** Schema, space, application, and automation built. *Integrity verified by deliberate failure injection.*
3.  **Pilot (4 Weeks):** 1 market, 74 files. *Crucial gate: Measured the cost-model assumptions regarding human-verification effort for AI-generated content.*
4.  **Scale (16 Months):** 44 remaining markets deployed.
5.  **Internal Estate (10 Months - Parallel):** Discovery, triage, and permission repair.
6.  **Console (6 Months - Parallel):** Nine administrative dashboard surfaces.

## 5. Telemetry & Success Criteria
A system is only valid if its integrity can be proven mathematically.

*   **Coverage:** 3,386 files published.
*   **Currency:** 0 files past review + 30 days (enforced by automation).
*   **Adoption:** 80% of roster active monthly.
*   **Integrity:** 0 register-to-wiki divergence across 14 consecutive nights.

**The "Silent Failure" Protocol:** Coverage, currency, and integrity are measured autonomously by the system. However, **Findability** (target: 90% of queries resolved in 3 clicks or 1 command) is the only metric that fails silently. Therefore, Findability was architected to be measured quarterly by an external party, as it dictates whether the other metrics matter at all.

## 6. Interrogating the Denominator
The waste denominator (€1.89M to €2.81M) was derived from a 200-person enterprise population, but the active roster served directly by this library tier was 50. 

I presented stakeholders with the three structural readings of this data to ensure mathematical honesty before scale:
1.  *The waste is tenant-wide, this library addresses the activation share:* The comparison is directionally right, the ratio is understated.
2.  *The waste should be scaled to 50:* The figure falls, and so does the headline ROI.
3.  *The waste is activation-specific and already scoped to this population:* The figure stands as written.

*This interrogation was forced at Stage 0, ensuring the cost model was validated by executives before a single line of code was written.*
