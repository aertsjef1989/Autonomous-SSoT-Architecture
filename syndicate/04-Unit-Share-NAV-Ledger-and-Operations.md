# Syndicate IV. Unit-Share NAV Ledger & Operations

**Focus:** Unit-Share NAV Pricing, Mint/Burn Accounting & Append-Only Ledger Invariants · **Status:** `Prototype` + `Designed` (Simulation Only)

> **Simulation Disclaimer:** Educational unit-accounting specification using non-monetary **virtual units (`VU`)** and synthetic fixtures. Zero real-money pooling, investment fund administration, or financial custody.

---

## 1. Why Equal Splits Fail
If a simulation pool starts with `4` participants contributing `100 VU` each (`400 VU` pool), grows through settled selection returns to `600 VU`, and a `5th` participant enters with `100 VU`, a naive equal split (`700 / 5 = 140 VU` each) dilutes the original four participants from `150 VU` to `140 VU`. **Unit-Share NAV Accounting** eliminates entry/exit dilution using deterministic unit pricing.

---

## 2. Core NAV Equations & Worked Dilution-Proof Example (`Virtual Units`)
* **Current Unit Price:** `NAV_per_unit = Total_Pool_VU / Total_Active_Units`
* **Participant Entry (Mint Units):** `Units_Minted = Contribution_VU / NAV_per_unit`
* **Participant Exit (Burn Units):** `Redemption_VU = Units_Burned * NAV_per_unit`

### 2.1 Step-by-Step Worked Example
| Step | Event | Pool (`VU`) | Active Units (`NUMERIC(18,6)`) | Display Units (`2 dp`) | `NAV / Unit` (`VU`) | Original Member Value (`100` units) |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| **1. Seed** | `4` members contribute `100.00 VU` each | `400.0000` | `400.000000` | `400.00` | **`1.0000`** | `100.00 VU` |
| **2. Settlement** | Settled selection cards return `+200.00 VU` net | `600.0000` | `400.000000` | `400.00` | **`1.5000`** | `150.00 VU` |
| **3. New Entry** | `5th` member contributes `100.00 VU` (`100 / 1.50`) | `700.0000` | `466.666667` (`+66.666667`) | `466.67` (`+66.67`) | **`1.5000`** | **`150.00 VU` (zero dilution)** |

Existing participants hold `100 * 1.50 = 150.00 VU` both before and after the `5th` participant enters, while the entrant holds `66.666667 * 1.50 = 100.00 VU`.

---

## 3. Valuation, Dealing Cutoffs & Precision Rules (`[Status: Designed]`)

### 3.1 Open Selection Valuation Rule (At-Cost Until Settlement)
Any selection card in `LOCKED_PRE_KICKOFF` (in-play or awaiting official full-time confirmation) is valued **strictly at committed virtual-unit cost (`allocated_vu`)** until official settlement (`SETTLED_GAIN` or `SETTLED_LOSS`). Marking open picks to live in-play prices would inject feed-latency arbitrage and phantom NAV swings.

### 3.2 Contribution & Redemption Cutoff Windows (Stale-NAV Gaming Defense)
If a participant could mint units at `1.50 VU` while a locked selection card is `85` minutes into a `3-0` lead, they would capture virtually risk-free settlement upside at stale pre-match NAV (diluting existing holders). To block stale-NAV gaming:
* **Dealing Freeze Window:** Mint (`DEPOSIT`) and burn (`REDEEM`) requests are **queued, not priced**, whenever `COUNT(selection_cards WHERE state = 'LOCKED_PRE_KICKOFF') > 0` or within `15 minutes` prior to any scheduled kickoff (`T - 15m`).
* **Dealing Execution:** Queued entries and exits strike exclusively at the **post-settlement inter-matchday NAV** once every locked card in the active window reaches a terminal settled state.

### 3.3 Fixed-Scale Numeric Type & Rounding Policy
Floating-point (`FLOAT` / `DOUBLE PRECISION` / JS binary math) is prohibited in ledger storage:
* **Column Types:** `delta_vu NUMERIC(18, 4) NOT NULL` and `delta_units NUMERIC(18, 6) NOT NULL`, with `nav_per_unit NUMERIC(18, 6) NOT NULL`.
* **Rounding Rule:** `ROUND_HALF_EVEN` (banker's rounding) at `6` decimal places for unit minting/burning and `4` decimal places for `VU` settlement amounts.
* **Residual Allocation:** Any sub-unit rounding remainder (`r = contribution_vu - ROUND(units_minted * nav_per_unit, 4)`, bounded within `+/- 0.0001 VU`) is posted in the same atomic transaction to a non-voting `pool_rounding_reserve` ledger bucket so `SUM(delta_vu)` reconciles identically to `0.0000` discrepancy.

---

## 4. Database-Enforced Append-Only Ledger (`[Status: Designed]`)
Application discipline alone does not make a ledger immutable; PostgreSQL enforces append-only semantics at the engine layer:

1. **Privilege Revocation:** `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE syndicate_ledger FROM app_writer, authenticated, anon;` (only `SELECT` and `INSERT` via a `SECURITY DEFINER` stored procedure are granted).
2. **Defensive Trigger:** A `BEFORE UPDATE OR DELETE ON syndicate_ledger` trigger unconditionally raises `RAISE EXCEPTION 'IMMUTABLE_LEDGER_VIOLATION: rows in syndicate_ledger cannot be mutated or deleted'`.
3. **Idempotency Keys:** `idempotency_key TEXT UNIQUE NOT NULL` on `syndicate_ledger` prevents network retries or double-clicks from minting duplicate units or settling a card twice.
4. **Optional Tamper-Evident Hash Chain:** Each row stores `prev_row_hash CHAR(64)` and `row_hash = encode(sha256(concat_ws('|', prev_row_hash, seq, idempotency_key, kind, delta_vu, delta_units)::bytea), 'hex')` so offline CSV/JSON exports (`T0..Tn`) remain independently verifiable.

---

## 5. Failure Modes & Verification Criteria

| Failure Mode | Consequence Without Control | Enforced Guardrail | Verification Assertion |
| :--- | :--- | :--- | :--- |
| **Late Entry on Winning In-Play Card** | Entrant buys units at stale pre-match NAV and dilutes existing holders | Dealing freeze while any card is `LOCKED_PRE_KICKOFF` | Mint request during active match window returns `202 QUEUED_NEXT_NAV` rather than immediate mint |
| **IEEE-754 Float Drift** | `466.6666666666667 * 1.5` drifts from `700.00` over hundreds of epochs | `NUMERIC(18,6)` + `ROUND_HALF_EVEN` + `pool_rounding_reserve` | 1,000 randomized mint/burn/settle fuzz cycles assert `ABS(SUM(delta_vu) - pool_vu) == 0.0000` |
| **Duplicate Webhook / Retry Settlement** | Winning selection credited twice | `UNIQUE (idempotency_key)` constraint inside atomic transaction | Replaying identical `settle:card_042` payload returns cached receipt with zero new rows |
| **Direct Row Tampering** | Silent retrospective balance edit | `REVOKE UPDATE, DELETE` + `BEFORE UPDATE OR DELETE` exception trigger | Direct `UPDATE syndicate_ledger` test fails with `IMMUTABLE_LEDGER_VIOLATION` |

## 6. Interactive Simulation Prototype
*(Simulation only: non-monetary virtual units (`VU`) and synthetic European League fixtures; zero live pooled funds. Note: browser demo uses 2-decimal UI display for readability; production spec enforces `NUMERIC(18,6)` server-side.)*

* [Launch Syndicate 5-Tab Simulation & NAV Ledger Prototype](demo/index.html)
