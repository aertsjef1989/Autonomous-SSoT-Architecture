import { enforcePreDispatchGate, normalizeLane, type Lane, type LaneInput } from '../lane-guard';
import {
  assertProviderPermitted,
  DEFAULT_PROVIDER_REGISTRY,
  isProviderConfiguredAndEnabled,
  type ProviderConfig,
} from './registry';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmDispatchOptions {
  lane?: LaneInput;
  preferredProviderId?: string;
  mode?: string;
  messages: LlmMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  registryOverride?: readonly ProviderConfig[];
  envOverride?: NodeJS.ProcessEnv;
}

export interface LlmDispatchResult {
  ok: boolean;
  replay: boolean;
  lane: Lane;
  providerId: string | null;
  pinnedModelId: string | null;
  content: string;
  usedTokensWeighted: number;
  fallbackReason?: string;
  attemptedProviders: string[];
}

interface ProviderRuntimeMetrics {
  minuteWindowStartMs: number;
  minuteHits: number;
  utcDay: string;
  dayHits: number;
  consecutiveErrors: number;
  circuitOpenUntilMs: number;
}

const globalRouterMetrics = globalThis as unknown as {
  __balaerionProviderMetrics?: Map<string, ProviderRuntimeMetrics>;
};

function getMetricsMap(): Map<string, ProviderRuntimeMetrics> {
  if (!globalRouterMetrics.__balaerionProviderMetrics) {
    globalRouterMetrics.__balaerionProviderMetrics = new Map();
  }
  return globalRouterMetrics.__balaerionProviderMetrics;
}

export function resetRouterMetricsForTests(): void {
  getMetricsMap().clear();
}

function checkProviderQuotaAndCircuit(cfg: ProviderConfig, nowMs = Date.now()): { ok: boolean; reason?: string } {
  const map = getMetricsMap();
  const utcDay = new Date(nowMs).toISOString().slice(0, 10);
  let m = map.get(cfg.id);
  if (!m) {
    m = {
      minuteWindowStartMs: nowMs,
      minuteHits: 0,
      utcDay,
      dayHits: 0,
      consecutiveErrors: 0,
      circuitOpenUntilMs: 0,
    };
    map.set(cfg.id, m);
  }
  if (m.circuitOpenUntilMs > nowMs) {
    return { ok: false, reason: `CIRCUIT_OPEN(${cfg.id})` };
  }
  if (nowMs - m.minuteWindowStartMs >= 60_000) {
    m.minuteWindowStartMs = nowMs;
    m.minuteHits = 0;
  }
  if (m.utcDay !== utcDay) {
    m.utcDay = utcDay;
    m.dayHits = 0;
  }
  if (m.minuteHits + 1 > cfg.maxRpm) {
    return { ok: false, reason: `LOCAL_RPM_CAP(${cfg.id})` };
  }
  if (m.dayHits + 1 > cfg.maxRpd) {
    return { ok: false, reason: `LOCAL_RPD_CAP(${cfg.id})` };
  }
  m.minuteHits += 1;
  m.dayHits += 1;
  return { ok: true };
}

function recordProviderOutcome(cfg: ProviderConfig, status: number, ok: boolean, nowMs = Date.now()): void {
  const m = getMetricsMap().get(cfg.id);
  if (!m) return;
  if (ok) {
    m.consecutiveErrors = 0;
    m.circuitOpenUntilMs = 0;
    return;
  }
  m.consecutiveErrors += 1;
  // Open 60s circuit immediately on 429/402, or after 2 consecutive 5xx/network timeouts
  if (status === 429 || status === 402 || m.consecutiveErrors >= 2) {
    m.circuitOpenUntilMs = nowMs + 60_000;
  }
}

export function buildDeterministicReplayContent(mode: string, lane: Lane, userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('dmadv') || lower.includes('ssot')) {
    return `[REPLAY | mode=${mode} | lane=${lane}] SSoT governance enforces owner assignment (BR-02), explicit human approval before publish (FR-C01), and a 14-day escalation / 30-day auto-archive verification cadence across 3,000+ nodes and 40+ markets.`;
  }
  if (lower.includes('readiness') || lower.includes('balaerion') || lower.includes('prospect')) {
    return `[REPLAY | mode=${mode} | lane=${lane}] Balaerion evaluates synthetic entity readiness on a 0-10 rubric and holds lifecycle transitions behind a mandatory human-in-the-loop gate.`;
  }
  if (lower.includes('syndicate') || lower.includes('xg') || lower.includes('kelly')) {
    return `[REPLAY | mode=${mode} | lane=${lane}] Syndicate compares Poisson xG fair probabilities against market implied odds and caps fractional Kelly sizing inside pool NAV drawdown rules.`;
  }
  return `[REPLAY | mode=${mode} | lane=${lane}] Live free-tier providers on lane "${lane}" are unconfigured or throttled. Serving deterministic synthetic Replay response at zero token cost.`;
}

