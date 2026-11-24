# Balaerion II. MCP Agent Layer & GTM Product Surface

**Focus:** 23 Active MCP Agents, Research-vs-Judgement Split, OSINT ProspectHub & Signal Integration

---

## 1. Agent Orchestration (MCP, Not A2A)
Balaerion runs **23 active agents** (with 8 benched), selected via a five-part usefulness test and sourced from the real skills ecosystem (`npx skills` CLI + lock file).

- **Single-Process MCP Server:** The orchestrator wraps agents as **MCP servers** (one process hosting multiple agent definitions, selectable by capability) with **concurrent execution** as a first-class requirement.
- **Research vs. Judgement Split:** Free-tier models handle retrieval and **must return raw source evidence**, never bare conclusions. Primary reasoning models verify evidence and write final outputs.
- **Memory & Personas:** OmniRoute memory is disabled initially to prevent silent context pollution; custom personas are deferred to v2.0.

## 2. Embedded Product Layer
- **Signal Design System:** Embedded directly so decks, briefs, and structured outputs share one visual grammar.
- **ProspectHub (GTM + OSINT):** End-to-end prospect-to-activation workflow with country auto-detection, coverage tiers, and direct registry lookups (**KVK, KBO, NBB, VIES, GLEIF**).
- **Deck Builder & Activation Skill:** PC-only manual-first deck builder (50 presets + Signal `.pptx` exporter), an `"Activate [company]"` advisory workflow built to activation-depth benchmarks, an Enterprise SSoT port, and multi-edition image/channel tooling.

## 3. Interactive Section Demo
Launch the [Balaerion OmniRoute & GDPR Routing Simulator](https://aertsjef1989.github.io/Autonomous-SSoT-Architecture/balaerion/demo/) to test Cloudflare Access MFA, EU client-data routing locks, Hetzner-to-Oracle ARM failover, and concurrent MCP agent dispatch.
