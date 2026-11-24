# Free API Keys Setup Guide (Vercel Deployment)

Add these keys **at the very end** inside **Vercel → Project Settings → Environment Variables** (select Production, Preview, and Development), then redeploy. Any key you skip automatically falls back to deterministic mode without breaking the app.

---

## 1. NVIDIA NIM (`NVIDIA_API_KEY`) — DeepSeek, Qwen & Kimi
1. Go to [build.nvidia.com](https://build.nvidia.com) and sign in (free account, no credit card).
2. Click any model (e.g., DeepSeek or Qwen) and click **Get API Key** (or **API Keys** in your profile menu).
3. Copy the `nvapi-...` key and save it as `NVIDIA_API_KEY`.

## 2. Groq (`GROQ_API_KEY`) — Llama 3.3, Qwen 3 & GPT-OSS 120B
1. Go to [console.groq.com](https://console.groq.com) and sign in with GitHub or Google.
2. Open **API Keys** in the left sidebar → **Create API Key**.
3. Copy the `gsk_...` key and save it as `GROQ_API_KEY`.

## 3. Cerebras (`CEREBRAS_API_KEY`) — Ultra-Fast Qwen 3.8
1. Go to [cloud.cerebras.ai](https://cloud.cerebras.ai) and sign in (free tier, no credit card).
2. Open **API Keys** → **Create API Key**.
3. Copy the key and save it as `CEREBRAS_API_KEY`.

## 4. Mistral (`MISTRAL_API_KEY`) — EU / Sovereign Lane
1. Go to [console.mistral.ai](https://console.mistral.ai) and sign in.
2. Under **Billing / Workspace**, activate the free **Experiment** plan (phone verification, no credit card).
3. Open **API Keys** → **Create new key** and save it as `MISTRAL_API_KEY`.

## 5. Google AI Studio (`GEMINI_API_KEY`) — Gemini 2.5 Flash
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Click **Create API key** → copy the `AIza...` key and save it as `GEMINI_API_KEY`.

## 6. OpenRouter (`OPENROUTER_API_KEY`) — Auto-Fallback `:free` Pool
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and sign in.
2. Click **Create Key**, copy the `sk-or-...` key, and save it as `OPENROUTER_API_KEY`.
3. *(Optional)* In OpenRouter **Privacy Settings**, toggle off providers that train on prompts.

---

## Final Verification on Vercel
1. Redeploy your Vercel project after saving the environment variables.
2. Open your Vercel homepage (`/`) — the **CONFIGURED LLM PROVIDERS** bar at the bottom will flip from `FALLBACK` to `LIVE` for each key you added.
