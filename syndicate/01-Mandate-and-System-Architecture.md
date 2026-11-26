# Syndicate I. Mandate & System Architecture

**Focus:** Statistical Football Analytics, Read-Only Next.js Dashboard & Supabase RBAC Boundaries · **Status:** `Prototype` (Simulation Only)

> **Simulation Disclaimer:** Educational probability and unit-accounting prototype operating strictly on synthetic clubs, seeded simulation slates, and non-monetary **virtual units (`VU`)**. Zero real-money pooling, wagering, bookmaker execution, or financial custody.

---

## 1. The Problem & Target Outcome
Recreational football prediction groups and statistical tipgames routinely fail on two fronts: match selections drift toward recency bias rather than expected-goals (`xG`) math, and shared point pools break down in manual spreadsheets the moment participants enter, exit, or audit a settled selection card.

**Syndicate Matchday AI** is an **educational simulation and accounting prototype** that addresses both problems with a decoupled architecture:
* **Quantitative Core:** A Python Poisson / xG modeling engine that computes simulated matchday probabilities and reference-odds edge deltas.
* **Democratic Tipgame Layer:** Structured selection cards (`slips`), participant quorum voting, and hard pre-kickoff locks.
* **Deterministic Accounting:** A unit-share Net Asset Value (`NAV`) virtual-unit ledger backed by append-only database rows.

---

## 2. System Topology & Read-Only Boundary

| Layer | Technology | Access & Mutation Boundary |
| :--- | :--- | :--- |
| **Analytics Engine** | **Python (`requests`, standard math)** | Scheduled/dry-run batch pipeline computing goal rates (`lambda_H`, `lambda_A`), Poisson scoreline matrices, and simulated value edges. |
| **Database & RLS** | **PostgreSQL (Row-Level Security)** | Enforces strict server-side write boundaries separating simulated admin settlements from read-only observers. |
| **Web Dashboard** | **Read-Only Next.js UI** | **Strictly read-only** for simulated unit balances and model outputs; client state never mutates NAV or ledger totals directly. |

---

## 3. Architectural Invariants
1. **No Client-Side Balance Math:** All NAV unit minting, burning, and slip settlements execute server-side as atomic database transactions.
2. **Closed-Community Isolation:** Private invite-only access via RBAC; zero public scraping endpoints or unauthenticated write routes.
3. **Auditability First:** Every vote, lock event, deposit, and settlement writes an immutable timestamped record.
