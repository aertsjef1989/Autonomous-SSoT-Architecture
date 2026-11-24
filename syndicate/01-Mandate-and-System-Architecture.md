# Syndicate I. Mandate & System Architecture

**Focus:** Statistical Football Analytics, Read-Only Next.js Dashboard & Supabase RBAC Boundaries

---

## 1. The Problem & Target Outcome
Private football prediction syndicates and group tipgames routinely fail on two fronts: match selections drift toward recency bias rather than expected-goals (xG) math, and shared bankrolls break down in manual spreadsheets the moment members deposit, withdraw, or dispute a settled slip.

**Syndicate Matchday AI** solves both with a decoupled architecture:
* **Quantitative Core:** A Python Poisson / xG modeling engine that computes matchday probabilities and market-edge deltas.
* **Democratic Tipgame Layer:** Structured slip proposals, member voting, and hard pre-kickoff locks.
* **Deterministic Accounting:** A unit-share Net Asset Value (NAV) ledger backed by append-only database rows.

---

## 2. System Topology & Read-Only Boundary

| Layer | Technology | Access & Mutation Boundary |
| :--- | :--- | :--- |
| **Analytics Engine** | **Python (Pandas, NumPy)** | Offline/scheduled batch pipeline computing goal rates (`lambda_H`, `lambda_A`), Poisson scoreline matrices, and value edges. |
| **Database & Auth** | **Supabase (PostgreSQL + RBAC)** | Enforces Row-Level Security (RLS) separating Syndicate Admins, Active Members, and Read-Only Observers. |
| **Web Dashboard** | **Next.js on Vercel** | **Strictly read-only** for financial balances and model outputs; client state never mutates NAV or ledger totals directly. |

---

## 3. Architectural Invariants
1. **No Client-Side Balance Math:** All NAV unit minting, burning, and slip settlements execute server-side as atomic database transactions.
2. **Closed-Community Isolation:** Private invite-only access via RBAC; zero public scraping endpoints or unauthenticated write routes.
3. **Auditability First:** Every vote, lock event, deposit, and settlement writes an immutable timestamped record.
