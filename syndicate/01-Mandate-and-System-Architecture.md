# Syndicate I. Mandate & System Architecture

**Focus:** Quantitative Football Analytics, Dixon-Coles / Shin De-Vigging Pipeline, Read-Only Next.js Dashboard & PostgreSQL RLS Boundaries · **Status:** `Prototype` + `Designed` (Simulation Only)

> **Simulation Disclaimer:** Educational probability, risk-calibration, and unit-accounting prototype operating strictly on synthetic clubs (or read-only public match schedules in the private workspace) and non-monetary **virtual units (`VU`)**. Zero real-money pooling, wagering, bookmaker execution, or financial custody.

---

## 1. The Problem & Target Outcome

Recreational football prediction groups and informal analytics spreadsheets fail consistently across three dimensions:
1. **Cognitive & Recency Bias in Probability Estimation:** Human tipsters overweight last weekend's headline scoreline (`3-0` from `0.8 xG`), ignore low-score draw correlation (`0-0` and `1-1`), and compare raw probabilities against bookmaker prices without stripping asymmetric overround (`vig`).
2. **Hindsight & Post-Kickoff Mutation:** Selection threads in group chats blur tentative opinions with locked commitments, creating post-lineup or in-play disputes over which picks actually counted.
3. **Spreadsheet Entry/Exit Dilution:** Equal-split spreadsheets punish early participants whenever a new member joins after a profitable matchday run, or break completely when a member partially redeems virtual units mid-season.

**Syndicate Matchday AI** resolves all three failure modes through a decoupled four-plane architecture:
* **Plane 1 (Feed & Caching Ingestion):** Server-side adapter (`football-data.org` v4 standings/schedules + optional `the-odds-api.com` decimal h2h benchmarks) guarded by a `300-second` server memory cache and automatic deterministic simulation fallback when API keys are unset.
* **Plane 2 (Quantitative Inference & Risk Lab):** Pure deterministic modeling (`quant.ts`) computing relative attack/defense indices, **Dixon-Coles (1997)** correlated scoreline matrices, **Shin (1993)** insider de-vigging, **Brier / Log-Loss** calibration diagnostics, and **Quarter-Kelly (`5%` cap)** sizing validated via `1,000-path` Monte Carlo simulation.
* **Plane 3 (Democratic Tipgame & Pre-Kickoff Lock):** Structured selection cards (`slips`), one-member-one-vote quorum governance, and server-enforced `kickoff_utc - 15 minutes` mutation freezes.
* **Plane 4 (Dilution-Proof Unit-Share NAV Ledger):** Append-only `NUMERIC(18,6)` PostgreSQL ledger pricing every entry (`MINT`) and exit (`BURN`) at inter-matchday Net Asset Value (`NAV`).

```text
[football-data.org v4 + Optional Odds API]
   |
   v (5-Min Server Cache or Deterministic Sim Fallback)
[Quantitative Engine: Dixon-Coles (rho) + Shin De-Vigging + Quarter-Kelly (<= 5%)]
   |-- Analytical Readout -------------> [Read-Only Next.js / 6-Tab Lab UI] ---> [Signal Studio 16:9 & Press A4]
   |-- Qualifying Edge (>= +2.5%) -----> [Tipgame State Machine: Quorum >= 50%, Yes >= 60%, Lock T - 15m]
                                                |
                                                v (Official 90-Min FT Result)
                                         [PostgreSQL EU Ledger: NUMERIC(18,6) Append-Only, REVOKE UPDATE/DELETE]
```

---

## 2. System Topology & Read-Only Boundary

