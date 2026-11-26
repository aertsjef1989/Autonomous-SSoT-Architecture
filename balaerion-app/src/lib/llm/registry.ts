import type { Lane } from '../lane-guard';

export interface ProviderConfig {
  id: string;
  displayName: string;
  lane: Lane;
  protocol: 'openai_compat' | 'cloudflare_workers_ai';
  endpointUrl: string;
  pinnedModelId: string;
  apiKeyEnvVar: string | null;
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
 * Hard Constraint 1.1: Permanently excluded provider domains, env prefixes, and model families.
 * Any attempt to register or call these throws immediately before any network socket opens.
 */
const FORBIDDEN_HOST_PATTERNS: RegExp[] = [
  /anthropic\.com/i,
  /generativelanguage\.googleapis\.com/i,
  /aiplatform\.googleapis\.com/i,
  /aistudio\.google\.com/i,
  /(^|\.)api\.openai\.com$/i,
  /chatgpt\.com/i,
  /claude\.ai/i,
  /models\.inference\.ai\.azure\.com/i, // Retired GitHub Models endpoint
  /router\.huggingface\.co/i, // Rejected: $0.00 Free tier credits as of 2026-11-25
];

const FORBIDDEN_MODEL_PATTERNS: RegExp[] = [
  /^claude-/i,
  /^gemini-/i,
  /^gpt-4o/i,
  /^gpt-4\.1/i,
  /^o1-/i,
  /^o3-/i,
  /:latest$/i,
  /^auto$/i,
  /^default$/i,
];

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
  if (!cfg.pinnedModelId || cfg.pinnedModelId.trim().length < 3) {
    throw new Error(`H7_UNPINNED_MODEL: Provider "${cfg.id}" is missing an explicit pinned model ID.`);
  }
  for (const mPat of FORBIDDEN_MODEL_PATTERNS) {
    if (mPat.test(cfg.pinnedModelId.trim())) {
      throw new Error(
        `HARD_CONSTRAINT_1_1_OR_H7_BLOCK: Forbidden or unpinned model "${cfg.pinnedModelId}" on "${cfg.id}".`
      );
    }
  }
  if (cfg.requiresFreeModelSuffix && !cfg.pinnedModelId.endsWith(':free')) {
    throw new Error(
      `OPENROUTER_BILLING_GUARD: Provider "${cfg.id}" must pin a ":free" model slug, got "${cfg.pinnedModelId}".`
    );
  }
}

/**
 * Config-driven Free-Tier Provider Registry (X7, H1-H7).
 * Note per 1.1: A future private deployment could add a paid provider by config entry alone,
 * while assertProviderPermitted() blocks all excluded APIs in this POC.
 */
export const DEFAULT_PROVIDER_REGISTRY: readonly ProviderConfig[] = [
  {
    id: 'ovhcloud-eu',
    displayName: 'OVHcloud AI Endpoints (EU Gravelines)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    pinnedModelId: 'Mistral-Nemo-Instruct-2407',
    apiKeyEnvVar: 'OVH_AI_ENDPOINTS_KEY',
    // OVHcloud supports anonymous free 2 RPM calls OR higher free quota with OVH_AI_ENDPOINTS_KEY;
    // require explicit OVH_ENABLE_LIVE=1 or OVH_AI_ENDPOINTS_KEY so offline/CI tests never hit external endpoints unexpectedly.
    allowAnonymousWhenKeyUnset: true,
    enabledByDefault: true,
    enableFlagEnvVar: 'OVH_ENABLE_LIVE',
    weightMultiplier: 1.0,
    maxRpm: 2,
    maxRpd: 200,
    timeoutMs: 12000,
  },
  {
    id: 'scaleway-paris',
    displayName: 'Scaleway Generative APIs (EU Paris)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.scaleway.ai/v1/chat/completions',
    pinnedModelId: 'mistral-nemo-instruct-2407',
    apiKeyEnvVar: 'SCALEWAY_API_KEY',
    enabledByDefault: false,
    enableFlagEnvVar: 'ENABLE_SCALEWAY_CARD_FREE_ORG',
    weightMultiplier: 1.0,
    maxRpm: 15,
    maxRpd: 500,
    timeoutMs: 12000,
  },
  {
    id: 'mistral-eu-free',
    displayName: 'Mistral Studio Free Tier (EU, Opt-Out Required)',
    lane: 'safe',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.mistral.ai/v1/chat/completions',
    pinnedModelId: 'mistral-small-2503',
    apiKeyEnvVar: 'MISTRAL_FREE_API_KEY',
    enabledByDefault: false,
    enableFlagEnvVar: 'ENABLE_MISTRAL_TRAINING_OPTED_OUT',
    weightMultiplier: 1.0,
    maxRpm: 2,
    maxRpd: 250,
    timeoutMs: 12000,
  },
  {
    id: 'groq',
    displayName: 'GroqCloud Free Tier',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
    pinnedModelId: 'llama-3.3-70b-versatile',
    apiKeyEnvVar: 'GROQ_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 25,
    maxRpd: 900,
    timeoutMs: 10000,
  },
  {
    id: 'cerebras',
    displayName: 'Cerebras Shared Inference Free Tier',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://api.cerebras.ai/v1/chat/completions',
    pinnedModelId: 'qwen-3-32b',
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    enabledByDefault: true,
    weightMultiplier: 1.0,
    maxRpm: 25,
    maxRpd: 900,
    timeoutMs: 10000,
  },
  {
    id: 'cloudflare-workers-ai',
    displayName: 'Cloudflare Workers AI Free (10k Neurons/day, ZDR)',
    lane: 'general',
    protocol: 'cloudflare_workers_ai',
    endpointUrl: 'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct',
    pinnedModelId: '@cf/meta/llama-3.1-8b-instruct',
    apiKeyEnvVar: 'CLOUDFLARE_AI_API_TOKEN',
    accountIdEnvVar: 'CLOUDFLARE_ACCOUNT_ID',
    enabledByDefault: true,
    weightMultiplier: 0.8,
    maxRpm: 20,
    maxRpd: 350,
    timeoutMs: 12000,
  },
  {
    id: 'openrouter-free',
    displayName: 'OpenRouter Free Models (:free enforced)',
    lane: 'general',
    protocol: 'openai_compat',
    endpointUrl: 'https://openrouter.ai/api/v1/chat/completions',
    pinnedModelId: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKeyEnvVar: 'OPENROUTER_FREE_API_KEY',
    requiresFreeModelSuffix: true,
    enabledByDefault: true,
    weightMultiplier: 1.2,
    maxRpm: 10,
    maxRpd: 45, // Strictly inside OpenRouter's 50/day free-account ceiling
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

  const keyVal = cfg.apiKeyEnvVar ? (env[cfg.apiKeyEnvVar] || (cfg.apiKeyEnvVar === 'OPENROUTER_FREE_API_KEY' ? env.OPENROUTER_API_KEY : '')) : '';
  if (keyVal && keyVal.trim().length > 0) {
    return true;
  }

  if (cfg.allowAnonymousWhenKeyUnset && cfg.enableFlagEnvVar && env[cfg.enableFlagEnvVar] === '1') {
    return true;
  }

  return false;
}
