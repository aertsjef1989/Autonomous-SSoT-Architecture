# Enterprise Knowledge Architecture (SSoT) & Systems Portfolio

![SSoT, Balaerion & The Syndicate](assets/portfolio-logos.png)

**Architected & Compiled by:** Jef Aerts
**Methodology:** AI-Augmented Systems Architecture (LLM Orchestration & Lean DMADV)

## About the Architect
**Jef Aerts** is a systems architect and operational operator focused on structured knowledge governance, multi-provider AI gateway security, and deterministic data/accounting systems. This book presents three standalone architecture builds (SSoT, Balaerion, and Syndicate) plus the Signal design suite, emphasizing failure modes, design trade-offs, and automated verification over raw code dumps.

### Start Here (3 Minutes)
1. **[Interactive SSoT Governance & Failure-Mode Demo](demo/index.html)** (`Prototype`): Trigger the "register is lying" async-publish bug, test the Day-30 archive clock, and inspect synthetic admin telemetry in 60 seconds.
2. **[Portfolio Architecture Topology & Cross-Pillar Flow](ARCHITECTURE_FLOW.md)** (`Implemented`): See how SSoT, Balaerion, Syndicate, Signal Studio, and Signal Press connect on one responsive diagram.
3. **[12 Architecture Decision Records](12-Architecture-Decision-Records.md) & [Offline Signal Press Designer](signal/press/index.html)** (`Designed` / `Implemented`): Read what breaks if any guardrail is simplified, then test client-side A4 `.docx` / PDF / Email HTML linting directly in your browser.

## Portfolio Overview

| System | Status | Core Focus | Key Guardrail | Interactive Surface |
| :--- | :--- | :--- | :--- | :--- |
| **SSoT** | `Designed` + `Prototype` | Multi-market knowledge architecture, 11-table schema (`9` Data + `2` Audit), 14 bot commands, and self-healing governance | Move-then-confirm publish, container inheritance, and 30-day archive kill switch | [Launch SSoT Demo](demo/index.html) |
| **Balaerion** | `Prototype` + `Designed` | Config-driven multi-provider AI gateway, 23 persona-routed agents, and OSINT GTM layer | Pre-dispatch PII gate, lane isolation (EU vs General), and deterministic fact boundary | [Launch Balaerion Demo](balaerion/demo/index.html) |
| **Syndicate** | `Prototype` (Simulation) | Python Poisson/xG probability engine, read-only dashboard, selection consensus, and unit-share NAV ledger | Pre-kickoff selection lock, dealing cutoffs, and append-only virtual-unit ledger | [Launch Syndicate Demo](syndicate/demo/index.html) |
| **Signal Studio & Press** | `Implemented` | Browser-native 16:9 slide studio and offline A4 document designer (DOCX, PDF, Email HTML, Markdown) | Theme-free JSON model and blocking pre-export lint | [Launch Signal Press](signal/press/index.html) |

### Implementation Status Legend
Every control, metric, and artifact in this portfolio carries one of three explicit status tags:
* **`Implemented`:** Shipped and verified directly in this repository (Signal Studio, offline Signal Press, deterministic validators, and CI build/link/facts/leak/meta gates).
* **`Prototype`:** Interactive clean-room browser simulation running on illustrative synthetic data (`DEMO/`, `balaerion/demo/`, `syndicate/demo/`).
* **`Designed`:** Target enterprise architecture specification, acceptance criteria, and operational runbook contracts (Chapters I to XV).

---

## Pillar I: SSoT Highlights (`[Status: Designed + Prototype]`)

### The Constraint
Designed under strict enterprise compliance blockers that prohibited standard off-the-shelf Knowledge Management Systems (such as Confluence, Zendesk KMS, or Salesforce Knowledge).

### The Architecture
Specified as a zero-license-cost knowledge operations system (`[Status: Designed]`, interactive flows `[Status: Prototype]`) built on standard enterprise workspace primitives (Enterprise Wiki, Relational Governance Base, and ChatOps Bot). The reference model spans `40 markets` and `3,055` public reference nodes (`3,000+` nodes, [Chapter 2: System Architecture](02-System-Architecture.md)) using a normalized 11-table schema ([Chapter 4: Relational Database Schema](04-Relational-Database-Schema.md)) and 14 conversational bot commands ([Chapter 6: Bot Command Reference](06-Bot-Command-Reference.md)).

### Verification & Business Case (Standardized Lean Reference Model)
Modeled using Lean Six Sigma DMADV methodology on a standardized `100-seat` enterprise reference scenario, yielding a modeled gross recoverable value range of `EUR 198,000 to EUR 297,000 / year` (`40%` to `60%` friction recovery; `EUR 188,100 to EUR 287,100 / year` net after illustrative `EUR 9,900 / year` maintenance; [Chapter 1](01-Business-Case-and-ROI.md)). Governance specifies `10 automated controls (5 scheduled scanners, 5 event detectors)` plus an external dead-man heartbeat (`HB-001`, [Chapter 5](05-Self-Healing-Loop-and-Fault-Taxonomy.md)), `5 Internal Container Access Tiers (I-0 to I-4)` across `6 Operating Roles` ([Chapter 7](07-Role-Based-Access-Matrix.md)), and a `98.2%` (`~98%`) reduction in metered platform automation runs.

