# Enterprise Knowledge Architecture (SSoT) & Systems Portfolio

![SSoT, Balaerion & The Syndacate](assets/portfolio-logos.png)

**Architected & Compiled by:** Jef Aerts
**Methodology:** AI-Augmented Systems Architecture (Claude/LLM Orchestration)

## About the Architect
**Jef Aerts** is a systems architect and operational operator focused on structured knowledge governance, multi-provider AI gateway security, and deterministic data/accounting systems. This book presents three standalone architecture builds—**SSoT**, **Balaerion**, and **Syndicate**—emphasizing failure modes, design trade-offs, and verification over raw code dumps.

## Portfolio Overview

| System | Core Focus | Key Guardrail | Interactive Surface |
| :--- | :--- | :--- | :--- |
| **SSoT** | Multi-market knowledge architecture, relational schema (`T1`–`T10`), bot commands, and self-healing governance | Move-then-confirm publish, container inheritance, and 30-day archive kill switch | [SSoT Demo](https://aertsjef1989.github.io/systems-design-portfolio/demo/) |
| **Balaerion** | OmniRoute AI gateway + LibreChat, Hetzner/Oracle ARM failover, 23 MCP agents, and OSINT GTM layer | Cloudflare Access MFA, GDPR EU lane (Scaleway/Mistral EU), and evidence-only retrieval | [Balaerion Demo](https://aertsjef1989.github.io/systems-design-portfolio/balaerion/demo/) |
| **Syndicate** | Python Poisson/xG probability engine, read-only Next.js dashboard, group tipgame, and unit-share NAV ledger | Pre-kickoff slip lock, unit-share NAV pricing, and append-only ledger | [Syndicate Demo](https://aertsjef1989.github.io/systems-design-portfolio/syndicate/demo/) |

---

## SSoT Highlights

### The Constraint
Designed under strict enterprise compliance blockers that prohibited the use of standard off-the-shelf Knowledge Management Systems (e.g., Confluence, Zendesk KMS, Salesforce Knowledge).

### The Architecture
Engineered a custom, zero-license-cost knowledge operations system built entirely within the existing corporate tooling ecosystem. The architecture scales across 200 users and 45 markets, utilizing a custom relational schema and a two-layer conversational bot interface.

### The Business Case
Based on Eurostat labor data, the system targets an estimated **€1.89M to €2.81M** in annual productivity waste caused by information fragmentation and unstructured onboarding.

### The Engine (Autonomous Governance)
To prevent data decay without manual oversight, the system runs a 14-detector Self-Healing Loop. It enforces container-level permission inheritance via a strict 6-tier Access Matrix, and executes a 30-day autonomous archive "kill switch" on unverified data. This maintains structural integrity across 3,386 nodes while utilizing batched scanning to reduce automation budget consumption by 98%.

## Live Design System & Architecture Surfaces

- [Architecture Topology](ARCHITECTURE_FLOW.md)
- [Launch Interactive SSoT Architecture Demo](https://aertsjef1989.github.io/systems-design-portfolio/demo/)
- [Launch Signal Studio (Live Browser Editor)](https://aertsjef1989.github.io/systems-design-portfolio/signal/02_studio/signal-studio.html)
- [Browse Signal Device & Template Gallery](https://aertsjef1989.github.io/systems-design-portfolio/signal/02_studio/signal-gallery.html)
- [Signal Design System Specification](11-Signal-Design-System.md)
