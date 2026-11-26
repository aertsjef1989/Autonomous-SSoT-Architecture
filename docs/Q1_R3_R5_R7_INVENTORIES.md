# Phase Q1 Safety & Credibility Inventories (R3, R5, R6, R7)

## 1. R3 Pre-Edit Employer / Vendor / Fingerprint Inventory
All employer/vendor denylist matches are redacted below (`[REDACTED DENYLIST TOKEN]`). Per Decision **D1 = Option A**, every item below is generalized in Phase Q1 and Chapter 1's standardized reference-model statement is reconciled across all chapters.

| File | Line | Pre-Edit Excerpt (Redacted Where Applicable) | Category |
| :--- | ---: | :--- | :--- |
| `02-System-Architecture.md` | 19 | \| P1 \| **Enterprise Plan Tier** \| **CLOSED** \| Requires 50,000 rows per table, unlimited Basic API c | Vendor plan / recovery limit |
| `02-System-Architecture.md` | 20 | \| P2 \| **Data Residency** \| **CLOSED** \| Operation is Lisbon-based. EU server residency is a hard le | Location fingerprint |
| `02-System-Architecture.md` | 31 | *   **Visibility:** Private. Nodes are invisible to the tenant until access is explicitly granted. F | Vendor API / OAuth scope |
| `02-System-Architecture.md` | 66 | \| `CC` \| ISO country code, or `GLB` \| Any of the 45 ISO codes, or `GLB` \| | Roster / pilot / market fingerprint |
| `02-System-Architecture.md` | 77 | 1. **D1:** Enumerate every legacy doc via the Drive API. | Vendor API / OAuth scope |
| `02-System-Architecture.md` | 151 | \| **`Market Scope`** \| **Multi-Select** \| **Drives every branch grant. Values: The 45 ISO codes or A | Roster / pilot / market fingerprint |
| `02-System-Architecture.md` | 239 | The platform relies on external extraction to satisfy enterprise RTO/RPO limits, as native vendor re | Vendor plan / recovery limit |
| `02-System-Architecture.md` | 246 | \| **Destination** \| EU-region external object store (preserves residency outside the vendor tenant). | Vendor API / OAuth scope |
| `02-System-Architecture.md` | 256 | 2. **Stage 2-3 (Schema & Permissions):** T1-T10 tables deployed. User matrix (T4) seeded with the 20 | Roster / pilot / market fingerprint |
| `02-System-Architecture.md` | 258 | 4. **Stage 6 (Single-Market Pilot):** 74 files published for a single test market to establish a bas | Roster / pilot / market fingerprint |
| `02-System-Architecture.md` | 259 | 5. **Stage 7 (Scale & Discovery):** Scaled to the remaining 44 markets. **Parallel execution:** Driv | Roster / pilot / market fingerprint |
| `03-Design-Methodology-DMADV.md` | 71 | The design was verified not through a "soft launch," but through a controlled experiment: **The NL ( | Roster / pilot / market fingerprint |
| `03-Design-Methodology-DMADV.md` | 79 | Upon passing V1 through V6, the design was mathematically verified, and scale-out to the remaining 4 | Roster / pilot / market fingerprint |
| `04-Relational-Database-Schema.md` | 38 | \| `Market Scope` \| Multi-Select \| Drives every branch permission grant. Values: 45 ISO codes or `ALL | Roster / pilot / market fingerprint |
| `05-Self-Healing-Loop-and-Fault-Taxonomy.md` | 26 | Evaluating the platform's constraints against full-suite enterprise entitlements established a ceili | Vendor plan / recovery limit |
| `06-Bot-Command-Reference.md` | 3 | **Focus:** 23 Conversational Commands, API Scopes & Card Kit Safeguards | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 16 | --> Format interactive response card (Card Kit v2.0) | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 27 | To execute its duties without violating enterprise boundaries, the Bot operates under a strict, mini | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 31 | \| `im:message:send_as_bot` \| Transmitting direct messages and channel responses. \| | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 32 | \| `im:message:receive_v2` \| Command reception. \| | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 34 | \| `wiki:wiki` \| Node read, search, **and the physical node move operations** required during publish | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 35 | \| `drive:drive` \| Permission container grants and file statistics collection. \| | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 36 | \| `database:app` \| Read and write access across all operational and audit tables. \| | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 37 | \| `contact:user.base:readonly` \| Sender lookup and supervisor/escalation path resolution. \| | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 39 | *Crucial Implementation Note:* Holding API scopes is insufficient on its own. The application must a | Vendor API / OAuth scope |
| `06-Bot-Command-Reference.md` | 63 | \| **`market` / `vertical`** \| `@Bot market [CC]` \| Returns the master market file alongside deep-lin | Roster / pilot / market fingerprint |
| `07-Role-Based-Access-Matrix.md` | 66 | This is not a downgrade of the Agent role; it is the foundation of the platform's integrity. A regis | Roster / pilot / market fingerprint |
| `07-Role-Based-Access-Matrix.md` | 103 | Order of operations is critical, as platform data recovery windows are limited to 30 days, and trans | Vendor plan / recovery limit |
| `09-Operations-Runbook.md` | 64 | *Data Integrity Rule:* Because the platform only offers a 30-day restore window, and transferred dat | Vendor plan / recovery limit |
| `12-Architecture-Decision-Records.md` | 16 | \| **ADR-05** \| **Agent Lockdown via Bot Proxy** \| Granting frontline agents direct edit rights on `T | Roster / pilot / market fingerprint |
| `14-AI-Content-Engineering-and-Rules.md` | 31 | Surrounding each guide: a **Coverage at a Glance** summary table, a shared **Core Concepts** section | Vendor API / OAuth scope |
| `14-AI-Content-Engineering-and-Rules.md` | 54 | \| **M15** \| **Open Questions Gate** \| Explicit unverifiable-claims table present \| Missing confirmat | Vendor API / OAuth scope |
| `DEMO/index.html` | 340 | <div class="row"><span class="k">Status</span><span class="v" style="color:var(--cyan);">VERIFIED (1 | Named person |
| `DEMO/index.html` | 477 | <div class="row"><span class="k">Verification</span><span class="v" style="color:var(--cyan);">VERIF | Named person |
| `DESIGN_SYSTEM_Signal/README.md` | 21 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/README.md` | 100 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/README.md` | 103 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/README.md` | 107 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/README.md` | 109 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 39 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 41 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 43 | The knowledge library is 3,386 wiki pages. **That document specifies how those pages should look**,  | Roster / pilot / market fingerprint |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 47 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 48 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 49 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/SIGNAL_AND_SSOT.md` | 79 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CHANGELOG.md` | 7 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CHANGELOG.md` | 13 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CHANGELOG.md` | 29 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CHANGELOG.md` | 37 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CHANGELOG.md` | 41 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CONTRIBUTING.md` | 20 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/CONTRIBUTING.md` | 34 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 11 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 18 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 36 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 54 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 55 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/START_HERE.md` | 82 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 1 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 3 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 30 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 47 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 49 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 65 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 67 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 76 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 87 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 89 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/00_cross_surface_standard/02_templates/Workspace_Conventions.md` | 108 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |
| `DESIGN_SYSTEM_Signal/06_tokens/tokens.json` | 72 | `[REDACTED DENYLIST TOKEN]` | Denylist / Vendor-Employer Token |

## 2. R5 Absolutes Inventory & Applied Replacements
### 2.1 Mandatory Bounded Replacements Applied in Q1
- `05-Self-Healing-Loop-and-Fault-Taxonomy.md:10`: replaced `100% data integrity` with `bounded state consistency across 3,000+ reference nodes`.
- `balaerion/03-Security-and-GDPR-Routing-Lane.md:28`: replaced `Zero-Hallucination Rule` with `Deterministic Fact Boundary`.
- `README.md:50`: replaced `zero unverified claims` with `deterministic fact boundary (entity facts sourced from structured records, not generation)`.

### 2.2 Full Scan of Absolute Terms Across Chapters & Demos (For Owner Review)
| File | Line | Context |
| :--- | ---: | :--- |
| `01-Business-Case-and-ROI.md` | 32 | Because the SSoT architecture operates on existing enterprise workspace primitives (Enterprise Wiki, |
| `01-Business-Case-and-ROI.md` | 38 | Beyond direct time recovery, the 14-detector Self-Healing Loop and 30-day autonomous archive kill sw |
| `02-System-Architecture.md` | 64 | \| `ENT` \| Fixed prefix \| Always `ENT` (Enterprise) \| |
| `02-System-Architecture.md` | 67 | \| `COUNTER` \| Zero-padded 3 digits. Resets per country/folder \| `001` to `031` \| |
| `03-Design-Methodology-DMADV.md` | 35 | \| **CTQ-7** \| Stays correct (QA/Mgmt) \| Governance decay \| Files past review + 30 days \| **Zero** (A |
| `03-Design-Methodology-DMADV.md` | 60 | **The Rule: Never write a perishable claim from memory or AI output.** |
| `03-Design-Methodology-DMADV.md` | 77 | *   **V6 (CTQ-7 & 8):** Self-healing scanners and permission reconciliation scripts ran for 14 conse |
| `04-Relational-Database-Schema.md` | 69 | Records failed or zero-result bot queries. |
| `05-Self-Healing-Loop-and-Fault-Taxonomy.md` | 78 | 1. Zero missing scheduled scanner runs. |
| `05-Self-Healing-Loop-and-Fault-Taxonomy.md` | 80 | 3. Zero P1 faults open past their 2-hour SLA. |
| `05-Self-Healing-Loop-and-Fault-Taxonomy.md` | 81 | 4. **Zero state divergence (Reconciliation returning clean).** |
| `06-Bot-Command-Reference.md` | 84 | If an NL-scoped agent queries a MENA market file, the Bot intercepts the request, returns a scope-re |
| `07-Role-Based-Access-Matrix.md` | 113 | *   **Storage:** Stored exclusively in the Developer Console and as a single server environment vari |
| `09-Operations-Runbook.md` | 8 | **Critical Rule:** Never write the Application Secret in this document. Record only where it is stor |
| `09-Operations-Runbook.md` | 48 | *Security Principle:* **Revoke before grant, never the reverse.** Granting first creates a vulnerabi |
| `10-Prototype-Manual.md` | 80 | **Then press both toggles together**, *Break the move* and *Write state first*, and step through. Th |
| `10-Prototype-Manual.md` | 130 | **Pink is never decorative.** If something is pink, either it is broken or it is the thing that stop |
| `11-Signal-Design-System.md` | 9 | Both applications are zero-install, standalone HTML builds running directly in your browser: |
| `11-Signal-Design-System.md` | 32 | \| **Pink** \| `#F0245C` \| Silent failure mode, active fault, or the guard that prevents it (never dec |
| `12-Architecture-Decision-Records.md` | 68 | * **Decision:** Maintain one public repository where the static HonKit documentation build (`_book/` |
| `12-Architecture-Decision-Records.md` | 69 | * **Guardrail:** The public static build serves deterministic Replay surfaces and offline editors on |
| `12-Architecture-Decision-Records.md` | 73 | * **Rationale:** Eliminates confidentiality risk while allowing engineering leaders and reviewers to |
| `12-Architecture-Decision-Records.md` | 77 | * **Rationale:** Preserves zero third-party script requests and zero third-party visitor IP telemetr |
| `13-Contracts-and-Readiness.md` | 14 | \| **Deterministic Fixtures** \| Reference-Date Generator \| Repeatable synthetic dataset with zero sys |
| `13-Contracts-and-Readiness.md` | 25 | \| **Async Publish** \| `AC-PUB-02` \| File in `_STAGING/`, move API forced to fail \| Reviewer clicks A |
| `13-Contracts-and-Readiness.md` | 27 | \| **Market Scoping** \| `AC-BOT-04` \| User scoped to `NL` only \| User runs `@Bot policy Finance DE` \| |
| `13-Contracts-and-Readiness.md` | 50 | ## 4. Deterministic Test Fixtures (Zero Clock Reads) |
| `13-Contracts-and-Readiness.md` | 68 | All user-facing copy is centralized by ID (`STR-WARN-STALE`, `STR-ERR-SCOPE`, `STR-ESC-DAY14`, `STR- |
| `14-AI-Content-Engineering-and-Rules.md` | 15 | \| **1** \| **Named Entities** \| Exact local regulators, statutory decrees, and payment rails, never g |
| `14-AI-Content-Engineering-and-Rules.md` | 16 | \| **2** \| **Hard Numbers** \| Specific verifiable thresholds and statutory limits wherever knowable;  |
| `14-AI-Content-Engineering-and-Rules.md` | 17 | \| **3** \| **Decision Tables** \| Every branching choice or eligibility matrix is rendered as a struct |
| `14-AI-Content-Engineering-and-Rules.md` | 27 | 3. **Literal Step-by-Step Walkthrough:** Exact current UI menu click paths, never vague directions l |
| `14-AI-Content-Engineering-and-Rules.md` | 52 | \| **M13** \| **Author Attribution** \| Zero personal attribution in shared playbooks \| Personal names  |
| `14-AI-Content-Engineering-and-Rules.md` | 53 | \| **M14** \| **Layer Isolation** \| Zero cross-references from Public to Internal layer \| Any internal |
| `15-Enablement-and-Continuity.md` | 32 | 1. **Access & Credentials Verification (Day 1):** Verify dual-administrator access against the Crede |
| `15-Enablement-and-Continuity.md` | 39 | *   **Single Source of Authoring:** Markdown source files and diagram scripts are authoritative; ren |
| `15-Enablement-and-Continuity.md` | 50 | \| **Sandbox Backup Restore** \| `<= 8 hrs` (DB) \| 50 register rows + 5 docs restored cleanly with zer |
| `16-Signal-Press-Document-Designer.md` | 16 | 1. **Manual-First, Zero-Network Offline Core:** Editing, template switching, Markdown/JSON import, p |
| `16-Signal-Press-Document-Designer.md` | 19 | * **DOCX, Google Docs, and Enterprise Wikis:** Always render on the Signal Light surface (`#FFFFFF`  |
| `16-Signal-Press-Document-Designer.md` | 21 | * **Email-Body HTML:** Client-facing follow-ups export as `600px` table-based HTML with `100%` inlin |
| `DEMO/index.html` | 322 | In the correct sequence, if the move times out at Step 5, fault <code>F-027</code> is raised and the |
| `DEMO/index.html` | 332 | <p style="color:var(--muted);font-size:13.5px;margin-bottom:16px;">Every query is market-scoped. Ove |
| `DEMO/index.html` | 389 | <div class="kicker">FLOW 11 · OFFBOARDING & ZERO-UNOWNED GATE (BR-02)</div> |
| `DEMO/index.html` | 447 | const sub = isFail ? 'TIMED OUT · fault F-027 raised' : skipped ? 'never reached' : s.d; |
| `DEMO/index.html` | 487 | <div class="row"><span class="k">Result</span><span class="v" style="color:var(--pink);">No verified |
| `DEMO/index.html` | 560 | <div class="row"><span class="k">Result</span><span class="v" style="color:var(--cyan);">Zero permis |
| `DEMO/index.html` | 575 | <div class="row"><span class="k">Rule</span><span class="v">Zero unowned files permitted. Reassign o |
| `README.md` | 27 | Engineered a custom, zero-license-cost knowledge operations system built on standard enterprise work |
| `README.md` | 50 | \| **Scout** \| Parallel firmographic, technographic, and OSINT signal research \| Structured JSON acco |
| `balaerion/01-Mandate-and-Core-Stack.md` | 22 | \| **Safe Lane (`eu`)** \| **Admitted EU Endpoints** \| Synthetic-only public POC; private-production a |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 9 | Balaerion eliminates persistent server administration by running on stateless serverless functions b |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 12 | * **Persistence (PostgreSQL EU):** Reached exclusively from server routes via a server-only credenti |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 19 | 1. **Replay Mode (Default):** Pre-recorded runs and synthetic fixtures load immediately in the brows |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 21 | 3. **Deterministic Enrichment (ProspectHub Mode):** Cached synthetic OSINT fixtures supply registry, |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 30 | * **Zero Code Changes for Provider Swap:** Admitted endpoints are defined in a versioned routing con |
| `balaerion/02-Hosting-and-Failover-Topology.md` | 31 | * **Hard Production Gates:** Moving from synthetic portfolio data to real business records requires  |
| `balaerion/03-Security-and-GDPR-Routing-Lane.md` | 13 | \| **`lane: eu`** (`lane_locked: true`) \| Prospect briefs, meeting deltas, activation plans, and uncl |
| `balaerion/03-Security-and-GDPR-Routing-Lane.md` | 20 | * **Server-Only Database Access:** Plain PostgreSQL in an EU region with Row-Level Security (RLS) en |
| `balaerion/03-Security-and-GDPR-Routing-Lane.md` | 28 | * **Zero-Hallucination Rule:** Legal entity names, VAT numbers, registry IDs (KBO/KvK), pixels, and  |
| `balaerion/04-MCP-Agents-and-Product-Layer.md` | 25 | 7. **`Dormant`**: Outreach paused; full research history preserved to eliminate redundant re-work. |
| `balaerion/04-MCP-Agents-and-Product-Layer.md` | 31 | Before any persona drafts a brief, deterministic code resolves structured entity signals across `40+ |
| `balaerion/demo/index.html` | 516 | lanePill.textContent = isSafe ? 'lane: safe · EU Zero-Retention' : 'lane: general · Anonymized Brief |
| `syndicate/01-Mandate-and-System-Architecture.md` | 23 | \| **Web Dashboard** \| **Read-Only Next.js UI** \| **Strictly read-only** for simulated unit balances  |
| `syndicate/01-Mandate-and-System-Architecture.md` | 29 | 2. **Closed-Community Isolation:** Private invite-only access via RBAC; zero public scraping endpoin |
| `syndicate/04-Unit-Share-NAV-Ledger-and-Operations.md` | 22 | * **Zero In-Place Updates:** Balances are never overwritten with `UPDATE balance = ...`. Every depos |
| `syndicate/04-Unit-Share-NAV-Ledger-and-Operations.md` | 26 | *(Simulation only: synthetic virtual units and seeded 2026-27 fixtures; zero live pooled funds.)* |
| `syndicate/demo/index.html` | 99 | <div class="muted">Simulation only (virtual units) · Cyan = Top 8 (R16) · Amber = 9 to 24 (Play-offs |

## 3. R6 Denylist Inspection & Git History Audit
- **Signal Press Lint (`balaerion-app/src/lib/press/lint-config.ts`):** `0` employer terms in source; uses generic consulting placeholders plus runtime browser-memory custom terms.
- **Tracked Plaintext Denylist (`scripts/forbidden_terms.txt`):** Removed via `git rm` and replaced by salted SHA-256 normalized n-gram hashes in `scripts/forbidden_hashes.json` plus optional untracked runtime `.dev/employer_terms.txt` in `scripts/leak_gate.py` (with `DESIGN_SYSTEM_Signal` removed from `SKIP_DIRS` and zero matched tokens printed on failure).
- **Git History Presence:** Plaintext `scripts/forbidden_terms.txt` previously appeared in `4` historical commits (`db8dc7a`, `6fb099f` on `main`, and `feffd1d`, `33a78d4` on `gh-pages`). History is untouched on `review-fixes` pending final clean single-commit publish.

## 4. R7 Syndicate Terminology & Simulation Audit (Decision D9 = Option a on Public Demo)
- **Simulation Disclaimers:** Added visible non-financial simulation disclaimers at the top of `syndicate/01` through `04` and in the `syndicate/demo/index.html` header.
- **Currency & `fund-grade` Removal:** Replaced all `EUR` / euro signs in `syndicate/` chapters and `syndicate/demo/index.html` with `VU` (`virtual units`); replaced `fund-grade precision` with `deterministic unit-share accounting`.
- **Neutral Terminology Mapping (`slip`, `stake`, `payout`):** Framed across Syndicate chapters and demo controls as `selection card` (simulated pick sheet), `virtual unit allocation` (simulated risk sizing), and `settlement return` (simulated unit settlement).
- **Synthetic Calendar & Club Relabeling (`D9 = a`):** Replaced played `24-25 Nov 2026` dates and all 36 real club names in `syndicate/demo/index.html` with synthetic European Simulation League clubs and a synthetic `Matchday 5 Simulation Slate`. (`balaerion-app/` untouched.)
