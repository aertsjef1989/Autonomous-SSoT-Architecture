# Syndicate I. Mandate, Poisson / xG Engine & Dashboard

**Focus:** Statistical Football Modeling, Python Poisson Engine, Read-Only Next.js Dashboard, and Group Tipgame

---

## 1. The Problem & Target Outcome
Informal football prediction pools and shared matchday groups often rely on gut feel, recent scoreline bias, and manual spreadsheets that break when members join, exit, or settle slips. Syndicate Matchday AI pairs a **Python Poisson / xG modeling engine**, a **read-only Next.js dashboard**, a **democratic group slip-voting tipgame**, and a **unit-share NAV financial ledger** for private groups.

- **Core Objective:** Anchor match probabilities in expected-goals (xG) and Poisson distributions while keeping member balances and slip rules transparent and deterministic.
- **Read-Only Dashboard Boundary:** The Next.js frontend acts as a clean read-only inspection and voting surface over structured data rather than mutating financial balances directly from client state.

## 2. Python Poisson & xG Probability Pipeline
Match probabilities are generated from team attacking/defensive strength estimates and expected goals (xG / xGA):

1. **Fixture & xG Ingestion:** Collect upcoming fixtures, historical xG/xGA records, and match context inputs.
2. **Goal Rate (`lambda_H`, `lambda_A`) Estimation:** Derive expected home and away goal rates from relative attack/defense strength and league baseline scoring rates.
3. **Poisson Scoreline Matrix:** Compute probability weights across scoreline pairs `(i, j)` using `P(X = k) = (lambda^k * e^-lambda) / k!` to aggregate Home/Draw/Away probabilities, goal lines, and model-vs-market edge comparisons.
