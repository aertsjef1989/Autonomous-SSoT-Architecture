# Systems Architecture Portfolio: Topology & Data Flow

![Responsive diagram of the GitHub repository, CI verification gates (leak_gate, facts_check, link_check, head_meta_check), GitHub Pages static host, Pillar I Autonomous SSoT (40 markets, 3,055 public nodes, 11-table schema, 14 Bot commands, 10 automated controls + HB-001), Pillar II Balaerion & ProspectHub (two-lane router, PII gate, 23 AI personas), Pillar III Syndicate Matchday Simulator (36 synthetic clubs, Poisson/xG engine, virtual-unit NAV ledger), Signal Studio, Signal Press, the Analyze in Balaerion AI cross-demo handoff, and SSoT/ProspectHub/Studio JSON-Markdown importers into Signal Press.](assets/architecture-topology.svg)

---

## Cross-Surface Data & Artifact Flow Summary

| Source Surface | Handoff / Interface | Target Surface | Payload & Security Boundary |
| :--- | :--- | :--- | :--- |
| **Markdown Chapters + `facts/facts.json`** | CI Build Pipeline (`deploy.yml`) | **GitHub Pages (`_book/`)** | Verified by `leak_gate.py`, `facts_check.py`, `link_check.py`, and `head_meta_check.py`; zero backend secrets or unlisted deployment URLs. |
| **Pillar I: SSoT Console Demo** (`demo/index.html`) | `"Analyze in Balaerion AI"` action link | **Pillar II: Balaerion Replay Demo** (`balaerion/demo/index.html`) | Navigates directly from SSoT governance telemetry into Balaerion's two-lane (`eu` vs. `general`) Replay sandbox. |
| **Pillar I SSoT, Pillar II ProspectHub & Pillar III Syndicate** | Client-side import & `signal-handoff.ts` | **Signal Studio (`16:9`) & Signal Press (`A4`)** | Compiles SSoT answers, ProspectHub activation plans, and Syndicate quant briefs into `63`-device `16:9` slide decks and `12`-block `signal-press-doc-v1` A4 documents (`DOCX`, `PDF`, `Email HTML`, `Markdown`). |
| **Signal Studio (`signal/02_studio/signal-studio.html`)** | Structured `Deck JSON` handoff | **Signal Press (`signal/press/index.html`)** | Converts `16:9` slide deck structures into portrait `A4` deliverables behind a blocking pre-export lint gate (`0` network calls). |
| **Pillar III: Syndicate 6-Tab Lab** (`syndicate/demo/index.html`) | Standalone simulation sandbox | **Browser-Only Quant & Virtual-Unit Ledger** | Self-contained 36-club synthetic Dixon-Coles/Shin lab, `1,000-path` Monte Carlo drawdown simulator, and unit-share `NAV` calculator (`VU` virtual units only). |
| **Reviewer Grant Request** (`GitHub Issue` / `/redeem`) | Owner-Approved Telegram Queue | **Private Next.js + Supabase EU Workspace** | Single-use `BLR-...` grant (`#code=` fragment scrubbed on load, `25` calls / `48h` TTL, `FOR UPDATE` atomic quota lock) unlocks live 12-LLM, hybrid `pgvector` RAG, and 8-collector OSINT execution. |
