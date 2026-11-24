# Syndicate IV. Unit-Share NAV Ledger & Operations

**Focus:** Unit-Share NAV Pricing, Mint/Burn Accounting & Append-Only Ledger Invariants

---

## 1. Why Equal Splits Fail
If a syndicate starts with 4 members at €100 each (€400 pool), grows the pool to €600, and a 5th member joins with €100, a naive equal split instantly dilutes existing members. **Unit-Share NAV Accounting** solves this with fund-grade precision.

---

## 2. Core NAV Equations
* **Current Unit Price:** `NAV_per_unit = Total_Pool_Value / Total_Active_Units`
* **Member Deposit (Mint Units):** `Units_Minted = Deposit_Amount / NAV_per_unit`
* **Member Withdrawal (Burn Units):** `Payout_Amount = Units_Burned * NAV_per_unit`

Existing members' per-unit value remains completely unchanged at the exact moment a new member enters or exits.

---

## 3. Append-Only Ledger Discipline
* **Zero In-Place Updates:** Balances are never overwritten with `UPDATE balance = ...`. Every deposit, withdrawal, slip stake, and winning payout appends a signed ledger row.
* **Reconciliation Invariant:** `SUM(ledger_cash_flows) == Total_Pool_Value` and `SUM(member_unit_deltas) == Total_Active_Units` are asserted on every transaction.

## 4. Interactive Architecture Prototype
Launch the [Syndicate 3-Tab Interactive Prototype](https://aertsjef1989.github.io/systems-design-portfolio/syndicate/demo/) to test the Poisson/xG scoreline matrix, pre-kickoff slip voting locks, and unit-share NAV mint/burn ledger.
