# Syndicate II. Poisson & xG Probability Engine

**Focus:** Attack/Defense Strength Derivation, Bivariate Goal Rates & Market-Edge Calibration

---

## 1. Why xG Over Raw Scorelines
Raw football scores are high-variance noise; a team can win `1-0` while conceding `2.4 xG`. Anchoring the model on rolling expected goals (`xG` and `xGA`) stabilizes probability estimates across small matchday samples.

---

## 2. Three-Stage Probability Pipeline
1. **Strength Indexing:** Compute each team's home/away attacking strength and defensive concession index relative to the league average.
2. **Expected Goal Rates (`lambda_H`, `lambda_A`):** Multiply relative attack strength, opponent defensive weakness, and league home-advantage baseline to derive expected goals for both sides.
3. **Scoreline Matrix (`0-0` through `7-7`):** Evaluate independent Poisson probabilities for every scoreline pair `(h, a)` using:
   `P(X = k) = (lambda^k * e^-lambda) / k!`

---

## 3. Aggregated Markets & Edge Detection
Summing cells across the scoreline matrix produces calibrated probabilities for:
* **1X2 Outcomes:** Home Win (`h > a`), Draw (`h == a`), Away Win (`h < a`).
* **Goal Lines:** Over/Under `2.5` goals and Both Teams to Score (BTTS).
* **Value Edge:** Compares model-implied fair odds (`1 / P_model`) against bookmaker implied probability (`1 / Odds_market`). Slips are only flagged as positive-EV when edge exceeds the syndicate's minimum margin threshold.
