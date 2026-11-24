export type Lane = 'safe' | 'general';

export const ALLOWED_PROVIDERS: Record<Lane, readonly string[]> = {
  // EU Zero-Retention only — zero fallback to general providers
  safe: ['mistral-eu', 'scaleway-paris'] as const,
  general: ['groq', 'gemini', 'deepseek', 'openrouter'] as const,
};

const PII_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'EU VAT / KBO Number', regex: /\b(BE|NL|DE|FR|ES|IT|PT)\s?0?\d{3}[.\s]?\d{3}[.\s]?\d{3}\b/i },
  { label: 'IBAN', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/ },
  { label: 'Email Address', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
];

export interface LaneCheckResult {
  allowed: boolean;
  reason?: string;
}

export function enforcePreDispatchGate(
  lane: Lane,
  provider: string,
  prompt: string
): LaneCheckResult {
  // 1. Enforce provider-to-lane lock (no fallback from safe -> general)
  if (!ALLOWED_PROVIDERS[lane].includes(provider)) {
    return {
      allowed: false,
      reason: `LANE VIOLATION: Provider "${provider}" is not permitted on lane "${lane}".`,
    };
  }

  // 2. Block unmasked client PII from leaving on lane: general
  if (lane === 'general') {
    for (const rule of PII_PATTERNS) {
      if (rule.regex.test(prompt)) {
        return {
          allowed: false,
          reason: `PII GATE BLOCKED: Detected unmasked ${rule.label} on lane "general". Route through lane "safe" (EU Zero-Retention).`,
        };
      }
    }
  }

  return { allowed: true };
}
