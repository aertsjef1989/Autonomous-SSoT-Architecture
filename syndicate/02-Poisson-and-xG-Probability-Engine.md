# Syndicate II. Poisson, Dixon-Coles & Shin De-Vigging Engine

**Focus:** Attack/Defense Strength Derivation, Dixon-Coles (1997) Low-Score Correlation & Shin (1993) Insider Overround Removal · **Status:** `Implemented` + `Prototype` (Simulation Only)

> **Simulation Disclaimer:** Educational statistical modeling specification using synthetic league tables (or read-only competition standings) and non-monetary **virtual units (`VU`)**. Zero real-money wagering, bookmaker execution, or pooled financial custody.

---

## 1. Why xG and Low-Score Correlation Beat Raw Scorelines

Modeling football matches from raw historical scorelines alone suffers from two well-documented statistical defects:
1. **Small-Sample Finishing Variance:** Over a 4- to 8-match league phase, clinical finishing streaks or goalkeeper outliers cause actual goals (`GF`, `GA`) to diverge sharply from underlying shot quality (`xG`, `xGA`). Anchoring team strength indices on blended `xG` / rate metrics stabilizes out-of-sample forecasts.
2. **Low-Score Dependence Violation:** Naive independent Poisson assumes `P(H = h, A = a) = P(H = h) * P(A = a)` across all scorelines. Empirically in European club football, tactical game-state management inflates **`0-0` and `1-1` draws** (`+1.2%` to `+2.2%` probability mass) while slightly depressing `1-0` and `0-1` outcomes relative to independent Poisson.

---

## 2. Four-Stage Probability & De-Vigging Pipeline

### 2.1 Stage 1: Relative Attack & Defense Strength Indexing
Given competition-wide mean goals per team-match `mu_bar` (typically `1.45` to `1.55` in European league-phase play), each club `i`'s attacking index `alpha_i` and defensive concession index `beta_i` are bounded and normalized relative to league parity (`1.00`):

```text
alpha_i = clip(AttackRate_i / mu_bar, 0.55, 2.10)
beta_i  = clip(ConcedeRate_i / mu_bar, 0.55, 2.10)
```

### 2.2 Stage 2: Expected Goal Intensities (`lambda_H`, `lambda_A`)
Expected goal intensities combine home attacking strength, away defensive vulnerability, and venue multipliers (`gamma_H = 1.10`, `gamma_A = 0.94`):

```text
lambda_H = clip(mu_bar * gamma_H * alpha_H * beta_A, 0.35, 4.20)
lambda_A = clip(mu_bar * gamma_A * alpha_A * beta_H, 0.35, 4.20)
```

### 2.3 Stage 3: Dixon & Coles (1997) Correlated Scoreline Matrix
First, independent marginal Poisson probabilities are evaluated for `k` in `0..8`:

`P_ind(X = k | lambda) = (lambda^k * exp(-lambda)) / k!`

