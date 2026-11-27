# Balaerion I. Mandate & Core Stack

**Focus:** Dual-Mode AI Workspace (Everyday Assistant + ProspectHub Multi-Persona Showcase), 12-Provider Card-Free Routing & Architectural Trade-Offs · **Status:** `Prototype` + `Designed`

---

## 1. Architectural Mandate

Enterprise and commercial teams adopting generative AI routinely hit three structural failure modes:
1. **Vendor & Model Lock-In:** Hardcoding a single provider SDK or transient free-tier model slug breaks production workflows whenever rate limits tighten or model deprecations occur.
2. **Unbounded Jurisdiction & PII Drift:** Routing EU prospect context, draft contracts, or internal playbooks through consumer chat interfaces or non-EU free pools exposes unmasked identifiers (`VAT`, `IBAN`, personal emails) outside approved processing boundaries.
3. **Hallucinated Entity Facts:** Asking an LLM to "research a company" from parametric memory fabricates registration numbers, e-commerce stacks, and pixel configurations that erode credibility in technical discovery calls.

**Balaerion** resolves all three failure modes through a **dual-mode serverless AI gateway** operating from one unified codebase and pre-dispatch security boundary:

1. **Mode A (Standalone Multi-LLM Engineering & Writing Workbench):** A fast, model-agnostic workspace for software architecture, SQL/PostgreSQL debugging, executive brief drafting, and structured JSON compilation across **12 card-free LLM providers** without vendor lock-in.
2. **Mode B (ProspectHub Multi-Persona GTM Suite):** A domain-keyed B2B commercial engineering and account-activation workspace embedded inside Balaerion. Deterministic OSINT collectors supply verified corporate/stack facts, hybrid `pgvector + tsvector` retrieval supplies governed SSoT playbooks (`[DOC_ID]`), and lane-locked personas compile account briefs ready for one-click handoff into **Signal Studio (`16:9`)** and **Signal Press (`A4`)**.

---

## 2. Serverless Reference Stack

| Layer | Technology | Architectural Role & Boundary |
| :--- | :--- | :--- |
| **Frontend & API Gateway** | **Next.js 14 App Router (Serverless)** | Unified Replay console, Mode A workbench, Mode B ProspectHub suite, and single server-side `/api/chat` + `/api/osint/inspect` proxy. |
| **State, RAG & Atomic Quotas** | **PostgreSQL 16 (EU AWS Region + RLS)** | Server-only `service_role` access for salted grant HMACs, `FOR UPDATE` weighted-token budgets, `tsvector` GIN + `vector(1024)` HNSW SSoT chunks, and hourly `pg_cron` privacy purges. |
| **Safe Lane (`lane: eu`)** | **3 Sovereign / EU Endpoints (+1 Conditional)** | `Mistral AI Experiment`, `Mistral Codestral`, and `OVHcloud AI Endpoints` (plus conditional `Scaleway Paris`), hard-locked against cross-lane spillover. |
| **General Lane (`lane: general`)** | **9 Card-Free High-Throughput Endpoints** | `NVIDIA NIM`, `GroqCloud`, `Cerebras`, `Google AI Studio (Gemini 2.5 Flash)`, `OpenRouter :free`, `Cloudflare Workers AI`, `Cohere`, `Fireworks`, and `Together Free`. |
| **Hybrid OSINT Layer** | **3 Zero-Key + 5 Card-Free Collectors** | Cloudflare DoH (`MX`/`SPF`/`DMARC`), SSRF-guarded HTML `<head>` tech scanner, FR DINUM SIREN Open API, plus optional `Tavily`, `Serper`, `urlscan.io`, `Exa`, and `CBEAPI`. |
| **Artifact Output Engine** | **Signal Studio & Signal Press** | Client-side deterministic compilers turning AI/OSINT outputs into `16:9` decks (`63` geometric SVG devices) and lint-gated `A4` `.docx`, PDF, Email HTML, and Markdown deliverables. |

---

## 3. Single-File Agent & Provider Registry

All `23` AI personas and all `12` default LLM providers (+ `1` conditional EU slot) are declared in typed, load-time validated registries (`registry.ts` and persona manifests) rather than scattered environment strings.

### 3.1 Admitted 12-Provider Card-Free Routing Matrix (`[Status: Implemented in Private Workspace]`)

Every provider admitted to the gateway satisfies a strict **Zero-Card / Zero-Auto-Bill Constraint**: if an upstream key is unconfigured or hits free-tier rate limits, its status badge reports `FALLBACK` and requests degrade deterministically without ever incurring metered overage charges.

