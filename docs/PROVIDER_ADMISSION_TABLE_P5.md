# Free-Tier LLM Provider Admission Table (Track 2 · 12+1 Card-Free Multi-LLM Pool)

> **Verification Date:** 2026-11-26 (verified against primary provider documentation; zero credit card required across all 12 primary entries).
> **Hard Constraint 1.1:** Free-only, card-free APIs. Permanently excluded in code (`assertProviderPermitted`): Anthropic API, GCP Vertex AI (`aiplatform.googleapis.com` / paid Pro models), paid OpenAI API, retired GitHub Models, and `$0` Hugging Face Router.

---

## 1. Admitted Card-Free Provider Matrix

| Provider ID | Candidate | Lane | Env Variable(s) | Pinned Default Model (`H7`) | Status in Registry | Primary Source URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mistral` | **Mistral AI Experiment Free** | `eu` (`safe`) | `MISTRAL_API_KEY` | `mistral-small-2503` | **ADMITTED (Primary `eu`)** | https://console.mistral.ai |
| `codestral` | **Mistral Codestral Endpoint** | `eu` (`safe`) | `CODESTRAL_API_KEY` | `codestral-2501` | **ADMITTED (`eu` Code/SQL)** | https://codestral.mistral.ai |
| `ovhcloud-eu` | **OVHcloud AI Endpoints** | `eu` (`safe`) | `OVH_AI_ENDPOINTS_KEY` / `OVH_ENABLE_LIVE` | `Mistral-Nemo-Instruct-2407` | **ADMITTED (`eu` Sovereign)** | https://www.ovhcloud.com/en/public-cloud/free-ai-api/ |
| `scaleway-paris` | **Scaleway Generative APIs (`fr-par`)** | `eu` (`safe`) | `SCALEWAY_API_KEY` + `ENABLE_SCALEWAY_CARD_FREE_ORG=1` | `mistral-nemo-instruct-2407` | **CONDITIONAL (`enabledByDefault: false`)** | https://www.scaleway.com/en/generative-apis/ |
| `nvidia-nim` | **NVIDIA NIM Free Developer Tier** | `general` | `NVIDIA_API_KEY` | `qwen/qwen3-235b-a22b` | **ADMITTED (`general` Reasoning)** | https://build.nvidia.com |
| `groq` | **GroqCloud Free Tier** | `general` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | **ADMITTED (`general` Low-Latency)** | https://console.groq.com/docs/rate-limits |
| `cerebras` | **Cerebras Shared Inference Free** | `general` | `CEREBRAS_API_KEY` | `qwen-3-32b` | **ADMITTED (`general` Ultra-Fast)** | https://cloud.cerebras.ai |
| `gemini` | **Google AI Studio Free Tier** | `general` | `GEMINI_API_KEY` | `gemini-2.5-flash` | **ADMITTED (`general` Long-Context)** | https://aistudio.google.com/apikey |
| `openrouter-free` | **OpenRouter `:free` Pool** | `general` | `OPENROUTER_API_KEY` | `meta-llama/llama-3.3-70b-instruct:free` | **ADMITTED (`general`, `:free` enforced)** | https://openrouter.ai/keys |
| `cloudflare-workers-ai` | **Cloudflare Workers AI Free** | `general` | `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_API_TOKEN` | `@cf/meta/llama-3.1-8b-instruct` | **ADMITTED (`general`, 10k Neurons/day ZDR)** | https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| `cohere` | **Cohere Trial Key** | `general` | `COHERE_API_KEY` | `command-a-03-2025` | **ADMITTED (`general` RAG/Synthesis)** | https://dashboard.cohere.com/api-keys |
| `fireworks` | **Fireworks AI Free Starter** | `general` | `FIREWORKS_API_KEY` | `accounts/fireworks/models/deepseek-v3` | **ADMITTED (`general` Starter Credit)** | https://fireworks.ai/account/api-keys |
| `together` | **Together AI Free Tier** | `general` | `TOGETHER_API_KEY` | `meta-llama/Llama-3.3-70B-Instruct-Turbo-Free` | **ADMITTED (`general` Free Models)** | https://api.together.ai/settings/api-keys |

---

## 2. Routing & Isolation Invariants

1. **Cross-Lane Firewall:** `eu` (`safe`) requests route exclusively across `mistral`, `codestral`, `ovhcloud-eu` (and conditional `scaleway-paris`), falling back to deterministic Replay if unconfigured or throttled: never crossing into `general`.
2. **Homepage Live Telemetry:** `GET /api/providers/status` surfaces `LIVE` vs `FALLBACK` state per provider without exposing secret material.
3. **Pinned Model IDs (H7) & `:free` Guard:** Wildcard tags (`:latest`, `auto`, `default`) and non-`:free` OpenRouter slugs are rejected pre-socket by `assertProviderPermitted()`.
4. **JSON Repair-Once (H6):** Structured outputs execute at most one repair call on the same lane before failing closed to Replay.
