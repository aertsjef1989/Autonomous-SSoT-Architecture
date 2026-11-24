# Enterprise Knowledge Architecture (SSoT) & Systems Portfolio

![SSoT, Balaerion & The Syndicate](assets/portfolio-logos.png)

**Architected & Compiled by:** Jef Aerts
**Methodology:** AI-Augmented Systems Architecture (LLM Orchestration & Lean DMADV)

## About the Architect
**Jef Aerts** is a systems architect and operational operator focused on structured knowledge governance, multi-provider AI gateway security, and deterministic data/accounting systems. This book presents three standalone architecture builds (SSoT, Balaerion, and Syndicate) emphasizing failure modes, design trade-offs, and verification over raw code dumps.

## Portfolio Overview

| System | Core Focus | Key Guardrail | Interactive Surface |
| :--- | :--- | :--- | :--- |
| **SSoT** | Multi-market knowledge architecture, relational schema (`T1` to `T10`), bot commands, and self-healing governance | Move-then-confirm publish, container inheritance, and 30-day archive kill switch | [Launch SSoT Demo](demo/index.html) |
| **Balaerion** | Config-driven multi-provider AI gateway, persona-routed agents, and OSINT GTM layer | Pre-dispatch PII gate, lane isolation (EU vs General), and evidence-only retrieval | [Launch Balaerion Demo](balaerion/demo/index.html) |
| **Syndicate** | Python Poisson/xG probability engine, read-only dashboard, group tipgame simulation, and unit-share NAV ledger prototype | Pre-kickoff slip lock, unit-share NAV pricing, and append-only ledger (simulation only, no live pooled funds) | [Launch Syndicate Demo](syndicate/demo/index.html) |

---

## SSoT Highlights

### The Constraint
Designed under strict enterprise compliance blockers that prohibited standard off-the-shelf Knowledge Management Systems (such as Confluence, Zendesk KMS, or Salesforce Knowledge).

### The Architecture
Engineered a custom, zero-license-cost knowledge operations system built on standard enterprise workspace primitives (Enterprise Wiki, Relational Governance Base, and ChatOps Bot). The architecture scales across multi-market teams using a normalized 10-table schema and a two-layer conversational interface.

### The Business Case (Standardized Lean Reference Model)
Modeled using Lean Six Sigma DMADV methodology on a standardized 100-seat enterprise reference scenario with published labor benchmarks. Every waste-reduction figure and payback calculation is explicitly parameterized and reproducible in [Chapter 1: Business Case and ROI](01-Business-Case-and-ROI.md).

### The Engine (Autonomous Governance)
To prevent knowledge decay without manual oversight, the system runs a 14-detector Self-Healing Loop. It enforces container-level permission inheritance via a strict 6-tier Access Matrix and executes a 30-day autonomous archive kill switch on unverified records, using batched scanning to minimize automation overhead.

## Live Design System & Architecture Surfaces

* [Architecture Topology](ARCHITECTURE_FLOW.md)
* [Launch Signal Studio (Live Browser Editor)](signal/02_studio/signal-studio.html)
* [Browse Signal Device & Template Gallery](signal/02_studio/signal-gallery.html)
* [Signal Design System Specification](11-Signal-Design-System.md)

---

### Balaerion Core Agent Topology (Selected Personas)

| Agent Persona | Primary Responsibility | Guardrail / Output Contract |
| :--- | :--- | :--- |
| **Scout** | Parallel firmographic, technographic, and OSINT signal research | Structured JSON account brief; zero unverified claims |
| **Campaign Architect** | Maps account signals against the knowledge base for custom plays | Territory- and vertical-scoped campaign blueprint |
| **Voice & Outreach Engine** | Generates email/call drafts using per-rep Voice Profiles and regional context | Staged draft only; automated outreach and auto-send hard-blocked |
| **Relay Agent** | Packages qualification state, objections, and context for SDR to AE to CS handovers | Deterministic handover brief triggered on state transition |
| **Quant** | Monitors 7-state velocity, surfaces deal risk, and diagnoses campaign bottlenecks | Read-only telemetry and bottleneck alerts; no blind CRM mutations |
| **Compliance Overlord** | Enforces regional regulations (GDPR Art. 15/17/35), channel bans, and schema validation | Hard circuit breaker (`#F0245C`) blocking non-compliant payloads |