Next, **Dixon & Coles (1997)** (*Applied Statistics*, 46(2), 265-280, https://doi.org/10.1111/1467-9876.00065, accessed 2026-11-26) apply the low-score dependence kernel `tau(h, a, lambda_H, lambda_A, rho)` strictly to the `(0,0)`, `(0,1)`, `(1,0)`, and `(1,1)` cells:

```text
tau(0, 0) = 1 - (lambda_H * lambda_A * rho)
tau(0, 1) = 1 + (lambda_H * rho)
tau(1, 0) = 1 + (lambda_A * rho)
tau(1, 1) = 1 - rho
tau(h, a) = 1                                  (for all h >= 2 or a >= 2)
```

* **Positivity & Normalization Guarantee:** To ensure `tau >= 0` for all `(lambda_H, lambda_A)`, `quant.ts` clamps `rho` dynamically inside `max(-0.22, -0.95 / max(lambda_H, lambda_A)) <= rho <= min(0.12, 0.95 / (lambda_H * lambda_A))` and normalizes the truncated `9 x 9` grid (`0..8 x 0..8`) by `Z = SUM_{h=0..8} SUM_{a=0..8} P_ind(h | lambda_H) * P_ind(a | lambda_A) * tau(h, a)` so total probability equals `1.0000` identically.
* **Empirical Effect (`rho = -0.11`):** When `rho < 0`, `tau(0,0) = 1 + |rho| * lambda_H * lambda_A > 1` and `tau(1,1) = 1 + |rho| > 1`, shifting probability mass onto `0-0` and `1-1` draws while reducing `1-0` and `0-1` cells proportionally.

---

## 3. Aggregated Markets & Shin (1993) Overround De-Vigging

Summing normalized cells `P_DC(h, a)` across the `9 x 9` matrix yields coherent probabilities across correlated markets from one unified distribution:
* **1X2 Match Result:** Home Win (`h > a`), Draw (`h == a`), Away Win (`h < a`).
* **Goal Totals & BTTS:** Over `2.5` Goals (`h + a >= 3`) and Both Teams to Score (`h >= 1` and `a >= 1`).

### 3.1 Why Raw Implied Odds & Multiplicative De-Vigging Misprice Longshots
Given 3-way decimal reference odds `(O_1, O_X, O_2)`, raw inverse probabilities `q_i = 1 / O_i` sum to `S = q_1 + q_X + q_2 > 1`, where `Overround = S - 1` is the bookmaker's vig (typically `4.0%` to `6.0%`).
* **Naive Raw Edge (`P_model - 1 / O_i`):** Penalizes every outcome by the full bookmaker margin.
* **Multiplicative Normalization (`p_mult_i = q_i / S`):** Assumes equal margin across favorites and underdogs, ignoring the well-known **favorite-longshot bias** (market makers load disproportionately higher margin onto high-odds underdogs and draws to protect against informed sharp flow).

### 3.2 Shin (1993) Insider-Proportion De-Vigging (`computeShinDevig`)
Syndicate implements **Shin (1993)** (*The Economic Journal*, 103(419), 1141-1153, https://doi.org/10.2307/2234240, accessed 2026-11-26), solving via 32-step bisection (`< 1e-9` precision) for the implied informed-trader share `z` in `[0, 0.35)` such that `p_shin_1(z) + p_shin_X(z) + p_shin_2(z) = 1`:

```text
p_shin_i(z) = ( sqrt( z^2 + 4 * (1 - z) * (q_i^2 / S) ) - z ) / ( 2 * (1 - z) )
```

### 3.3 Worked Fixture Comparison (`Thames Athletic vs Ruhr Valley BV`)

| Metric | Naive Independent Poisson (`rho = 0.00`) | Dixon-Coles (`rho = -0.11`) | Market Book (`1.82 / 3.90 / 4.40`, Vig `3.31%`) | Edge Evaluation |
| :--- | :---: | :---: | :---: | :--- |
| **Home Win (`1`)** | `58.8%` | **`57.7%`** | Raw `54.95%` · Mult `53.18%` · **Shin `53.67%`** | **`+4.00%` Shin Edge** (`+2.72%` raw) |
| **Draw (`X`)** | `21.8%` | **`24.0%`** (`+2.2%`) | Raw `25.64%` · Mult `24.82%` · **Shin `24.61%`** | `-0.61%` (Pass) |
| **Away Win (`2`)** | `19.4%` | **`18.3%`** | Raw `22.73%` · Mult `22.00%` · **Shin `21.72%`** | `-3.42%` (Pass) |

Notice how both adjustments protect the syndicate from false positives: Dixon-Coles prevents underestimating the draw (`24.0%` vs `21.8%`), while Shin de-vigging extracts the true market probability (`53.67%` at `z = 0.0166`) before Quarter-Kelly sizing (`1.51%` of virtual pool NAV).
