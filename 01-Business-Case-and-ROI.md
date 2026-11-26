# 01. Business Case and ROI (Standardized Lean Reference Model)

**Status:** `Designed` (Parameterized Reference Model)

## 1. Purpose and Modeling Principle
To keep this architecture portfolio transferable and independently verifiable, all financial, operational, and sizing figures across this chapter and subsequent chapters use a single **standardized 100-seat, 40-market enterprise reference model** (`60` frontline `AGT` seats plus `40` QA, management, and admin seats) built on Lean Six Sigma DMADV methodology. No employer-specific or proprietary figures are used anywhere in the specification. Any reader can substitute their own seat count, market count, hourly rate, and search-time baseline into the formulas below.

## 2. Reference Scenario Parameters

| Parameter | Symbol | Reference Value | Basis / Assumption |
| :--- | :--- | :--- | :--- |
| Active knowledge-worker seats | `N` | 100 seats | Standardized regional operations team (`60` `AGT` + `40` `QAS`/`FLM`/`MGR`/`UPM`/`ADM`) |
| Reference market topology | `M` | 40 markets | Parameterized multi-region deployment (`3,055` public nodes + `1,200` initial internal nodes) |
| Working days per year | `D` | 220 days | Standard EU full-time annual working calendar |
| Fully loaded hourly labor cost | `R` | EUR 45 / hour | Illustrative EU blended operations rate |
| Baseline daily friction (search, rework, stale-doc verification) | `T_base` | 0.50 hours / day (30 min) | Modeled Muda (waiting + over-processing) baseline |
| Conservative recovery rate | `P_low` | 40% | Low-end Lean target after SSoT deployment |
| Target recovery rate | `P_high` | 60% | Mature state with autonomous staleness governance |

## 3. Reproducible Lean Formula

Annualized baseline productivity waste (`W_annual`):

`W_annual = N * D * T_base * R`

Substituting the reference parameters:

`W_annual = 100 * 220 * 0.50 * 45 = EUR 495,000 / year`

Gross recoverable annual value range:
* **Conservative (40% recovery):** `495,000 * 0.40 = EUR 198,000 / year`
* **Target (60% recovery):** `495,000 * 0.60 = EUR 297,000 / year`

## 4. Infrastructure, Implementation Cost & Payback (`[Status: Designed]`)
Because the SSoT architecture runs on existing enterprise workspace primitives (Enterprise Wiki, Relational Governance Base, and ChatOps Bot), incremental software license fees are `EUR 0 / year`, while engineering build and operational maintenance require explicit labor inputs:

### 4.1 Illustrative Cost Inputs & Net Payback Formula
| Cost Component | Symbol | Illustrative Value | Basis / Derivation (Illustrative Reference) |
| :--- | :--- | :--- | :--- |
| Incremental SaaS license fees | `C_lic` | `EUR 0 / year` | Reuses existing enterprise wiki, relational base, and bot entitlements |
| One-off implementation effort | `C_build` | `EUR 25,200` (one-off) | Illustrative `560` engineering/ops hours at `EUR 45 / hour` (schema, bot, scanners, Stage 6 gate) |
| Ongoing annual maintenance | `C_maint` | `EUR 9,900 / year` | Illustrative `220` hours/year at `EUR 45 / hour` (daily 5-min standup, quarterly audits, upkeep) |

**Net Annual Value & Simple Payback Formulas:**
* `V_net_steady = V_gross - C_maint`
  * Conservative (`40%`): `198,000 - 9,900 = EUR 188,100 / year`
  * Target (`60%`): `297,000 - 9,900 = EUR 287,100 / year`
* `Payback_months (steady-state run rate) = 12 * C_build / (V_gross - C_maint)`
  * Conservative (`40%`): `12 * 25,200 / 188,100 = 1.61 months` (post-ramp)
  * Including Year-1 quarterly adoption ramp (`62.5%` weighted Year-1 realization below): **~3.4 months** from Wave 1 launch (`Year-1 Net = 198,000 * 0.625 - 9,900 - 25,200 = EUR 88,650`).

### 4.2 Year-1 Quarterly Adoption Ramp
| Quarter | Rollout Wave Milestone | Active Adoption Share | Conservative Gross (`40%`) | Target Gross (`60%`) |
| :--- | :--- | ---: | ---: | ---: |
| **Q1** | Stage 6 Single-Market Gate + Wave 1 | `25%` | `EUR 12,375` | `EUR 18,563` |
| **Q2** | Regional Wave 2 + Bot Enablement | `50%` | `EUR 24,750` | `EUR 37,125` |
| **Q3** | Full 40-Market Scale-Out (`Stage 7`) | `75%` | `EUR 37,125` | `EUR 55,688` |
| **Q4** | Steady-State Governance + Internal (`Stage 8`) | `100%` | `EUR 49,500` | `EUR 74,250` |
| **Year-1 Total** | **Weighted Average Realization: `62.5%`** | **`62.5%`** | **`EUR 123,750`** | **`EUR 185,625`** |

### 4.3 Multi-Parameter Sensitivity Matrix (Steady-State Gross / Net After `EUR 9,900` Maintenance)
*(All cells use `D = 220 days`, `R = EUR 45 / hour`.)*

| Seats (`N`) | Daily Friction (`T_base`) | Annual Waste (`W_annual`) | `25%` Recovery (Gross / Net) | `40%` Recovery (Gross / Net) | `60%` Recovery (Gross / Net) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| `50` | `15 min` (`0.25h`) | `EUR 123,750` | `EUR 30,938` / `EUR 21,038` | `EUR 49,500` / `EUR 39,600` | `EUR 74,250` / `EUR 64,350` |
| `50` | `30 min` (`0.50h`) | `EUR 247,500` | `EUR 61,875` / `EUR 51,975` | `EUR 99,000` / `EUR 89,100` | `EUR 148,500` / `EUR 138,600` |
| **`100` (Ref)** | **`30 min` (`0.50h`)** | **`EUR 495,000`** | **`EUR 123,750` / `EUR 113,850`** | **`EUR 198,000` / `EUR 188,100`** | **`EUR 297,000` / `EUR 287,100`** |
| `100` | `15 min` (`0.25h`) | `EUR 247,500` | `EUR 61,875` / `EUR 51,975` | `EUR 99,000` / `EUR 89,100` | `EUR 148,500` / `EUR 138,600` |
| `200` | `30 min` (`0.50h`) | `EUR 990,000` | `EUR 247,500` / `EUR 237,600` | `EUR 396,000` / `EUR 386,100` | `EUR 594,000` / `EUR 584,100` |
| `200` | `45 min` (`0.75h`) | `EUR 1,485,000` | `EUR 371,250` / `EUR 361,350` | `EUR 594,000` / `EUR 584,100` | `EUR 891,000` / `EUR 881,100` |

## 5. Governance Risk Mitigation
Beyond direct time recovery, the `10 automated controls (5 scheduled scanners, 5 event detectors)` (`[Status: Designed]`) and 30-day autonomous archive kill switch bound silent compliance drift (outdated policies, broken ownership, and unverified procedures) without adding dedicated knowledge-management headcount.
