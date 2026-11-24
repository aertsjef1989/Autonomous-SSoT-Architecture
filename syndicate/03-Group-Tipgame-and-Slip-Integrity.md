# Syndicate III. Group Tipgame & Slip Integrity

**Focus:** Democratic Slip Proposals, Voting Thresholds & Pre-Kickoff Lock Enforcement

---

## 1. Structured Slip Lifecycle
Informal group chats produce ambiguous picks and hindsight disputes. Syndicate enforces a strict state machine on every matchday slip:

`PROPOSED` -> `VOTING_OPEN` -> `LOCKED_PRE_KICKOFF` -> `SETTLED_WIN / SETTLED_LOSS`

---

## 2. Integrity Guardrails

| Failure Mode | Operational Impact | Architectural Control |
| :--- | :--- | :--- |
| **Post-Kickoff Edits** | Members altering picks or stakes after early goals or lineup leaks | Hard server-side timestamp lock (`kickoff_utc - 15 min`); write routes reject mutations once locked. |
| **Unilateral Stake Sizing** | One member over-exposing the shared pool on a longshot | Stake ceilings capped as a fixed percentage of current Pool NAV; requires quorum approval. |
| **Disputed Settlement** | Disagreement over final score or voided leg rules | Settlement references canonical fixture feed IDs and writes an immutable settlement receipt. |

---

## 3. Quorum & Voting Rules
* Each active unit holder receives one governance vote per matchday slip (preventing capital-weighted whales from overriding group consensus).
* A slip transitions to `LOCKED_PRE_KICKOFF` only when quorum (`>= 50%` active members) and approval threshold (`>= 60%` Yes votes) are met before cutoff.
