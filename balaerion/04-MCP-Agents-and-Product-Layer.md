# Balaerion IV. MCP Agent Layer & GTM Product Surface

**Focus:** 23 Active MCP Agents, Research-vs-Judgement Split, ProspectHub OSINT & Signal Studio

---

## 1. Single-Process MCP Orchestrator
Rather than adopting heavy agent-to-agent (A2A) network meshes, Balaerion wraps its agent fleet as **Model Context Protocol (MCP) servers** inside a single orchestrator process:
* **Fleet Size:** **23 active agents** (8 benched), selected via a five-part usefulness test and sourced from the real skills ecosystem (`npx skills` CLI + lock file for deterministic versioning).
* **Capability Selection & Concurrency:** Agents are invoked by capability tag, with **concurrent execution** treated as a mandatory product requirement so multi-source OSINT and verification run in parallel.

---

## 2. The Research-vs-Judgement Split
To eliminate hallucinated synthesis while keeping API spend near zero:
1. **Retrieval Tier (Free/Low-Cost Models):** Execute web, registry, and document lookups in parallel. Strictly constrained to return **raw source evidence, URLs, and verbatim extracts**—never a bare conclusion.
2. **Judgement Tier (Primary Reasoning Model):** Audits the returned evidence, resolves conflicts, and writes the final deliverable.

---

## 3. Embedded Product Layer
* **Signal Design System:** Embedded natively so every deck, brief, and GTM artifact renders in one consistent visual language.
* **ProspectHub (GTM + OSINT):** Upgraded into a full prospect-to-activation workspace adopting the Signal palette, with automatic country detection, coverage tiers, and direct European registry lookups (**KVK, KBO, NBB, VIES, GLEIF**).
* **Deck Builder & Activation Skill:** PC-only manual-first deck builder with 50 fresh presets and native Signal `.pptx` export, paired with an `"Activate [company]"` advisory skill and multi-edition channel/image generation workflows.

## 4. Interactive Architecture Prototype
Launch the [Balaerion 3-Tab Interactive Prototype](https://aertsjef1989.github.io/Autonomous-SSoT-Architecture/balaerion/demo/) to test OmniRoute GDPR routing, Hetzner/Oracle failover, and concurrent MCP agent orchestration.
