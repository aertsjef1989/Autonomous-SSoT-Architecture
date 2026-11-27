# Syndicate III. Group Tipgame & Selection Card Integrity

**Focus:** Democratic Selection Proposals, Sybil/Whale-Neutral Quorum Voting, Pre-Kickoff Lock Enforcement & Multi-Leg Correlation Guards · **Status:** `Prototype` + `Designed` (Simulation Only)

> **Simulation Disclaimer:** Educational consensus and state-machine prototype using **virtual units (`VU`)** and synthetic fixtures. Domain terms (`slip`, `stake`, `payout`) denote simulated **selection cards**, **virtual unit allocations**, and **simulated settlement returns** only; zero real-money wagering occurs.

---

## 1. Structured Selection Card Lifecycle

Informal group chats produce ambiguous picks, selective memory, and post-lineup hindsight disputes. Syndicate enforces a deterministic 5-state lifecycle on every simulated matchday selection card (`slip`):

```text
[PROPOSED] --(Shin Edge >= +2.5% + 1/4 Kelly Cap)--> [VOTING_OPEN]
                                                           |
                     +-------------------------------------+-------------------------------------+
                     | (T - 15m: Quorum < 50% or Yes < 60%)                                      | (T - 15m: Quorum >= 50% & Yes >= 60%)
                     v                                                                           v
             [REJECTED_EXPIRED]                                                         [LOCKED_PRE_KICKOFF]
              (0.0000 VU Risk)                                                                   |
                                                           +-------------------------------------+---------------------+
                                                           | (FT Won)                            | (FT Lost)           | (Postponed > 48h)
                                                           v                                     v                     v
                                                    [SETTLED_GAIN]                        [SETTLED_LOSS]          [VOID_PUSH]
```

| State | Allowed Mutations | Server Clock & Database Guardrail |
| :--- | :--- | :--- |
| **`PROPOSED`** | Author may attach fixture ID, market (`1X2`, `O2.5`, `BTTS`), and reference price | Blocked if `NOW() >= kickoff_utc - INTERVAL '30 minutes'` or `shin_edge_pct < 2.50` |
| **`VOTING_OPEN`** | Active members cast or toggle boolean vote (`YES` / `NO`) | Selection market, price, and capped `VU` allocation are frozen once voting opens |
| **`LOCKED_PRE_KICKOFF`** | **Zero client mutations (`HTTP 403`)** | Enforced by database `CHECK` / trigger against `kickoff_utc - INTERVAL '15 minutes'`; triggers NAV dealing freeze |
| **`SETTLED_GAIN` / `SETTLED_LOSS`** | **Immutable terminal state** | Writes single idempotent `SETTLE_SLIP` row into `syndicate_pool_ledger` |
| **`VOID_PUSH`** | **Immutable terminal state (`0.0000` net `VU` delta)** | Triggered automatically if match is abandoned or postponed beyond `48 hours` |

---

## 2. Integrity Guardrails & Neutral Terminology

| Failure Mode | Operational Impact | Architectural Control |
| :--- | :--- | :--- |
| **Post-Kickoff or Post-Lineup Edits** | Altering selection cards after starting XIs leak (`T - 60m`) or after an early goal | Hard server-side timestamp lock (`kickoff_utc - 15 min` evaluated via database `NOW()`, never client `Date.now()`); write routes reject mutations with `HTTP 403`. |
| **Unilateral Unit Sizing** | One enthusiastic participant allocating `25%` of the virtual pool on a derby | Allocation auto-computed by `quant.ts` at `0.25 * Full_Kelly` and hard-capped at **`5.00%` of current Pool NAV** (`<= 15.00%` aggregate concurrent matchday exposure). |
| **Correlated Multi-Leg Parlay Inflation** | Combining `Home Win` + `Home Over 1.5` or two high-tempo matches as if independent | Multi-leg cards are restricted to **independent fixtures only** (`UNIQUE (slip_id, fixture_id)`); same-game combinations are computed strictly from joint Dixon-Coles matrix cells rather than multiplying marginal probabilities. |
| **Disputed Settlement or Abandoned Match** | Disagreement over extra-time goals or postponed fixtures | Settlement binds strictly to **90-minute regulation full-time (`FT`)** on canonical `fixture_id`; matches unplayed within `48h` settle deterministically as `VOID_PUSH` (`1.0000` multiplier). |

---

## 3. Governance Quorum & Anti-Whale Voting Rules

A recurring governance defect in pooled prediction clubs is **plutocratic capture**: if voting power scales with unit holdings, a single founding member holding `55%` of units can unilaterally force every pick, turning a collaborative syndicate into a one-person feed.

Syndicate separates **economic unit ownership** from **epistemic selection governance**:
1. **One Active Member, One Governance Vote:** Every verified member holding `>= 10.000000` active units receives exactly `1` governance vote per proposed card (`PRIMARY KEY (slip_id, member_id)`).
2. **Dual Approval Gate at `T - 15m`:** A card transitions from `VOTING_OPEN` to `LOCKED_PRE_KICKOFF` if and only if both conditions hold at `kickoff_utc - 15m`:
   * **Participation Quorum:** `Votes_Cast / Active_Members >= 0.50` (`50%` minimum turnout).
   * **Supermajority Consensus:** `Votes_Yes / Votes_Cast >= 0.60` (`60%` minimum approval).
3. **Fail-Safe Default (`Pass`):** If quorum or supermajority is not met before `T - 15m`, the card transitions automatically to `REJECTED_EXPIRED` with `0.0000 VU` committed. In quantitative risk management, missing a marginal `+3%` edge costs far less than executing an unvetted allocation.
