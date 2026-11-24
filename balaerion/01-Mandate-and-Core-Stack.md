# Balaerion I. Mandate & Core Stack

**Focus:** Dual-Mode AI Workspace (Everyday Assistant + ProspectHub Multi-Persona Showcase) on Vercel & Supabase

---

## 1. Architectural Mandate

Balaerion is a **dual-mode AI platform** designed to serve two complementary purposes from a single interface and routing layer:

1. **Mode A — General AI Assistant (Everyday Productivity):** A fast, model-agnostic chat and document workspace for daily engineering, writing, analysis, and brainstorming—allowing instant switching across configured LLM providers without vendor lock-in.
2. **Mode B — ProspectHub Multi-Persona Agent Suite (Portfolio Showcase):** A domain-keyed B2B sales intelligence and activation engine embedded directly inside Balaerion, demonstrating deterministic OSINT, lane-enforced GDPR routing, and multi-persona execution.

---

## 2. v1 Production Stack (Serverless-First)

| Layer | Technology (v1) | Role |
| :--- | :--- | :--- |
| **Frontend & API** | **Vercel** (Next.js + Serverless Functions) | Unified chat UI, ProspectHub workspace, and pre-dispatch lane router |
| **State & Auth** | **Supabase** (PostgreSQL + Auth + RLS) | Persistent general chat threads, 7-state prospect workspaces, and RBAC |
| **Safe Lane Models** | **EU Zero-Retention Providers** (Mistral EU / Scaleway Paris) | Client-facing intelligence, OSINT synthesis, and activation plans |
| **General Lane Models** | **Multi-Provider Failover** (Groq, Gemini, OpenRouter, DeepSeek) | Everyday AI tasks, commercial drafting, and ideation |
| **Design System** | **Signal Tokens** (`#08090D`, `#21E0DC`, `#F0245C`) | Unified high-contrast console aesthetic across docs and prototypes |

---

## 3. Single-File Agent Registry

All personas—both everyday utilities and ProspectHub specialists—are declared in a single validated registry (`lane`, `allowedConnections`, `systemPrompt`, `capabilities`). Load-time schema validation ensures duplicate IDs, invalid capabilities, or misconfigured lane locks fail during CI rather than in production.
