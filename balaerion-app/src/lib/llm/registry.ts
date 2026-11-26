import type { Lane } from '../lane-guard';

export interface ProviderConfig {
  id: string;
  shortName?: string;
  displayName: string;
  lane: Lane;
  protocol: 'openai_compat' | 'cloudflare_workers_ai';
  endpointUrl: string;
  pinnedModelId: string;
  supportedModels?: readonly string[];
  apiKeyEnvVar: string | null;
  fallbackApiKeyEnvVar?: string;
  accountIdEnvVar?: string;
  allowAnonymousWhenKeyUnset?: boolean;
  requiresFreeModelSuffix?: boolean;
  enabledByDefault: boolean;
  enableFlagEnvVar?: string;
  weightMultiplier: number;
  maxRpm: number;
  maxRpd: number;
  timeoutMs: number;
}

/**
 * Hard Constraint 1.1: Permanently excluded paid-only provider domains and unpinned/paid model families.
 * Note: Google AI Studio Free Tier (generativelanguage.googleapis.com with Gemini 2.5 Flash) is card-free and admitted;
 * GCP Vertex AI (aiplatform.googleapis.com) and paid Pro/Anthropic/OpenAI endpoints remain hard-blocked.
 */
const FORBIDDEN_HOST_PATTERNS: RegExp[] = [
  /anthropic\.com/i,
  /aiplatform\.googleapis\.com/i, // GCP Vertex AI requires billing account
  /(^|\.)api\.openai\.com$/i,
  /chatgpt\.com/i,
  /claude\.ai/i,
  /models\.inference\.ai\.azure\.com/i, // Retired GitHub Models endpoint
  /router\.huggingface\.co/i, // Rejected: $0.00 Free tier credits
];

const FORBIDDEN_MODEL_PATTERNS: RegExp[] = [
  /^claude-/i,
  /^gemini-.*-pro/i, // Paid/Vertex Pro tier excluded; card-free Flash models admitted
  /^gpt-4o/i,
  /^gpt-4\.1/i,
  /^o1-/i,
  /^o3-/i,
  /:latest$/i,
  /^auto$/i,
  /^default$/i,
];

export function assertModelPermitted(providerId: string, modelId: string, requiresFreeSuffix = false): void {
  if (!modelId || modelId.trim().length < 3) {
    throw new Error(`H7_UNPINNED_MODEL: Provider "${providerId}" is missing an explicit pinned model ID.`);
  }
  const clean = modelId.trim();
  for (const mPat of FORBIDDEN_MODEL_PATTERNS) {
    if (mPat.test(clean)) {
      throw new Error(
        `HARD_CONSTRAINT_1_1_OR_H7_BLOCK: Forbidden or unpinned model "${clean}" on "${providerId}".`
      );
    }
  }
  if (requiresFreeSuffix && !clean.endsWith(':free')) {
    throw new Error(
      `OPENROUTER_BILLING_GUARD: Provider "${providerId}" must pin a ":free" model slug, got "${clean}".`
    );
  }
}

export function assertProviderPermitted(cfg: ProviderConfig): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cfg.endpointUrl);
  } catch {
    throw new Error(`PROVIDER_CONFIG_INVALID: Invalid URL on provider "${cfg.id}".`);
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== '127.0.0.1' && parsedUrl.hostname !== 'localhost') {
    throw new Error(`PROVIDER_CONFIG_INVALID: Non-HTTPS upstream forbidden on provider "${cfg.id}".`);
  }
  for (const pat of FORBIDDEN_HOST_PATTERNS) {
    if (pat.test(parsedUrl.hostname) || pat.test(cfg.endpointUrl)) {
      throw new Error(
        `HARD_CONSTRAINT_1_1_BLOCK: Provider "${cfg.id}" targets excluded host "${parsedUrl.hostname}".`
      );
    }
  }
  assertModelPermitted(cfg.id, cfg.pinnedModelId, Boolean(cfg.requiresFreeModelSuffix));
  if (cfg.supportedModels) {
    for (const altModel of cfg.supportedModels) {
      assertModelPermitted(cfg.id, altModel, Boolean(cfg.requiresFreeModelSuffix));
    }
  }
}

