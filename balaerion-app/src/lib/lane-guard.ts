export type LaneInput = 'eu' | 'safe' | 'general';
export type Lane = 'safe' | 'general';

export function normalizeLane(input: unknown, defaultLane: Lane = 'safe'): Lane {
  if (input === 'general') return 'general';
  if (input === 'eu' || input === 'safe') return 'safe';
  return defaultLane;
}

export const ALLOWED_PROVIDERS: Record<Lane, readonly string[]> = {
  // EU safe-lane only: zero fallback to general providers
  safe: ['ovhcloud-eu', 'mistral', 'mistral-eu-free', 'codestral', 'scaleway-paris'] as const,
  general: [
    'nvidia-nim',
    'groq',
    'cerebras',
    'gemini',
    'openrouter-free',
    'cloudflare-workers-ai',
    'cohere',
    'fireworks',
    'together',
  ] as const,
};

const SYNTHETIC_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'vuurtoren-atelier.example',
  'noordzee-fietsen.example',
  'atelier-lumiere.example',
  'nordic-grid.example',
]);

const PII_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'EU VAT / KBO Number', regex: /\b(BE|NL|DE|FR|ES|IT|PT)\s?0?\d{3}[.\s]?\d{3}[.\s]?\d{3}\b/i },
  { label: 'IBAN', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/ },
  { label: 'Phone Number', regex: /(?:^|\s)\+(?:31|32|33|44|49|1)[\s.-]?\d[\d\s.-]{7,13}\b/ },
];

const EMAIL_GLOBAL_REGEX = /\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;

export interface LaneCheckResult {
  allowed: boolean;
  reason?: string;
}

export function enforcePreDispatchGate(
  laneInput: LaneInput,
  provider: string,
  prompt: string
): LaneCheckResult {
  const lane = normalizeLane(laneInput);

  // 1. Enforce strict provider-to-lane lock (no fallback from safe/eu -> general, and vice versa)
  if (!ALLOWED_PROVIDERS[lane].includes(provider)) {
    return {
      allowed: false,
      reason: `LANE VIOLATION: Provider "${provider}" is not permitted on lane "${laneInput}".`,
    };
  }

  // 2. Deterministic PII & synthetic-only gate (Hard Constraint 1.2: real PII never reaches any LLM)
  for (const rule of PII_PATTERNS) {
    if (rule.regex.test(prompt)) {
      return {
        allowed: false,
        reason: `PII GATE BLOCKED: Detected unmasked ${rule.label} on lane "${laneInput}". Only synthetic data may be sent to free-tier LLMs.`,
      };
    }
  }

  const emailMatches = Array.from(prompt.matchAll(EMAIL_GLOBAL_REGEX));
  for (const m of emailMatches) {
    const domain = (m[2] || '').toLowerCase();
    const isAllowedSynthetic = domain.endsWith('.example') || SYNTHETIC_EMAIL_DOMAINS.has(domain);
    // On general lane, block ALL email addresses; on eu/safe lane, allow only explicit RFC 2606 synthetic domains
    if (lane === 'general' || !isAllowedSynthetic) {
      return {
        allowed: false,
        reason: `PII GATE BLOCKED: Detected unmasked Email Address on lane "${laneInput}". Use synthetic @example.com placeholders only.`,
      };
    }
  }

  return { allowed: true };
}
