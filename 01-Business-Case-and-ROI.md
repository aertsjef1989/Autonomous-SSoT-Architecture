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

The system operates across three distinct logic layers, scaling to nearly 4,000 nodes while maintaining strict separation between public data and NDA-restricted operations:

| Layer | Implementation | Strategic Value |
| :--- | :--- | :--- |
| **Content (Public)** | 3,386 aggregated files (8 domains, 45 markets). AI-generated, human-verified. | The right answer physically exists. |
| **Content (Internal)** | ~500 NDA-restricted operational files ("internal kitchen"). | Complex procedures are documented securely. |
| **Governance** | 12 register tables, 8 scanners, 7 detectors, 29 fault types. | The answer stays right, autonomously, without manual auditing. |
| **Delivery** | 23 conversational bot commands, 11 trigger workflows. | The answer reaches the agent mid-workflow in under a minute. |

## 3. The Financial Argument
*   **Total Build Cost:** €406,000 to €606,000 (1,616 person-days / 3.7 FTE over 2 years)
*   **Platform / License Cost:** €0 (Existing ecosystem)
*   **Year One Outlay:** €203,000 to €303,000

**The ROI Thesis:** Year One development costs constitute just *one-sixth* of the low end of the measured annual waste. The build pays for itself inside the first year, with the library only half complete. 

*Strategic Note: Standard business cases rely on ROI multiples. I deliberately excluded multiples here. A raw fractional comparison is mathematically stronger because a multiple invites executive arguments about derivation; raw cost-vs-waste does not.*

## 4. Execution & Rollout Phasing
The build was sequenced to isolate and measure failure early, utilizing synthetic personas to protect enterprise integrity during testing.

1.  **Sandbox (1 Week):** Platform limit testing. 
2.  **Synthetic POC / Platform (8 Weeks):** Schema, space, and automation built. *Crucial gate: Utilized 50 synthetic personas (pax) and AI-generated fictional data to safely stress-test the conversational bot logic, the 14-detector Self-Healing Loop, and the Access Matrix. Integrity was verified by deliberate failure injection without risking live production data.*
3.  **Pilot (4 Weeks):** 1 market, 74 files locked. Measured the cost-model assumptions regarding human-verification effort for AI-generated content.
4.  **Scale (16 Months):** 44 remaining markets deployed to the 200-person Lisbon team.
5.  **Internal Estate (10 Months - Parallel):** Discovery, triage, and permission repair for the ~500 NDA-restricted nodes.
6.  **Console (6 Months - Parallel):** Nine administrative dashboard surfaces.

## 5. Telemetry & Success Criteria
A system is only valid if its integrity can be proven mathematically.

*   **Coverage:** ~3,886 total files published (3,386 public + ~500 internal).
*   **Currency:** 0 files past review + 30 days (enforced by automation).
*   **Adoption:** 80% of roster active monthly.
*   **Integrity:** 0 register-to-wiki divergence across 14 consecutive nights.

**The "Silent Failure" Protocol:** Coverage, currency, and integrity are measured autonomously by the system. However, **Findability** (target: 90% of queries resolved in 3 clicks or 1 command) is the only metric that fails silently. Therefore, Findability was architected to be measured quarterly by an external party, as it dictates whether the other metrics matter at all.

## 6. Interrogating the Denominator
The waste denominator (€1.89M to €2.81M) is derived from the 200-person live team in Lisbon (with the architectural capability to scale globally). To ensure mathematical honesty before scale, I presented stakeholders with three structural readings of the financial data:

1.  *The waste is global/tenant-wide, and this architecture currently addresses the 200-person Lisbon share:* The ROI comparison is directionally right, but the total ratio is understated until rolled out to other locations.
2.  *The waste calculation should be scoped strictly to the 50-person synthetic POC validation phase:* The headline ROI figure is fractional until the full 200-person rollout is complete.
3.  *The waste is specific and already scoped exactly to the 200-person Lisbon population:* The €1.89M figure stands precisely as written.

*This interrogation was forced at Stage 0, ensuring the financial model, scaling logic, and synthetic testing assumptions were validated by executives before a single line of production code was written.*
