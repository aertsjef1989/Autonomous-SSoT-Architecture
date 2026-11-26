# Systems Architecture Portfolio: Topology & Data Flow

![Responsive diagram of the GitHub repository, CI verification gates (leak_gate, facts_check, link_check, head_meta_check), GitHub Pages static host, Pillar I Autonomous SSoT (40 markets, 3,055 public nodes, 11-table schema, 14 Bot commands, 10 automated controls + HB-001), Pillar II Balaerion & ProspectHub (two-lane router, PII gate, 23 AI personas), Pillar III Syndicate Matchday Simulator (36 synthetic clubs, Poisson/xG engine, virtual-unit NAV ledger), Signal Studio, Signal Press, the Analyze in Balaerion AI cross-demo handoff, and SSoT/ProspectHub/Studio JSON-Markdown importers into Signal Press.](assets/architecture-topology.svg)

---

## Cross-Surface Data & Artifact Flow Summary

| Source Surface | Handoff / Interface | Target Surface | Payload & Security Boundary |
| :--- | :--- | :--- | :--- |
| **Markdown Chapters + `facts/facts.json`** | CI Build Pipeline (`deploy.yml`) | **GitHub Pages (`_book/`)** | Verified by `leak_gate.py`, `facts_check.py`, `link_check.py`, and `head_meta_check.py`; zero backend secrets or live proxy URLs. |
| **Pillar I: SSoT Console Demo** (`demo/index.html`) | `"Analyze in Balaerion AI"` action link | **Pillar II: Balaerion Replay Demo** (`balaerion/demo/index.html`) | Navigates directly from SSoT governance telemetry into Balaerion's two-lane (`eu` vs. `general`) Replay sandbox. |
| **Pillar I SSoT Playbooks & Pillar II ProspectHub Briefs** | Client-side file import (`0` network calls) | **Signal Press (`signal/press/index.html`)** | Parses `ENT_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md` Markdown and ProspectHub account JSON into `signal-press-doc-v1` blocks with mismatch reporting. |
| **Signal Studio (`signal/02_studio/signal-studio.html`)** | Structured `Deck JSON` handoff | **Signal Press (`signal/press/index.html`)** | Converts `16:9` slide deck structures into portrait `A4` DOCX, Google Docs, Dark/Light PDF, Email HTML, and Markdown behind a blocking pre-export lint gate. |
| **Pillar III: Syndicate Demo (`syndicate/demo/index.html`)** | Standalone simulation sandbox | **Browser-Only Virtual-Unit Ledger** | Self-contained 36-club synthetic Poisson/xG matrix and unit-share `NAV` calculator (`VU` virtual units only; zero external requests). |
