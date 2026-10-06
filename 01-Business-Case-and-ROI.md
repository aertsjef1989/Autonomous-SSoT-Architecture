# I. Business Case & ROI
**Document:** Executive One-Pager  
**Track:** Proposal / Strategy  
**Owner:** Systems Architect  

## The Problem
Activation advice across 45 markets is produced from individual recall, ad-hoc search, and personal notes. The same question is answered differently by different people on the same day. Nobody can state what the correct answer is, because no central artefact holds it.

### Where the cost lands
| Mechanism | Description |
| :--- | :--- |
| **Re-derivation** | Every agent independently researching what another has already established. |
| **Wrong advice** | A platform rule changes. Nobody propagates it. The error surfaces at the client/advertiser. |
| **Onboarding drag** | Nothing to hand a new agent. Competence transfers purely by conversation. |
| **Knowledge loss** | No capture mechanism when a subject matter expert departs. |

> **Measured annual waste: €1,890,000 to €2,810,000** 
> *(Based on Eurostat LCS 2024, EU labour at €33.50 to €50.00/hr).*

---

## The Solution
A knowledge architecture of 3,386 files covering the Enterprise Advertising Platform across 45 markets, plus a governed internal layer, built entirely within existing corporate tooling.

**No new software. No new procurement. No new platform training.**

| Layer | What it is | What it delivers |
| :--- | :--- | :--- |
| **Content** | 3,386 public files, 8 domains, 45 markets. AI-generated, human-verified. | The right answer exists, and it is right. |
| **Governance** | 12 register tables, 8 scanners, 7 detectors, 29 fault types. | It stays right without anyone remembering to check. |
| **Delivery** | 23 bot commands, 11 conversational workflows. | The answer reaches an agent mid-workflow, in under a minute. |

---

## The Numbers
| Metric | Figure |
| :--- | :--- |
| **Platform Cost** | **Zero.** (Utilizes existing corporate tooling). |
| **Effort** | 1,616 person-days |
| **Build Cost** | €406,000 to €606,000 |
| **Duration** | 2 years at 3.7 FTE |
| **Year One, realistic shape** | €203,000 to €303,000 |
| **Measured annual waste** | €1,890,000 to €2,810,000 |
| **Year One vs. low-end waste** | 11% to 16% |

### The Argument
Year One costs a sixth of the low end of measured annual waste, at most. The build pays back inside the first year with the library roughly half complete. It does not require completion, and it does not require the waste figure to be at the upper end. 

*(Note: Earlier versions cited an ROI multiple; the raw comparison is stronger, because a multiple invites an argument about its derivation that this raw fractional breakdown does not).*

---

## What We Are Asking For
| Ask | Detail |
| :--- | :--- |
| **Charter approval** | Sign the charter. Stage 0 starts the next working day. |
| **Effort** | 1,616 person-days over two years, roughly 3.7 FTE. |
| **Budget** | Labour only. No platform cost, no licence, no procurement. |
| **Key people** | One developer for 225 days. Subject experts for merge decisions. |
| **Gate availability** | Six gate decisions across two years, 30 minutes each. |

*Both hard prerequisites are already closed. Enterprise tier is structural. EU residency is confirmed. Nothing blocks the start.*

---

## The Execution Plan
| Stage | Duration | What gets done | Gate / Decision Point |
| :--- | :--- | :--- | :--- |
| **Sandbox** | 1 week | Five platform tests. | Three can change the design. |
| **Platform** | 8 weeks | Space, schema, application, automation. | Publish integrity verified by deliberate failure. |
| **Pilot** | 4 weeks | One market, 74 files, all 8 folders. | Lists locked. Cost model measured. |
| **Public Scale** | 16 months | 44 remaining markets. | Per-market completion. |
| **Internal Estate** | 10 months (Parallel) | Discovery, triage, migration, permission repair. | Baseline recorded before anything moves. |
| **Console** | 6 months (Parallel) | Nine administrative surfaces. | Agent lockdown verified first. |

**Critical Decision Points:** 
The pilot measures the two assumptions the cost model rests on. If verification effort is materially higher than assumed, that is a strategy question about the AI-generation approach, not just a number to adjust. Discovery resolves the largest cost uncertainty in the programme, blocks nothing, and runs as early as resources allow.

---

## Success Criteria
| Measure | Target |
| :--- | :--- |
| **Coverage** | 3,386 files published. |
| **Findability** | 90% of a fixed query set in 3 clicks or 1 command. |
| **Currency** | Zero files past review + 30 days. |
| **Verification** | 100% of published files verified within cadence. |
| **Adoption** | 80% of the roster active monthly. |
| **Integrity** | Zero register-to-wiki divergence, 14 consecutive nights. |
| **Internal Estate** | Zero orphaned nodes, zero per-document permissions. |

*Note: Findability is the one that fails silently. Coverage, currency, and integrity are measured autonomously by the system and will be visible. Findability must be measured quarterly by an external party, and it determines whether the other six metrics mattered.*

---

## The Two Critical Risks
Everything else is a schedule risk. These two make the investment worthless rather than late.

| Risk | Why it is critical | Mitigation |
| :--- | :--- | :--- |
| **Generated content is plausible but wrong** | It is acted on with confidence by users who cannot tell. | Mandatory verification protocol. Perishable claims identified before drafting. |
| **Built and not used** | Every correctness measure reads healthy while nobody opens the system. | Four entry points, conversational bot commands, quarterly external findability measurement. |

---

## Interrogating the Denominator
The waste denominator (€1.89M to €2.81M) is derived from a 200-person enterprise population. The active roster served directly by this specific library tier is 50. Three readings are possible, and they are not equivalent:

1. **The waste is tenant-wide, this library addresses the activation share:** The comparison is directionally right, the ratio is understated.
2. **The waste should be scaled to 50:** The figure falls, and so does the headline.
3. **The waste is activation-specific and already scoped to this population:** The figure stands as written.

*The locked constants are not recalculated here, but which reading applies must be settled before this model scales, as it is the first question a numerate stakeholder will ask.*
