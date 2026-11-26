# Phase Q0 Baseline & Decisions Record

## 1. Build & Link-Check Baseline (R1 - VERIFIED)
- **Source branch:** `review-fixes` (branched from `893ee97`)
- **HonKit build (`npx honkit build`):** `26` markdown pages rendered (`exit=0`)
- **Total HTML pages in `_book/` (postprocessed + staged demos/Studio/Press):** `39` HTML files
- **Internal link check (`python3 scripts/link_check.py --book-dir _book`):** `0` broken internal references across `39` parsed pages (`exit=0`); two-way negative test (`missing_target.html`) blocked (`exit=1`)

## 2. Locked Decisions Register (R2 - D1 to D9; D10 Removed)
| ID | Decision | Applied Resolution |
| :--- | :--- | :--- |
| **D1** | **Option A: Generalize fully** | Generalize all vendor, location, plan-limit, OAuth-scope, pilot, and roster fingerprints across chapters, demos, and `DESIGN_SYSTEM_Signal/`; remove `DESIGN_SYSTEM_Signal` from `SKIP_DIRS` in `scripts/leak_gate.py`; reconcile Chapter 1 claim. |
| **D2** | **Status per control** | Default `Designed` unless repository evidence proves `Prototype` or `Implemented`. |
| **D3** | **Internal Container Access Tiers** | `5` Internal Container Access Tiers (`I-0` to `I-4`), explicitly distinct from the `6` Operating Roles (`AGT` to `ADM`). |
| **D4** | **Controls & Commands** | `10` automated controls (`5` scheduled scanners `SC-001`..`SC-005` + `5` event detectors `DT-001`..`DT-005`) plus `1` external dead-man heartbeat monitor (`HB-001`); `14` SSoT conversational commands (`7` core utilities + `7` domain extensions). |
| **D5** | **Schema Table Count** | `11` tables (`9` Data Layer + `2` Audit Layer). |
| **D6** | **Health Score Threshold** | `Healthy >= 80`, `Needs Review < 80`. |
| **D7** | **Illustrative ROI Cost Inputs** | Illustrative FTE build input `EUR 25,200` (one-off) and maintenance `EUR 9,900 / year`. |
| **D8** | **GDPR Lawful-Basis Drafts** | `T5`: objective ramp milestones under Art. 6(1)(f) + LIA, separate anonymous wellbeing pulse; `T10`: Art. 6(1)(f) audit basis with Art. 17(3)/21 balancing (marked draft for owner/legal review). |
| **D9** | **Option (a) on Public Demo Only** | Relabel `syndicate/demo/index.html` calendar and clubs as clearly synthetic, virtual units only (`balaerion-app/` untouched). |
| **D10** | **Removed per Owner Instruction** | Omit external contact/profile URL block on `README.md`; keep clean architect header. |

## 3. Baseline Snapshot of Numeric Claims by Page (Pre-Edit Snapshot)

- **`README.md`** (3 distinct numeric claims): `3,000`, `EUR 198,000`, `EUR 297,000`
- **`SUMMARY.md`** (0 distinct numeric claims): _(none matched)_
- **`ARCHITECTURE_FLOW.md`** (1 distinct numeric claims): `3,000`
- **`01-Business-Case-and-ROI.md`** (8 distinct numeric claims): `100 seats`, `220 days`, `EUR 45`, `EUR 495,000`, `495,000`, `EUR 198,000`, `EUR 297,000`, `EUR 0`
- **`02-System-Architecture.md`** (8 distinct numeric claims): `3,000`, `50,000`, `500,000`, `1,200`, `2 markets`, `12 markets`, `90 days`, `44 markets`
- **`03-Design-Methodology-DMADV.md`** (6 distinct numeric claims): `1,200`, `1 command`, `3,000`, `30 days`, `1,350`, `44 markets`
- **`04-Relational-Database-Schema.md`** (3 distinct numeric claims): `6,300`, `20 days`, `2,000`
- **`05-Self-Healing-Loop-and-Fault-Taxonomy.md`** (4 distinct numeric claims): `3,000`, `1,700`, `500,000`, `30 days`
- **`06-Bot-Command-Reference.md`** (2 distinct numeric claims): `23 days`, `14 days`
- **`07-Role-Based-Access-Matrix.md`** (3 distinct numeric claims): `2 markets`, `12 markets`, `30 days`
- **`08-Security-and-Compliance.md`** (2 distinct numeric claims): `30 days`, `90 days`
- **`09-Operations-Runbook.md`** (2 distinct numeric claims): `50 rows`, `500 rows`
- **`10-Prototype-Manual.md`** (1 distinct numeric claims): `500 rows`
- **`11-Signal-Design-System.md`** (0 distinct numeric claims): _(none matched)_
- **`12-Architecture-Decision-Records.md`** (4 distinct numeric claims): `3,000`, `1,200`, `6,300`, `1,700`
- **`13-Contracts-and-Readiness.md`** (3 distinct numeric claims): `500 rows`, `3,000`, `15 days`
- **`14-AI-Content-Engineering-and-Rules.md`** (1 distinct numeric claims): `3,000`
- **`15-Enablement-and-Continuity.md`** (1 distinct numeric claims): `1 Role`
- **`16-Signal-Press-Document-Designer.md`** (0 distinct numeric claims): _(none matched)_
- **`balaerion/01-Mandate-and-Core-Stack.md`** (0 distinct numeric claims): _(none matched)_
- **`balaerion/02-Hosting-and-Failover-Topology.md`** (0 distinct numeric claims): _(none matched)_
- **`balaerion/03-Security-and-GDPR-Routing-Lane.md`** (0 distinct numeric claims): _(none matched)_
- **`balaerion/04-MCP-Agents-and-Product-Layer.md`** (0 distinct numeric claims): _(none matched)_
- **`syndicate/01-Mandate-and-System-Architecture.md`** (0 distinct numeric claims): _(none matched)_
- **`syndicate/02-Poisson-and-xG-Probability-Engine.md`** (0 distinct numeric claims): _(none matched)_
- **`syndicate/03-Group-Tipgame-and-Slip-Integrity.md`** (0 distinct numeric claims): _(none matched)_
- **`syndicate/04-Unit-Share-NAV-Ledger-and-Operations.md`** (0 distinct numeric claims): _(none matched)_
- **`DEMO/index.html`** (5 distinct numeric claims): `1 command`, `12 days`, `4 days`, `4 markets`, `6 tiers`
- **`balaerion/demo/index.html`** (2 distinct numeric claims): `34,197`, `33,224,220`
- **`syndicate/demo/index.html`** (1 distinct numeric claims): `33,224,220`
