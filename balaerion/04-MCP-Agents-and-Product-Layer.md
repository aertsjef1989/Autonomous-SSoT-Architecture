# Balaerion IV. Dual-Mode Product Layer & ProspectHub Multi-Persona Suite

**Focus:** General AI Assistant, ProspectHub 7-State Lifecycle, 40+ Market OSINT & Two-Lane Persona Registry

---

## 1. Mode A: General AI Assistant

Balaerion functions as a daily-driver AI workspace outside of sales workflows:
* Multi-model chat for software engineering, SQL/Python debugging, technical writing, and document analysis.
* Instant switching between general models and specialized ProspectHub personas under a single pre-dispatch PII gate.

---

## 2. Mode B: ProspectHub Multi-Persona Agent Suite

ProspectHub operates as a **stateful, domain-keyed workspace** inside Balaerion. Every account is tracked through a **7-state human-in-the-loop lifecycle**:

1. **`Cold`**: Domain entered; deterministic OSINT and qualification score (`/10`) generated.
2. **`Auto-replied`**: Initial response logged; human review pending.
3. **`Agent-contacted`**: Direct outreach initiated; discovery active.
4. **`Discovery-booked`**: Call scheduled; pre-call briefing assembled.
5. **`Post-discovery`**: Call notes captured (`call-transcriber`); meeting deltas fed into `activate` to build the client-ready activation plan.
6. **`In-nurture`**: Long-cycle account placed on periodic re-engagement cadence.
7. **`Dormant`**: Outreach paused; full research history preserved to eliminate redundant re-work.

---

## 3. Deterministic 40+ Market OSINT Engine

Before any persona drafts a brief, deterministic code resolves structured entity signals across `40+ markets`, modeling **KvK, KBO, NBB, VIES, GLEIF, SIRENE, BODACC, RDAP/DNS, and public web-stack signals** into Entity Snapshots, Tech/Pixel Audits, Paid Media Verdicts, and Readiness Scores. *(Rule: language alone never determines country; NL vs. BE is resolved strictly via registry and legal-entity signals. Public builds serve cached synthetic fixtures only.)*

---

## 4. Two-Lane Persona Registry (`23` Registered Balaerion AI Personas)

Balaerion registers **23 AI personas** (`7` Mode A general-assistant utilities + `16` Mode B ProspectHub specialists; distinct from Pillar I's `14` SSoT conversational Bot commands):

### 4.1 Mode A Everyday Assistant Personas (`7` Utilities, `lane: general` unless PII-routed)
1. **`general-assistant`**: Multi-provider everyday chat and analytical reasoning.
2. **`code-debugger`**: TypeScript, Python, and SQL root-cause analysis and patch generation.
3. **`sql-architect`**: PostgreSQL schema, RLS policy, and query plan review.
4. **`tech-writer`**: Concise engineering specification and ADR drafting.
5. **`json-repair`**: Single-pass deterministic schema repair helper (`H6`).
6. **`doc-summarizer`**: Structured executive synthesis over uploaded Markdown notes.
7. **`data-qa-auditor`**: Cross-table arithmetic and consistency checker.

### 4.2 Mode B Safe-Lane ProspectHub Personas (`7` Personas, `lane: eu`, Deterministic & Client-Facing)
1. **`prospecthub-research-and-intel`** (`lane_locked: true`): Synthesizes deterministic OSINT into structured account briefs.
2. **`activate`**: Pulls the existing brief, asks only *"What changed in the meeting?"*, and builds the post-discovery activation plan.
3. **`call-transcriber`**: Structures discovery notes and transcripts to feed verified deltas into `activate`.
4. **`watcher`**: Monitors footprint changes (`pixel added/removed`, `platform changed`, `ads started/stopped`, `site rebuilt`).
5. **`pipeline`**: Domain-keyed CRM record updates with a strict `<10s` write budget.
6. **`daily-view`**: Signal-prioritized action queue surfacing unacted `watcher` alerts first.
7. **`doc-reader`**: Extracts structured data from synthetic rate cards and brand guidelines.

### 4.3 Mode B General-Lane ProspectHub Personas (`9` Personas, `lane: general`, Commercial Execution)
1. **`prospecthub-cold-pitch-email`**
2. **`prospecthub-follow-up-email`**
3. **`prospecthub-polish-emails`**
4. **`prospecthub-nurture-sequence`**
5. **`prospecthub-elevator-pitch`**
6. **`prospecthub-full-pitch-script`**
7. **`prospecthub-scaling-roadmap`**
8. **`deck-builder`** (structured slides for Signal Studio)
9. **`creative-concepts`** (strict dual `CONCEPT` labelling)

---

## 5. Governance, Calibration & 10-Language Parity

* **10-Language EU Parity:** EN, NL, DE, FR, ES, IT, PT, PL, TR, RO.
* **6 CTQ Metrics:** Output Quality Score (0 to 10 rubric), Cycle Time per Prospect, Cost per Prospect (EUR), Weekly Active Agent Rate (%), Compliance Incidents (target: 0/quarter), and Language Quality Parity.
* **Calibration Benchmark (Fictional Entity & Intentional Mod-97 Non-Collision):** Public demos and prompt evaluations run exclusively against sanitized fictional records such as ***Kapsalon Vuurtoren BV*** (`KBO 0123.456.789`, BE confidence `0.94`, Tier A, Lightspeed eCom). **Synthetic Checksum Note:** Under Belgium's KBO modulo-97 check (`97 - (first_8_digits mod 97)`), `1234567 mod 97 = 48`, so a real enterprise number starting `0123.456.7` would end in check digits `49` (`97 - 48 = 49`). Ending in `89` fails the Belgian mod-97 checksum **by design**, guaranteeing the fixture can never collide with a real registered Belgian company.

---

## Interactive Balaerion Prototype
* [Launch Interactive Balaerion Prototype](demo/index.html)