export function resolveProviderApiKey(cfg: ProviderConfig, env: NodeJS.ProcessEnv = process.env): string {
  const primary = cfg.apiKeyEnvVar ? env[cfg.apiKeyEnvVar] || '' : '';
  if (primary && primary.trim().length > 0) return primary.trim();
  const fallback = cfg.fallbackApiKeyEnvVar ? env[cfg.fallbackApiKeyEnvVar] || '' : '';
  if (fallback && fallback.trim().length > 0) return fallback.trim();
  return '';
}

/**
 * Config-driven 12+1 Card-Free Provider Registry (Track 2 Multi-LLM Pool).
 * Safe (`eu`) lane: mistral, codestral, ovhcloud-eu (+ conditional scaleway-paris).
 * General lane: nvidia-nim, groq, cerebras, gemini, openrouter-free, cloudflare-workers-ai, cohere, fireworks, together.
 */
export const DEFAULT_PROVIDER_REGISTRY: readonly ProviderConfig[] = [
  // === EU / SOVEREIGN SAFE LANE ===
  {
    id: 'mistral',
    shortName: 'Mistral EU',
    displayName: 'Mistral AI Experiment Free (EU Sovereign)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.mistral.ai/v1/chat/completions',
    pinnedModelId: 'mistral-small-2503',
    supportedModels: ['mistral-small-2503', 'ministral-8b-2410'],
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    fallbackApiKeyEnvVar: 'MISTRAL_FREE_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 10,
    maxRpd: 500,
    timeoutMs: 12000,
  },
  {
    id: 'codestral',
    shortName: 'Codestral EU',
    displayName: 'Mistral Codestral Endpoint (EU Code & SQL)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://codestral.mistral.ai/v1/chat/completions',
    pinnedModelId: 'codestral-2501',
    supportedModels: ['codestral-2501'],
    apiKeyEnvVar: 'CODESTRAL_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 500,
    timeoutMs: 12000,
  },
  {
    id: 'ovhcloud-eu',
    shortName: 'OVHcloud EU',
    displayName: 'OVHcloud AI Endpoints (EU Gravelines)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    pinnedModelId: 'Mistral-Nemo-Instruct-2407',
    supportedModels: ['Mistral-Nemo-Instruct-2407', 'Meta-Llama-3_3-70B-Instruct'],
    apiKeyEnvVar: 'OVH_AI_ENDPOINTS_KEY',
    allowAnonymousWhenKeyUnset: true,
    enabledByDefault: true,
    enableFlagEnvVar: 'OVH_ENABLE_LIVE',
    weightMultiplier: 1.0,
    maxRpm: 12,
    maxRpd: 400,
    timeoutMs: 12000,
  },
  {
    id: 'scaleway-paris',
    shortName: 'Scaleway EU',
    displayName: 'Scaleway Generative APIs (EU Paris, Conditional)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.scaleway.ai/v1/chat/completions',
    pinnedModelId: 'mistral-nemo-instruct-2407',
    supportedModels: ['mistral-nemo-instruct-2407'],
    apiKeyEnvVar: 'SCALEWAY_API_KEY',
    enabledByDefault: false,
    enableFlagEnvVar: 'ENABLE_SCALEWAY_CARD_FREE_ORG',
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 500,
    timeoutMs: 12000,
  },

  // === GENERAL FAST / REASONING LANE ===
  {
    id: 'nvidia-nim',
    shortName: 'NVIDIA NIM',
    displayName: 'NVIDIA NIM (Qwen 3 235B / DeepSeek / Kimi)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    pinnedModelId: 'qwen/qwen3-235b-a22b',
    supportedModels: [
      'qwen/qwen3-235b-a22b',
      'deepseek-ai/deepseek-r1',
      'moonshotai/kimi-k2-instruct',
    ],
    apiKeyEnvVar: 'NVIDIA_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 30,
    maxRpd: 1000,
    timeoutMs: 14000,
  },
  {
    id: 'groq',
    shortName: 'Groq',
    displayName: 'GroqCloud (Llama 3.3 70B / Qwen 3 32B / GPT-OSS 120B)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
    pinnedModelId: 'llama-3.3-70b-versatile',
    supportedModels: [
      'llama-3.3-70b-versatile',
      'qwen/qwen3-32b',
      'openai/gpt-oss-120b',
    ],
    apiKeyEnvVar: 'GROQ_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 28,
    maxRpd: 950,
    timeoutMs: 10000,
  },
  {
    id: 'cerebras',
    shortName: 'Cerebras',
    displayName: 'Cerebras Inference (Ultra-Fast Qwen 3 32B)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.cerebras.ai/v1/chat/completions',
    pinnedModelId: 'qwen-3-32b',
    supportedModels: ['qwen-3-32b', 'llama-3.3-70b'],
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 28,
    maxRpd: 950,
    timeoutMs: 10000,
  },
  {
    id: 'gemini',
    shortName: 'Gemini 2.5',
    displayName: 'Google AI Studio Free (Gemini 2.5 Flash)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    pinnedModelId: 'gemini-2.5-flash',
    supportedModels: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    apiKeyEnvVar: 'GEMINI_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 500,
    timeoutMs: 12000,
  },
  {
    id: 'openrouter-free',
    shortName: 'OpenRouter :free',
    displayName: 'OpenRouter Auto-Fallback (:free Pool)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://openrouter.ai/api/v1/chat/completions',
    pinnedModelId: 'meta-llama/llama-3.3-70b-instruct:free',
    supportedModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen3-235b-a22b:free',
      'deepseek/deepseek-chat-v3-0324:free',
    ],
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    fallbackApiKeyEnvVar: 'OPENROUTER_FREE_API_KEY',
    requiresFreeModelSuffix: true,
    enabledByDefault: true,
    weightMultiplier: 1.2,
    maxRpm: 10,
    maxRpd: 45, // Strictly inside OpenRouter's 50/day free-account ceiling
    timeoutMs: 14000,
  },
  {
    id: 'cloudflare-workers-ai',
    shortName: 'Workers AI',
    displayName: 'Cloudflare Workers AI Free (10k Neurons/day, ZDR)',
    lane: 'general',
    protocol: 'cloudflare_workers_ai',
    endpointUrl: 'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct',
    pinnedModelId: '@cf/meta/llama-3.1-8b-instruct',
    supportedModels: ['@cf/meta/llama-3.1-8b-instruct', '@cf/qwen/qwen2.5-coder-32b-instruct'],
    apiKeyEnvVar: 'CLOUDFLARE_AI_API_TOKEN',
    accountIdEnvVar: 'CLOUDFLARE_ACCOUNT_ID',
    enabledByDefault: true,
    weightMultiplier: 0.8,
    maxRpm: 20,
    maxRpd: 350,
    timeoutMs: 12000,
  },
  {
    id: 'cohere',
    shortName: 'Cohere',
    displayName: 'Cohere Trial Key (Command A)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.cohere.ai/compatibility/v1/chat/completions',
    pinnedModelId: 'command-a-03-2025',
    supportedModels: ['command-a-03-2025', 'command-r7b-12-2024'],
    apiKeyEnvVar: 'COHERE_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 18,
    maxRpd: 300,
    timeoutMs: 12000,
  },
  {
    id: 'fireworks',
    shortName: 'Fireworks',
    displayName: 'Fireworks AI Free Starter (DeepSeek V3)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    pinnedModelId: 'accounts/fireworks/models/deepseek-v3',
    supportedModels: [
      'accounts/fireworks/models/deepseek-v3',
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
    ],
    apiKeyEnvVar: 'FIREWORKS_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 300,
    timeoutMs: 14000,
  },
  {
    id: 'together',
    shortName: 'Together Free',
    displayName: 'Together AI Free Tier (Llama 3.3 70B Free)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.together.xyz/v1/chat/completions',
    pinnedModelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    supportedModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
    ],
    apiKeyEnvVar: 'TOGETHER_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 300,
    timeoutMs: 14000,
  },
] as const;

export function isProviderConfiguredAndEnabled(
  cfg: ProviderConfig,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  assertProviderPermitted(cfg);

  if (!cfg.enabledByDefault) {
    if (!cfg.enableFlagEnvVar || env[cfg.enableFlagEnvVar] !== '1') {
      return false;
    }
  }

  if (cfg.protocol === 'cloudflare_workers_ai') {
    const token = cfg.apiKeyEnvVar ? env[cfg.apiKeyEnvVar] : '';
    const acct = cfg.accountIdEnvVar ? env[cfg.accountIdEnvVar] : '';
    return Boolean(token && acct);
  }

  const keyVal = resolveProviderApiKey(cfg, env);
  if (keyVal.length > 0) {
    return true;
  }

  if (cfg.allowAnonymousWhenKeyUnset && cfg.enableFlagEnvVar && env[cfg.enableFlagEnvVar] === '1') {
    return true;
  }

  return false;
}
