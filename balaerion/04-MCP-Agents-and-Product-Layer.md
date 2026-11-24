# Balaerion IV. Dual-Mode Product Layer & ProspectHub Multi-Persona Suite

**Focus:** General AI Assistant, ProspectHub 7-State Lifecycle, 45-Market OSINT & Two-Lane Persona Registry

---

## 1. Mode A — General AI Assistant

Balaerion functions as a daily-driver AI workspace outside of sales workflows:
* Multi-model chat for software engineering, SQL/Python debugging, technical writing, and document analysis.
* Persistent threaded history in Supabase with one-click switching between general models and specialized ProspectHub personas.

---

## 2. Mode B — ProspectHub Multi-Persona Agent Suite

ProspectHub operates as a **stateful, domain-keyed workspace** inside Balaerion. Every account is tracked through a **7-state human-in-the-loop lifecycle**:

1. **`Cold`** — Domain entered; deterministic OSINT and qualification score (`/10`) generated.
2. **`Auto-replied`** — Initial response logged; human review pending.
3. **`Agent-contacted`** — Direct outreach initiated; discovery active.
4. **`Discovery-booked`** — Call scheduled; pre-call briefing assembled.
5. **`Post-discovery`** — Call transcribed (`call-transcriber`); meeting deltas fed into `activate` to build the client-ready activation plan.
6. **`In-nurture`** — Long-cycle account placed on periodic re-engagement cadence.
7. **`Dormant`** — Outreach paused; full research history preserved to eliminate redundant re-work.

---

## 3. Deterministic 45-Market OSINT Engine

Before any persona drafts a brief, deterministic code queries public registries and web signals across 45 markets—including **KvK, KBO, NBB, VIES, GLEIF, SIRENE, BODACC, Wayback Machine, PageSpeed, and public Ad Libraries**—producing structured Entity Snapshots, Tech/Pixel Audits, Paid Media Verdicts, and Readiness Scores. *(Rule: language alone never determines country; NL vs. BE is resolved strictly via registry and legal-entity signals.)*

---

## 4. Two-Lane Persona Registry

### Safe Lane Personas (`lane: safe` — Deterministic & Client-Facing)
* **`prospecthub-research-and-intel`** (`lane_locked: true`): Synthesizes deterministic OSINT into structured account briefs.
* **`activate`**: Pulls the existing brief, asks only *"What changed in the meeting?"*, and builds the post-discovery activation plan.
* **`call-transcriber`**: Transcribes discovery recordings/voice notes (Deepgram-first) to feed verified deltas into `activate`.
* **`watcher`**: Monitors footprint changes (`pixel added/removed`, `platform changed`, `ads started/stopped`, `site rebuilt`).
* **`pipeline`**: Domain-keyed CRM record updates with a strict `<10s` write budget.
* **`daily-view`**: Signal-prioritized action queue surfacing unacted `watcher` alerts first.
* **`doc-reader`**: Extracts structured data from ad-account screenshots, PDF rate cards, and brand guidelines.

### General Lane Personas (`lane: general` — Commercial Execution)
* **`prospecthub-cold-pitch-email`**, **`prospecthub-follow-up-email`**, **`prospecthub-polish-emails`**, **`prospecthub-nurture-sequence`**
* **`prospecthub-elevator-pitch`**, **`prospecthub-full-pitch-script`**, **`prospecthub-scaling-roadmap`**
* **`deck-builder`** (structured slides for Signal Studio) & **`creative-concepts`** (strict dual `CONCEPT` labelling)

---

## 5. Governance, Calibration & 10-Language Parity

* **10-Language EU Parity:** EN, NL, DE, FR, ES, IT, PT, PL, TR, RO.
* **6 CTQ Metrics:** Output Quality Score (0–10 rubric), Cycle Time per Prospect, Cost per Prospect (EUR), Weekly Active Agent Rate (%), Compliance Incidents (target: 0/quarter), and Language Quality Parity.
* **Calibration Benchmark (Fictional Entity):** Public demos and prompt evaluations run exclusively against sanitized fictional records such as ***Kapsalon Vuurtoren BV*** (KBO `0123.456.789`, BE confidence `0.94`, Tier A, Lightspeed eCom).

---

## Interactive Balaerion Prototype
* <a href="demo/index.html" target="_blank">Open Interactive Balaerion Prototype</a>