---

## Pillar II: Balaerion Highlights (`[Status: Prototype + Designed]`)

### The Constraint
Teams adopting free-tier or multi-vendor LLM endpoints routinely expose unmasked client identifiers across non-EU providers, hardcode rotating model IDs, or allow generative prose to invent company registration facts.

### The Architecture
Architected as a dual-mode serverless AI gateway (`Mode A` everyday assistant + `Mode B` ProspectHub 7-state GTM workspace; [Balaerion I](balaerion/01-Mandate-and-Core-Stack.md)) routing `23 AI personas` (`7` Mode A utilities + `16` Mode B specialists; [Balaerion IV](balaerion/04-MCP-Agents-and-Product-Layer.md)) across strict `lane: eu` and `lane: general` boundaries ([Balaerion III](balaerion/03-Security-and-GDPR-Routing-Lane.md)). Entity identifiers, VAT/KBO numbers, and tech-stack signals come exclusively from structured OSINT fixtures rather than LLM generation.

### Verification & Safeguards
Pre-dispatch regex and lane guards block VAT, IBAN, email, and `eu -> general` cross-lane leaks (`HTTP 403`) before any socket opens; throttled `eu` endpoints fail closed to deterministic Replay rather than crossing lanes; and public calibration fixtures use synthetic Belgian KBO `0123.456.789` (which intentionally fails mod-97 check `49 != 89` so it can never match a real company). Explore the recorded sandbox in the [Balaerion Interactive Demo](balaerion/demo/index.html).

---

## Pillar III: Syndicate Highlights (`[Status: Prototype (Simulation) + Designed]`)

### The Constraint
Group sports prediction pools and recreational tipgames suffer from two structural defects: intuition-driven picks ignore expected-goals (`xG`) variance, and shared spreadsheets silently dilute existing participants whenever members enter or exit mid-season.

### The Architecture
Designed as a strictly non-financial statistical simulation and unit-accounting system ([Syndicate I](syndicate/01-Mandate-and-System-Architecture.md)): a bivariate Poisson / `xG` scoreline matrix engine (`0-0` to `7-7`, [Syndicate II](syndicate/02-Poisson-and-xG-Probability-Engine.md)), a quorum-gated selection card state machine with a hard `T - 15m` pre-kickoff lock ([Syndicate III](syndicate/03-Group-Tipgame-and-Slip-Integrity.md)), and a fixed-scale `NUMERIC(18,6)` unit-share Net Asset Value (`NAV`) ledger denominated in non-monetary **virtual units (`VU`)** ([Syndicate IV](syndicate/04-Unit-Share-NAV-Ledger-and-Operations.md)).

### Verification & Safeguards
Enforces inter-matchday dealing cutoffs (blocking stale-NAV entry while selection cards are in play), `ROUND_HALF_EVEN` rounding with residual sweep, `UNIQUE (idempotency_key)` settlement protection, and PostgreSQL `REVOKE UPDATE, DELETE` triggers. Exercise the 36-club synthetic league table, Poisson lab, and `VU` ledger in the [Syndicate Simulation Demo](syndicate/demo/index.html).

---

## Live Design System & Architecture Surfaces

* [Architecture Topology](ARCHITECTURE_FLOW.md)
* [Launch Signal Studio (Live Browser Editor)](signal/02_studio/signal-studio.html)
* [Launch Signal Press (Offline A4 Document Designer)](signal/press/index.html)
* [Browse Signal Device & Template Gallery](signal/02_studio/signal-gallery.html)
* [Signal Design System Specification](11-Signal-Design-System.md)
* [Signal Press Document Architecture](16-Signal-Press-Document-Designer.md)

---

### Balaerion Core Agent Topology (Selected Personas)

| Agent Persona | Primary Responsibility | Guardrail / Output Contract |
| :--- | :--- | :--- |
| **Scout** | Parallel firmographic, technographic, and OSINT signal research | Structured JSON account brief; deterministic fact boundary (entity facts come from structured sources, not generation) |
| **Campaign Architect** | Maps account signals against the knowledge base for custom plays | Territory- and vertical-scoped campaign blueprint |
| **Voice & Outreach Engine** | Generates email/call drafts using per-rep Voice Profiles and regional context | Staged draft only; automated outreach and auto-send hard-blocked |
| **Relay Agent** | Packages qualification state, objections, and context for SDR to AE to CS handovers | Deterministic handover brief triggered on state transition |
| **Quant** | Monitors 7-state velocity, surfaces deal risk, and diagnoses campaign bottlenecks | Read-only telemetry and bottleneck alerts; no blind CRM mutations |
| **Compliance Overlord** | Enforces regional regulations (GDPR Art. 15/17/35), channel bans, and schema validation | Hard circuit breaker blocking non-compliant payloads |
