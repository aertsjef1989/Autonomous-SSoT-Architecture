# Syndicate II. Unit-Share NAV Ledger & Tipgame Integrity

**Focus:** Unit-Share NAV Accounting, Group Slip Voting Locks, and Ledger Auditability

---

## 1. Unit-Share NAV Accounting Model
Equal splits break down when members contribute or withdraw at different points in a run. A unit-share **Net Asset Value (NAV)** model prices entry and exit against current pool value:

`NAV_per_unit = Total_Pool_Value / Total_Active_Units`

- **Contribution (Unit Issuance):** New units issued equal `Deposit_Amount / NAV_per_unit`, preserving existing holders' per-unit valuation at the moment of entry.
- **Redemption (Unit Burn):** Exiting units are priced at the prevailing `NAV_per_unit` and retired from total active units.
- **Append-Only Ledger Discipline:** Deposits, slip stakes, payouts, and adjustments are recorded as immutable ledger entries rather than overwriting prior balances.

## 2. Group Slip Voting & Interactive Section Demo
- **Pre-Kickoff Lock:** Members propose and vote on matchday slips prior to kickoff; once locked at cutoff, slip selections and stakes cannot be edited post-event.
- **Interactive Section Demo:** Open [Part III Interactive Demo](demo/index.html) to test Poisson/xG win/draw/loss probabilities, pre-kickoff slip locking, and unit-share NAV deposit/settlement math on synthetic matchday data.
