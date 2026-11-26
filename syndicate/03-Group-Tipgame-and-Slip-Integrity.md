# Syndicate III. Group Tipgame & Selection Card Integrity

**Focus:** Democratic Selection Proposals, Voting Thresholds & Pre-Kickoff Lock Enforcement · **Status:** `Prototype` (Simulation Only)

> **Simulation Disclaimer:** Educational consensus and state-machine prototype using **virtual units (`VU`)** and synthetic fixtures. Domain terms (`slip`, `stake`, `payout`) denote simulated **selection cards**, **virtual unit allocations**, and **simulated settlement returns** only; zero real-money wagering occurs.

---

## 1. Structured Selection Card Lifecycle
Informal group chats produce ambiguous picks and hindsight disputes. Syndicate enforces a strict state machine on every simulated matchday selection card (`slip`):

`PROPOSED` -> `VOTING_OPEN` -> `LOCKED_PRE_KICKOFF` -> `SETTLED_GAIN / SETTLED_LOSS`

---

## 2. Integrity Guardrails & Neutral Terminology

| Failure Mode | Operational Impact | Architectural Control |
| :--- | :--- | :--- |
| **Post-Kickoff Edits** | Altering selection cards or virtual unit allocations after kickoff or lineup news | Hard server-side timestamp lock (`kickoff_utc - 15 min`); write routes reject mutations once locked. |
| **Unilateral Unit Sizing** | One participant over-allocating the shared virtual pool on a high-variance pick | Virtual unit allocation ceilings capped as a fixed percentage of current Pool NAV; requires quorum approval. |
| **Disputed Settlement** | Disagreement over final score or voided fixture rules | Settlement references canonical fixture IDs and writes an immutable `VU` settlement return receipt. |

---

## 3. Quorum & Voting Rules
* Each active unit holder receives one governance vote per matchday slip (preventing capital-weighted whales from overriding group consensus).
* A slip transitions to `LOCKED_PRE_KICKOFF` only when quorum (`>= 50%` active members) and approval threshold (`>= 60%` Yes votes) are met before cutoff.