| Layer | Technology | Access & Mutation Boundary |
| :--- | :--- | :--- |
| **Feed & Quant Engine** | **TypeScript (`quant.ts`) & Python Reference Pipeline** | Pure deterministic functions computing `lambda_H`, `lambda_A`, Dixon-Coles `tau`, Shin `z`, Brier/Log-Loss scores, and seeded Mulberry32 Monte Carlo trajectories. |
| **Database & RLS** | **PostgreSQL 16 (EU Region + Row-Level Security)** | `ENABLE ROW LEVEL SECURITY` on `syndicate_fixtures`, `syndicate_slips`, `syndicate_votes`, and `syndicate_pool_ledger`; zero client-side balance writes. |
| **Web Workspace & Demo** | **Next.js App Router (`/syndicate`) & Static 6-Tab Lab** | Read-only analytical inspection, conversational quant assistant (8 card-free LLM providers), CSV/JSON BI export, and Studio/Press brief handoff. |

### 2.1 Core Relational Table Contracts (`supabase/schema.sql`)

| Table Name | Primary Key | Key Columns & Precision | Enforced Invariant |
| :--- | :--- | :--- | :--- |
| **`syndicate_fixtures`** | `fixture_id TEXT` | `home_team`, `away_team`, `kickoff_utc TIMESTAMPTZ`, `xg_home NUMERIC(5,2)`, `xg_away NUMERIC(5,2)`, `dc_rho NUMERIC(4,3)` | Canonical schedule anchor; `kickoff_utc` governs `T - 15m` lock |
| **`syndicate_slips`** | `slip_id UUID` | `fixture_id`, `market_code`, `entry_ref_odds NUMERIC(8,4)`, `shin_edge_pct NUMERIC(6,2)`, `allocated_vu NUMERIC(18,4)`, `state TEXT` | `CHECK (allocated_vu <= pool_snapshot_vu * 0.05)` (`5%` hard cap) |
| **`syndicate_votes`** | `(slip_id, member_id)` | `vote BOOLEAN`, `cast_at_utc TIMESTAMPTZ` | Composite PK guarantees `1` vote per active member per slip |
| **`syndicate_pool_ledger`** | `seq BIGSERIAL` | `idempotency_key TEXT UNIQUE`, `kind TEXT`, `delta_vu NUMERIC(18,4)`, `delta_units NUMERIC(18,6)`, `nav_per_unit NUMERIC(18,6)`, `row_hash CHAR(64)` | Append-only (`REVOKE UPDATE, DELETE` + exception trigger) |

---

## 3. Architectural Invariants & Decision Records (`ADR-SYN`)

1. **No Client-Side Balance Math (`ADR-SYN-01`):** Browser sliders and interactive simulations explore scenarios locally, while canonical pool `NAV`, unit minting, unit burning, and slip settlements execute exclusively inside atomic server-side database transactions.
2. **Closed-Community Isolation (`ADR-SYN-02`):** Production workspace mutations require authenticated session credentials; public GitHub Pages surfaces run 100% offline on synthetic clubs and seeded Matchday 5 fixtures (`demo/index.html`).
3. **LLM Prose Never Alters Probabilities (`ADR-SYN-03`):** The Conversational Syndicate Quant Assistant (`NVIDIA NIM`, `Groq`, `Cerebras`, `Gemini`, `Mistral`) receives pre-computed Dixon-Coles, Shin, and NAV telemetry as read-only context to explain edges or draft matchday memos; it never generates or overrides `lambda`, `edgePct`, or `quarterKellyPct`.
4. **Auditability First (`ADR-SYN-04`):** Every proposal, vote, pre-kickoff lock, dealing queue entry, and settlement writes an immutable, hash-chained timestamped record exportable to JSON and CSV.

---

## 4. Dual-Surface Portfolio Access

* **Public 6-Tab Interactive Simulation (`[Status: Prototype]`):** Explore all `36` synthetic clubs, bivariate EDA, seed residuals, Dixon-Coles + Shin lab, NAV ledger, and `1,000-path` Monte Carlo simulator immediately in [Syndicate Interactive Demo](demo/index.html).
* **Private Live Matchday Workspace (`[Status: Implemented]`):** Hiring managers and reviewers can [request a 48-hour single-use Reviewer Grant](https://github.com/aertsjef1989/Autonomous-SSoT-Architecture/issues/new?template=request-sandbox-grant.yml) to inspect the live Next.js + Supabase EU + `football-data.org` workspace.
