# Balerion I. Mandate & 12-Agent Topology

**Focus:** Stateful B2B Sales & RevOps Digital Twin Pipeline, Scoped Agent Roles, and Execution Boundaries

---

## 1. The Problem & Target Outcome
Manual account research, ad-hoc outreach sequencing, and inconsistent CRM/RevOps handovers slow down pipeline velocity and create silent state drift. Project Balerion operates as a stateful, multi-agent B2B sales and RevOps digital twin pipeline built around a **12-agent orchestration framework** for account research, personalized outreach, handover tracking, and campaign diagnostics.

- **Core Objective:** Pair specialized agent roles with explicit state transitions, narrow credentials, and human approval gates before external or CRM mutations occur.
- **Auditability Standard:** Every agent run records inputs, tool calls, state transitions, and final disposition in an append-only execution log.

## 2. The 12-Agent Orchestration Framework
Rather than giving one generalist agent broad write access, Balerion partitions responsibilities across 12 scoped agents grouped into four operational stages:

| Stage | Agent Roles (12 Total) | Primary Responsibility | Permission & Gate Boundary |
| :--- | :--- | :--- | :--- |
| **1. Account Research** | Signal Monitor, Firmographic Mapper, ICP Qualifier | Gather account signals, map stakeholder/tech context, and score ICP fit | Read-only external/research inputs; zero CRM write or outbound send rights |
| **2. Outreach Sequencing** | Angle Selector, Draft Composer, Policy/Tone Checker | Build account-specific outreach steps and verify messaging constraints | Draft/queue only; human approval gate required before external dispatch |
| **3. RevOps Handover** | Qualification Validator, Routing Resolver, State Syncer | Validate handover readiness, assign owner/SLA, and sync pipeline state | Idempotency-keyed writes; schema check + conflict lock on CRM updates |
| **4. Campaign Diagnostics** | Funnel Telemetry Collector, Anomaly Detector, Digest Builder | Track conversion/reply/revert rates and flag campaign or routing anomalies | Read-only analytics queries; row-scoped telemetry outputs |

## 3. State Machine & Handover Contract
Each account record moves through explicit states (`DISCOVERED` -> `VERIFIED_BRIEF` -> `SEQUENCE_QUEUED` -> `APPROVED_FOR_SEND` -> `HANDOVER_READY` -> `SYNCED`) so downstream agents never act on unverified upstream outputs.