async function callSingleProvider(
  cfg: ProviderConfig,
  messages: LlmMessage[],
  maxOutputTokens: number,
  temperature: number,
  env: NodeJS.ProcessEnv
): Promise<{ ok: true; text: string; totalTokens: number } | { ok: false; status: number; reason: string }> {
  assertProviderPermitted(cfg);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    if (cfg.protocol === 'cloudflare_workers_ai') {
      const token = cfg.apiKeyEnvVar ? env[cfg.apiKeyEnvVar] || '' : '';
      const accountId = cfg.accountIdEnvVar ? env[cfg.accountIdEnvVar] || '' : '';
      const url = cfg.endpointUrl.replace('{ACCOUNT_ID}', encodeURIComponent(accountId));
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: maxOutputTokens,
          temperature,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        return { ok: false, status: resp.status, reason: `HTTP_${resp.status}(${cfg.id})` };
      }
      const data = (await resp.json()) as {
        result?: { response?: string; usage?: { total_tokens?: number } };
      };
      const text = (data?.result?.response ?? '').trim();
      if (!text) return { ok: false, status: 502, reason: `EMPTY_OUTPUT(${cfg.id})` };
      const estTokens = data?.result?.usage?.total_tokens ?? Math.ceil((JSON.stringify(messages).length + text.length) / 3.5);
      return { ok: true, text, totalTokens: estTokens };
    }

    // OpenAI-compatible chat/completions protocol (OVHcloud EU, Groq, Cerebras, OpenRouter :free, Scaleway, Mistral)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const keyVal = cfg.apiKeyEnvVar ? (env[cfg.apiKeyEnvVar] || (cfg.apiKeyEnvVar === 'OPENROUTER_FREE_API_KEY' ? env.OPENROUTER_API_KEY : '') || '') : '';
    if (keyVal) {
      headers.Authorization = `Bearer ${keyVal}`;
    }

    const resp = await fetch(cfg.endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.pinnedModelId,
        messages,
        max_tokens: maxOutputTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      return { ok: false, status: resp.status, reason: `HTTP_${resp.status}(${cfg.id})` };
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const text = (json?.choices?.[0]?.message?.content ?? '').trim();
    if (!text) {
      return { ok: false, status: 502, reason: `EMPTY_OUTPUT(${cfg.id})` };
    }
    const estTokens = json?.usage?.total_tokens ?? Math.ceil((JSON.stringify(messages).length + text.length) / 3.5);
    return { ok: true, text, totalTokens: estTokens };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return { ok: false, status: 504, reason: isAbort ? `TIMEOUT(${cfg.id})` : `NETWORK_ERROR(${cfg.id})` };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Dispatches an LLM request strictly within a single lane (`safe`/`eu` default, or `general`).
 * Invariants:
 *  - Runs assertProviderPermitted() on every candidate in the registry before filtering (blocks 1.1 & H7 violations).
 *  - Runs enforcePreDispatchGate() before touching any provider.
 *  - NEVER crosses from `safe` (`eu`) to `general`, or from `general` to `safe`.
 *  - Fails over across configured providers in the SAME lane on 429/5xx/timeout, then falls back cleanly to Replay.
 */
export async function dispatchLlmRequest(opts: LlmDispatchOptions): Promise<LlmDispatchResult> {
  const env = opts.envOverride ?? process.env;
  const registry = opts.registryOverride ?? DEFAULT_PROVIDER_REGISTRY;
  // Validate every entry in registry upfront so any forbidden provider/model throws loudly (Rule 2.10)
  for (const entry of registry) {
    assertProviderPermitted(entry);
  }

  const laneInput: LaneInput = opts.lane ?? 'eu';
  const lane: Lane = normalizeLane(laneInput, 'safe');
  const mode = opts.mode ?? 'general';
  const maxOutputTokens = Math.max(64, Math.min(opts.maxOutputTokens ?? 700, 2048));
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;

  const combinedText = opts.messages.map((m) => m.content).join('\n');
  const defaultProviderForGate =
    opts.preferredProviderId ?? (lane === 'safe' ? 'ovhcloud-eu' : 'groq');
  const preGate = enforcePreDispatchGate(laneInput, defaultProviderForGate, combinedText);
  if (!preGate.allowed) {
    return {
      ok: false,
      replay: false,
      lane,
      providerId: null,
      pinnedModelId: null,
      content: '',
      usedTokensWeighted: 0,
      fallbackReason: preGate.reason,
      attemptedProviders: [],
    };
  }

  // Strictly filter candidates to the requested lane ONLY (zero cross-lane leakage)
  const sameLaneCandidates = registry.filter(
    (c) => c.lane === lane && isProviderConfiguredAndEnabled(c, env)
  );

  // Order preferred provider first if present in sameLaneCandidates
  const ordered = opts.preferredProviderId
    ? [
        ...sameLaneCandidates.filter((c) => c.id === opts.preferredProviderId),
        ...sameLaneCandidates.filter((c) => c.id !== opts.preferredProviderId),
      ]
    : sameLaneCandidates;

  const attempted: string[] = [];
  const failureReasons: string[] = [];

  for (const candidate of ordered) {
    const quota = checkProviderQuotaAndCircuit(candidate);
    if (!quota.ok) {
      failureReasons.push(quota.reason || `QUOTA_SKIP(${candidate.id})`);
      continue;
    }

    attempted.push(candidate.id);
    const res = await callSingleProvider(candidate, opts.messages, maxOutputTokens, temperature, env);
    if (res.ok) {
      recordProviderOutcome(candidate, 200, true);
      const weighted = Math.max(1, Math.ceil(res.totalTokens * candidate.weightMultiplier));
      return {
        ok: true,
        replay: false,
        lane,
        providerId: candidate.id,
        pinnedModelId: candidate.pinnedModelId,
        content: res.text,
        usedTokensWeighted: weighted,
        attemptedProviders: attempted,
      };
    }

    recordProviderOutcome(candidate, res.status, false);
    failureReasons.push(res.reason);
  }

  const lastUserMsg = [...opts.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const reason =
    failureReasons.length > 0
      ? failureReasons.join('; ')
      : `NO_ENABLED_PROVIDER_IN_LANE(${lane})`;

  return {
    ok: true,
    replay: true,
    lane,
    providerId: null,
    pinnedModelId: null,
    content: buildDeterministicReplayContent(mode, lane, lastUserMsg),
    usedTokensWeighted: 0,
    fallbackReason: reason,
    attemptedProviders: attempted,
  };
}

export function extractJsonSubstring(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  if (fenced) return fenced[1].trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

/**
 * Section H6: Structured JSON validation with repair-once semantics.
 * Attempts direct parse + validation; on failure, invokes `repairCall` AT MOST ONCE.
 * Never enters an unbounded retry loop.
 */
export async function parseAndRepairJsonOnce<T>(
  initialText: string,
  validate: (parsed: unknown) => { valid: true; value: T } | { valid: false; error: string },
  repairCall: (brokenOutput: string, validationError: string) => Promise<{ ok: boolean; replay?: boolean; content: string }>
): Promise<
  | { ok: true; value: T; repaired: boolean; repairAttempts: number }
  | { ok: false; error: string; repairAttempts: number }
> {
  const tryParseAndValidate = (raw: string): { ok: true; value: T } | { ok: false; error: string } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonSubstring(raw));
    } catch (e) {
      return { ok: false, error: `JSON_PARSE_ERROR: ${e instanceof Error ? e.message : 'invalid JSON'}` };
    }
    const v = validate(parsed);
    if (!v.valid) return { ok: false, error: v.error };
    return { ok: true, value: v.value };
  };

  const first = tryParseAndValidate(initialText);
  if (first.ok) {
    return { ok: true, value: first.value, repaired: false, repairAttempts: 0 };
  }

  // H6: Bounded single repair attempt (repairAttempts = 1 max)
  const repairRes = await repairCall(initialText.slice(0, 3000), first.error);
  if (!repairRes.ok || repairRes.replay || !repairRes.content) {
    return { ok: false, error: `JSON_REPAIR_UNAVAILABLE (${first.error})`, repairAttempts: 1 };
  }

  const second = tryParseAndValidate(repairRes.content);
  if (second.ok) {
    return { ok: true, value: second.value, repaired: true, repairAttempts: 1 };
  }

  return { ok: false, error: `JSON_REPAIR_EXHAUSTED (${second.error})`, repairAttempts: 1 };
}
