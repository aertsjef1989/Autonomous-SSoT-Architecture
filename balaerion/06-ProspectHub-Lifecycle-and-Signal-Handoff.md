# Balaerion VI. ProspectHub 7-State Lifecycle & Signal Handoff

**Focus:** Domain-Keyed GTM State Machine, Advisory Commercial Guardrails & Deterministic Compilation into Signal Studio (`16:9`) and Signal Press (`A4`) · **Status:** `Implemented` + `Prototype`

---

## 1. Domain-Keyed 7-State Account State Machine

Traditional sales tools scatter prospect notes across browser tabs, ad-hoc chat threads, and static slide decks. Whenever an account pauses for two quarters, the next operator repeats discovery from scratch. **ProspectHub** keys every workspace by canonical normalized domain (`merchant.example`) and governs progression through a **7-state human-in-the-loop lifecycle**:

```text
[1. Cold] --(OOO / Auto-Ack)--> [2. Auto-replied] --(Follow-Up Window)--> [3. Agent-contacted]
    |                                                                             |
    +-------(Human-Approved Diagnostic Outreach)----------------------------------+
                                                                                  |
    +-------(Timing Mismatch: Preserve OSINT)-------------------------------------+--(30-Min Call Booked)--> [4. Discovery-booked]
    |                                                                                                                 |
    v                                                                                                        (Call Deltas Logged)
[6. In-nurture] <--(Phased Roadmap Deferred)---------------------------------------------------------------- [5. Post-discovery]
    |
    +--(Cadence Paused)--> [7. Dormant] --(Watcher Stack Diff Alert)--> [3. Agent-contacted]
```

| State | Entry Criteria | Recommended Grounded Personas | Prohibited Shortcut |
| :--- | :--- | :--- | :--- |
| **`1. Cold`** | Domain normalized + OSINT readiness rubric (`/10`) computed | `01 · Readiness Scorer`, `08 · Cold Pitch Email` | Sending outreach before CMP/stack verification |
| **`2. Auto-replied`** | Out-of-office or automated routing receipt logged | `06 · Daily View` | Counting auto-replies as qualified human engagement |
| **`3. Agent-contacted`** | Operator dispatches tailored stack-diagnostic outreach | `10 · Objection Reframer`, `12 · Elevator Pitch` | Attaching cold PDFs or quoting daily ad-spend floors |
| **`4. Discovery-booked`** | Calendar slot confirmed (`30-minute` standard diagnostic) | `02 · 30-Min Discovery Call Prep`, `11 · Exec One-Pager` | Entering discovery without pre-verified pixel/CMP posture |
| **`5. Post-discovery`** | Operator logs meeting deltas (`what changed vs OSINT`) | `03 · Post-Discovery Activation Plan`, `04 · Pixel + CAPI Dedup`, `16 · Studio & Press Handoff` | Re-generating boilerplate intros instead of delta-driven plans |
| **`6. In-nurture`** | Technical blocker (e.g., store migration) defers launch | `11 · Nurture Sequence`, `04 · Watcher` | Discarding research context between quarters |
| **`7. Dormant`** | Outreach paused; domain snapshot retained at rest | `15 · Dormant Account Re-Entry Note` | Blind cold-reset pitching without referencing prior context |

---

## 2. Hard Commercial & Advisory Guardrails (`SSoT-Enforced`)

Every ProspectHub system prompt and pre-export linter enforces four operational rules derived from the governed SSoT corpus:
1. **Advisory, Client-Operated Framing:** Recommendations are framed strictly as technical and commercial guidance executed by the client's own engineering/marketing team in their own ad/tag accounts (never implying unilateral agency custody over client ad accounts).
2. **Strict `30-Minute` Discovery Cadence:** All discovery agendas, call scripts, and calendar CTAs allocate a crisp `30-minute` diagnostic window (`5m` business context, `15m` stack/measurement gap verification, `10m` phased activation next steps).
3. **Inline Follow-Up Discipline (Zero Unsolicited Cold PDFs):** Initial outreach and immediate post-call recaps use clean inline email structure (`prospecthub-follow-up-email` / Signal Press Email HTML export) so spam filters do not quarantine unsolicited binary attachments; formal A4 `.docx` / PDF briefs are generated via Signal Press once requested.
4. **Zero Arbitrary Daily Spend Floors in Cold Outreach:** Personas never quote rigid daily budget minimums in cold outreach, focusing first on measurement hygiene (`Server GTM + CAPI event_id deduplication`, `Consent Mode v2`, and catalog feed quality).

---

## 3. Cross-Surface Deterministic Artifact Handoff (`signal-handoff.ts`)

A core portfolio capability across **SSoT (`/ssot`)**, **Balaerion (`/balaerion`)**, and **Syndicate (`/syndicate`)** is that generative or quantitative analysis never dies inside a chat bubble. Every output turn exposes two deterministic compilers in `src/lib/signal-handoff.ts`:

### 3.1 Handoff Path A: `-> Signal Studio (16:9 Presentation Stage)`
* `buildStudioDeckFromContent()` parses Markdown headings (`##`), bullet takeaways, and quantitative callouts into a validated `16:9` slide array (`eyebrow`, `title`, `bullets`, `heroId`).
* Operators visually preview and cycle across **`63` pure-geometric Signal SVG devices (`H01` through `H63`)** synced deterministically from `DESIGN_SYSTEM_Signal/05_devices/` (`H01` to `H56` canonical Signal plates + `H57` to `H63` custom architectural topology, hybrid vector radar, Poisson grid, Kelly curve, and unit-ledger devices), then export portable `.json` or `.md` slide specs.

### 3.2 Handoff Path B: `-> Signal Press (A4 Print & Executive Document Designer)`
* `buildPressDocumentFromContent()` compiles SSoT answers, ProspectHub activation plans, or Syndicate quant briefs into a schema-validated `signal-press-doc-v1` document stored transiently in browser `localStorage` (`signal_press_handoff_v1`) and opens `/press`.
* Signal Press supports **12 structured A4 block components** across **DOCX (Word), Google Docs-safe DOCX, Print-Ready A4 Dark & Light PDF, Inline Email HTML, and Markdown**:
  * **7 Core Editorial Blocks:** `heading`, `paragraph`, `lead_callout`, `bullet_list`, `kpi_row`, `data_table`, and `divider`.
  * **5 Rich Systems-Design Blocks:**
    1. `comparison_matrix` (multi-option trade-off and vendor/lane comparison grids)
    2. `timeline_roadmap` (phased onboarding, `T-15m` cutoffs, or 30-60-90 day activation milestones)
    3. `checklist_gate` (auditable `PASS` / `PENDING` / `BLOCKED` technical readiness gates)
    4. `two_column_split` (side-by-side `Current State vs Target State` or `Browser Pixel vs Server CAPI` comparisons)
    5. `stat_delta_strip` (before/after KPI strips with directional delta badges)
* **Blocking Pre-Export Lint Gate:** Before any `.docx` or PDF bytes are emitted, `lint.ts` validates cover hero binding (`H01` to `H63`), section structure, cell lengths, and zero prohibited placeholder tokens.