| Provider ID | Lane | Protocol Adapter | Pinned Default Model | Token Weight | Primary Workload Fit |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **`mistral`** | `eu` (Safe) | `openai_compat` | `mistral-small-2503` | `1.0x` | Primary EU safe-lane ProspectHub synthesis & multilingual NL/FR/EN briefs |
| **`codestral`** | `eu` (Safe) | `openai_compat` | `codestral-2501` | `1.0x` | EU safe-lane SQL, JSON schema repair, and GTM/CAPI snippet auditing |
| **`ovhcloud-eu`** | `eu` (Safe) | `openai_compat` | `Mistral-Nemo-Instruct-2407` | `1.0x` | Secondary EU sovereign failover (`OVH_ENABLE_LIVE=1` guard) |
| **`nvidia-nim`** | `general` | `openai_compat` | `qwen/qwen3-235b-a22b` | `1.2x` | Deep architectural reasoning, quantitative Syndicate memos, long synthesis |
| **`groq`** | `general` | `openai_compat` | `llama-3.3-70b-versatile` | `1.0x` | Sub-second interactive chat, `/ask` SSoT Q&A, rapid iteration |
| **`cerebras`** | `general` | `openai_compat` | `qwen-3-32b` | `0.8x` | Ultra-low-latency wafer-scale drafting and structured block extraction |
| **`gemini`** | `general` | `gemini_native` | `gemini-2.5-flash` | `1.0x` | Long-context SSoT playbook cross-checking (`generativelanguage.googleapis.com` only) |
| **`openrouter-free`** | `general` | `openai_compat` | `meta-llama/llama-3.3-70b-instruct:free` | `1.0x` | `:free`-enforced meta-pool failover (non-`:free` slugs hard-rejected at router) |
| **`cloudflare-workers-ai`** | `general` | `cloudflare_workers_ai` | `@cf/meta/llama-3.1-8b-instruct` | `0.6x` | Edge compact utility tasks + 1024-dim `@cf/baai/bge-m3` multilingual embeddings |
| **`cohere`** | `general` | `cohere_v2` | `command-a-03-2025` | `1.0x` | Grounded RAG citation synthesis + `embed-multilingual-v3.0` embeddings |
| **`fireworks`** | `general` | `openai_compat` | `accounts/fireworks/models/deepseek-v3` | `1.2x` | Starter-credit analytical reasoning and technical specification review |
| **`together`** | `general` | `openai_compat` | `meta-llama/Llama-3.3-70B-Instruct-Turbo-Free` | `1.0x` | Zero-cost Turbo-Free fallback endpoint in general lane |

> **Hard Billing Guardrails in Code:** Paid Google Cloud Vertex AI (`aiplatform.googleapis.com`), `gemini-*-pro` paid tiers, and any OpenRouter model slug lacking the explicit `:free` suffix are rejected by `router.ts` before socket creation.

---

## 4. Key Architecture Decision Records (`ADR-BLR`)

| ADR | Decision | Rejected Alternative | Consequence if Simplified |
| :--- | :--- | :--- | :--- |
| **`ADR-BLR-01`** | **Server-Side Single Proxy (`/api/chat`) with Protocol Normalization** | Direct browser SDK calls to Groq / Gemini / Mistral | Browser-exposed keys are scraped within minutes, and client-side PII/lane checks can be bypassed via `curl`. |
| **`ADR-BLR-02`** | **Weighted-Token Accounting (`0.6x` to `1.2x`)** | Flat request-count rate limiting only | A 235B reasoning prompt consumes ~4x the upstream quota of an 8B classification call; weighted tokens align reviewer grant budgets with real quota pressure. |
| **`ADR-BLR-03`** | **Replay-First Zero-Cookie Default** | Mandatory OAuth login wall on landing | Hiring managers and architecture reviewers bounce on login walls; Replay Mode proves every UX and failure branch instantaneously with zero cookies (`ePrivacy Art. 5(3)`). |
| **`ADR-BLR-04`** | **Strict Separation of OSINT Facts and LLM Prose** | Letting LLMs "browse and infer" company VAT/stack | Generative prose hallucinates registry digits; Balaerion restricts entity/stack fields to deterministic OSINT collectors and marks missing signals `unconfirmable`. |

---

## 5. Dual-Surface Portfolio Access (`Public Replay` vs. `Private Live Sandbox`)

* **Public GitHub Pages Surface (`[Status: Prototype]`):** Runs 100% client-side in [Balaerion Interactive Demo](demo/index.html) using deterministic Replay recordings and synthetic calibration entities.
* **Private Full-Stack Deployment (`[Status: Implemented]`):** Prospective employers and technical reviewers can [request an owner-approved 48-hour Reviewer Grant via GitHub](https://github.com/aertsjef1989/Autonomous-SSoT-Architecture/issues/new?template=request-sandbox-grant.yml) (`25` live calls / `12,000` weighted tokens) to test live 12-provider routing, SSoT hybrid RAG, and ProspectHub OSINT enrichment without exposing unlisted infrastructure URLs publicly.
