export const MODEL_GROUPS = [
  {
    tier: "⚡ Ultra-Fast Lane",
    models: [
      { key: "cerebras-qwen", label: "Cerebras · Qwen 3.8 27B" },
      { key: "groq-llama", label: "Groq · Llama 3.3 70B" },
      { key: "groq-qwen", label: "Groq · Qwen 3 32B" }
    ]
  },
  {
    tier: "🧠 Deep Reasoning Lane",
    models: [
      { key: "nvidia-deepseek", label: "NVIDIA NIM · DeepSeek V4 Flash" },
      { key: "nvidia-kimi", label: "NVIDIA NIM · Kimi K2.6" },
      { key: "nvidia-qwen", label: "NVIDIA NIM · Qwen 3 235B" },
      { key: "groq-gpt-oss", label: "Groq · GPT-OSS 120B" }
    ]
  },
  {
    tier: "🇪🇺 EU / Sovereign Lane",
    models: [
      { key: "mistral-small", label: "Mistral · Small Latest" }
    ]
  },
  {
    tier: "🛡️ Frontier & Auto-Fallback",
    models: [
      { key: "gemini-flash", label: "Google · Gemini 2.5 Flash" },
      { key: "openrouter-free", label: "OpenRouter · Auto Free" }
    ]
  }
];

export const MODELS = {
  "cerebras-qwen": {
    provider: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    env: "CEREBRAS_API_KEY",
    model: "qwen-3.8-27b"
  },
  "groq-llama": {
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    env: "GROQ_API_KEY",
    model: "llama-3.3-70b-versatile"
  },
  "groq-qwen": {
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    env: "GROQ_API_KEY",
    model: "qwen/qwen3-32b"
  },
  "groq-gpt-oss": {
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    env: "GROQ_API_KEY",
    model: "openai/gpt-oss-120b"
  },
  "nvidia-deepseek": {
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    env: "NVIDIA_API_KEY",
    model: "deepseek-ai/deepseek-v4-flash"
  },
  "nvidia-kimi": {
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    env: "NVIDIA_API_KEY",
    model: "moonshotai/kimi-k2.6"
  },
  "nvidia-qwen": {
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    env: "NVIDIA_API_KEY",
    model: "qwen/qwen3-235b-a22b"
  },
  "mistral-small": {
    provider: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    env: "MISTRAL_API_KEY",
    model: "mistral-small-latest"
  },
  "gemini-flash": {
    provider: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    env: "GEMINI_API_KEY",
    model: "gemini-2.5-flash"
  },
  "openrouter-free": {
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    env: "OPENROUTER_API_KEY",
    model: "openrouter/free"
  }
};

export async function callLLM({ modelKey = "groq-llama", systemPrompt, userPrompt }) {
  const cfg = MODELS[modelKey] || MODELS["groq-llama"];
  const apiKey = process.env[cfg.env];

  if (!apiKey) {
    return {
      live: false,
      provider: cfg.provider,
      model: cfg.model,
      reason: `${cfg.env} not set yet in Vercel; running in deterministic fallback mode.`,
      content: null
    };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { live: false, provider: cfg.provider, model: cfg.model, reason: `HTTP ${res.status}: ${errText.slice(0, 140)}`, content: null };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || null;
    return { live: Boolean(content), provider: cfg.provider, model: cfg.model, content };
  } catch (err) {
    return { live: false, provider: cfg.provider, model: cfg.model, reason: `Request failed: ${err.message}`, content: null };
  }
}
