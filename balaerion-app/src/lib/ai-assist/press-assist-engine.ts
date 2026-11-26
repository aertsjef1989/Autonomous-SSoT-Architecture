import { enforcePreDispatchGate, normalizeLane, type LaneInput } from '../lane-guard';
import {
  dispatchLlmRequest,
  parseAndRepairJsonOnce,
  type LlmDispatchOptions,
} from '../llm/router';
import type { PressBlock, PressBlockType, PressLanguage } from '../press/schema';

export type PressAssistAction = 'draft' | 'tighten' | 'translate' | 'critic';

export interface PressAssistInput {
  action: PressAssistAction;
  consentConfirmed: boolean;
  lane?: LaneInput;
  targetLocale?: PressLanguage;
  blockType?: Extract<PressBlockType, 'paragraph' | 'bullets' | 'callout'>;
  sourceId?: string;
  briefOrText: string;
  docTitle?: string;
  audience?: 'internal' | 'client';
  routerOverrides?: Pick<LlmDispatchOptions, 'registryOverride' | 'envOverride'>;
}

export interface CriticIssue {
  code: string;
  severity: 'high' | 'medium';
  message: string;
  fixSuggestion: string;
}

export interface PressAssistOutput {
  ok: boolean;
  replay: boolean;
  action: PressAssistAction;
  lane: 'safe' | 'general';
  providerId: string | null;
  modelId: string | null;
  repairedJson: boolean;
  usedTokensWeighted: number;
  requiresSourceBinding: boolean;
  block?: PressBlock;
  criticReport?: {
    summary: string;
    exportReady: boolean;
    issues: CriticIssue[];
  };
  error?: string;
}

function scrubForbiddenDashes(input: string): string {
  return input.replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/,\s*,/g, ',').trim();
}

function containsNumericClaim(text: string): boolean {
  const scrubbed = text.replace(/\b30(?:-|\s+)minute[s]?\b/gi, '');
  return /(?:\b\d+(?:[.,]\d+)?\s*%|\b(?:EUR|USD|GBP|€|\$)\s*\d+|\b\d+(?:[.,]\d+)?\s*\/\s*10\b|\b\d{2,}(?:,\d{3})+\b)/i.test(
    scrubbed
  );
}

export function buildReplayAssistOutput(input: PressAssistInput): PressAssistOutput {
  const lane = normalizeLane(input.lane ?? 'eu', 'safe');
  const cleanSource = input.sourceId?.trim() || undefined;
  const baseId = `blk-ai-${Date.now().toString(36)}`;

  if (input.action === 'critic') {
    const hasNum = containsNumericClaim(input.briefOrText);
    const hasDash = /[\u2014\u2013]/.test(input.briefOrText);
    const issues: CriticIssue[] = [];
    if (hasNum && !cleanSource) {
      issues.push({
        code: 'LINT_UNSOURCED_FIGURE',
        severity: 'high',
        message: 'Detected a quantitative claim without an attached source_id.',
        fixSuggestion: 'Bind a verified or reported source_id in the block header before exporting.',
      });
    }
    if (hasDash) {
      issues.push({
        code: 'LINT_DASH_TYPOGRAPHY',
        severity: 'medium',
        message: 'Detected forbidden em or en dash punctuation.',
        fixSuggestion: 'Run Auto-Fix Dashes or replace with a colon or comma.',
      });
    }
    if (issues.length === 0) {
      issues.push({
        code: 'ADVISORY_CLARITY_CHECK',
        severity: 'medium',
        message: 'Confirm client-facing verbs keep advisory ownership on the advertiser team.',
        fixSuggestion: 'State what the client team executes directly during onboarding.',
      });
    }
    return {
      ok: true,
      replay: true,
      action: 'critic',
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: false,
      criticReport: {
        summary: 'Synthetic Replay critique completed against Signal Press pre-export governance rules.',
        exportReady: issues.every((i) => i.severity !== 'high'),
        issues,
      },
    };
  }

  if (input.action === 'translate') {
    const loc = input.targetLocale ?? 'nl-BE';
    let translated = '';
    if (loc === 'nl-BE') {
      translated = scrubForbiddenDashes(
        'Vlaams advieskader (nl-BE): uw intern team behoudt volledige controle over het advertentieaccount en richt campagnes uitsluitend op provincieniveau in Vlaanderen zonder stadsradius.'
      );
    } else if (loc === 'nl-NL') {
      translated = scrubForbiddenDashes(
        'Zakelijk advieskader (nl-NL): uw eigen team beheert de campagne-instellingen rechtstreeks op provincieniveau binnen Nederland, zonder straal- of stadstargeting.'
      );
    } else if (loc === 'fr-BE') {
      translated = scrubForbiddenDashes(
        'Cadre consultatif (fr-BE): votre equipe interne conserve la gestion directe du compte tout en appliquant un ciblage provincial conforme.'
      );
    } else {
      translated = scrubForbiddenDashes(
        'Advisory framework (en-GB): your in-house team retains direct account control while applying province-level targeting.'
      );
    }
    const needsSrc = containsNumericClaim(translated) && !cleanSource;
    return {
      ok: true,
      replay: true,
      action: 'translate',
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: needsSrc,
      block: {
        id: baseId,
        type: 'paragraph',
        text: translated,
        sourceId: cleanSource,
        aiDraft: true,
      },
    };
  }

  if (input.action === 'tighten') {
    const cleaned = scrubForbiddenDashes(input.briefOrText)
      .replace(/\bvery\s+/gi, '')
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\s+/g, ' ')
      .trim();
    const textOut = cleaned || 'Operational control verified across synthetic reference nodes.';
    const needsSrc = containsNumericClaim(textOut) && !cleanSource;
    return {
      ok: true,
      replay: true,
      action: 'tighten',
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: needsSrc,
      block: {
        id: baseId,
        type: 'paragraph',
        text: textOut,
        sourceId: cleanSource,
        aiDraft: true,
      },
    };
  }

  // Default action: 'draft'
  const bType = input.blockType ?? 'callout';
  const draftText = scrubForbiddenDashes(
    `Synthetic draft for "${input.briefOrText.slice(0, 90)}": governance gates verify ownership, province-level geo rules, and human sign-off prior to publication.`
  );
  const needsSrc = containsNumericClaim(draftText) && !cleanSource;
  const block: PressBlock =
    bType === 'bullets'
      ? {
          id: baseId,
          type: 'bullets',
          items: [
            draftText,
            'Human reviewer explicitly accepts every AI-assisted block before export unlocks.',
          ],
          sourceId: cleanSource,
          aiDraft: true,
        }
      : bType === 'callout'
        ? {
            id: baseId,
            type: 'callout',
            title: 'AI-Assisted Synthetic Draft (Review Required)',
            text: draftText,
            sourceId: cleanSource,
            aiDraft: true,
          }
        : {
            id: baseId,
            type: 'paragraph',
            text: draftText,
            sourceId: cleanSource,
            aiDraft: true,
          };

  return {
    ok: true,
    replay: true,
    action: 'draft',
    lane,
    providerId: null,
    modelId: null,
    repairedJson: false,
    usedTokensWeighted: 0,
    requiresSourceBinding: needsSrc,
    block,
  };
}

export async function runPressAssistAction(input: PressAssistInput): Promise<PressAssistOutput> {
  const laneInput: LaneInput = input.lane ?? 'eu';
  const lane = normalizeLane(laneInput, 'safe');

  // F5 mandatory explicit user consent check before any dispatch
  if (input.consentConfirmed !== true) {
    return {
      ok: false,
      replay: false,
      action: input.action,
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: false,
      error: 'F5_CONSENT_REQUIRED: Confirm synthetic-only input and provider notice before calling AI Assist.',
    };
  }

  const trimmed = (input.briefOrText || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      replay: false,
      action: input.action,
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: false,
      error: 'Input brief or block text is required.',
    };
  }

  const defaultProv = lane === 'safe' ? 'ovhcloud-eu' : 'groq';
  const gate = enforcePreDispatchGate(laneInput, defaultProv, trimmed);
  if (!gate.allowed) {
    return {
      ok: false,
      replay: false,
      action: input.action,
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: false,
      error: gate.reason,
    };
  }

  const localeInstruction =
    input.action === 'translate'
      ? input.targetLocale === 'nl-BE'
        ? 'Target locale: nl-BE (Flemish Belgian Dutch formal register "uw", Belgian terminology, province-level geo only).'
        : input.targetLocale === 'nl-NL'
          ? 'Target locale: nl-NL (Northern Dutch business register, province-level geo only, zero Dutch city names or radius targeting).'
          : `Target locale: ${input.targetLocale ?? 'en-GB'}.`
      : '';

  const schemaPrompt =
    input.action === 'critic'
      ? 'Return ONLY valid JSON: {"summary": string, "exportReady": boolean, "issues": [{"code": string, "severity": "high"|"medium", "message": string, "fixSuggestion": string}]}'
      : 'Return ONLY valid JSON: {"title"?: string, "text"?: string, "items"?: string[]}. Never output em dashes or en dashes. Never invent statistics without an explicit source.';

  const dispatched = await dispatchLlmRequest({
    lane: laneInput,
    mode: `press_${input.action}`,
    messages: [
      {
        role: 'system',
        content: `You are Signal Press AI Assist (${input.action}). Audience=${input.audience ?? 'internal'}. ${localeInstruction} ${schemaPrompt}`,
      },
      { role: 'user', content: trimmed },
    ],
    maxOutputTokens: 650,
    temperature: 0.2,
    ...input.routerOverrides,
  });

  if (!dispatched.ok) {
    return {
      ok: false,
      replay: false,
      action: input.action,
      lane,
      providerId: null,
      modelId: null,
      repairedJson: false,
      usedTokensWeighted: 0,
      requiresSourceBinding: false,
      error: dispatched.fallbackReason || 'Dispatch blocked.',
    };
  }

  if (dispatched.replay) {
    return buildReplayAssistOutput(input);
  }

  if (input.action === 'critic') {
    const parsedCritic = await parseAndRepairJsonOnce(
      dispatched.content,
      (raw) => {
        if (!raw || typeof raw !== 'object') return { valid: false, error: 'Expected JSON object' };
        const o = raw as Record<string, unknown>;
        if (typeof o.summary !== 'string' || typeof o.exportReady !== 'boolean' || !Array.isArray(o.issues)) {
          return { valid: false, error: 'Missing summary, exportReady, or issues array' };
        }
        const issues: CriticIssue[] = o.issues.slice(0, 8).map((item) => {
          const it = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
          return {
            code: typeof it.code === 'string' ? it.code : 'CRITIC_NOTE',
            severity: it.severity === 'high' ? 'high' : 'medium',
            message: scrubForbiddenDashes(typeof it.message === 'string' ? it.message : 'Review section.'),
            fixSuggestion: scrubForbiddenDashes(typeof it.fixSuggestion === 'string' ? it.fixSuggestion : 'Verify manually.'),
          };
        });
        return { valid: true, value: { summary: scrubForbiddenDashes(o.summary), exportReady: o.exportReady, issues } };
      },
      async (broken, err) =>
        dispatchLlmRequest({
          lane: laneInput,
          mode: 'press_critic_repair',
          messages: [
            { role: 'system', content: schemaPrompt },
            { role: 'user', content: `Fix JSON validation error (${err}) in: ${broken}` },
          ],
          maxOutputTokens: 500,
          temperature: 0,
          ...input.routerOverrides,
        })
    );

    if (!parsedCritic.ok) {
      return buildReplayAssistOutput(input);
    }

    return {
      ok: true,
      replay: false,
      action: 'critic',
      lane,
      providerId: dispatched.providerId,
      modelId: dispatched.pinnedModelId,
      repairedJson: parsedCritic.repaired,
      usedTokensWeighted: dispatched.usedTokensWeighted,
      requiresSourceBinding: false,
      criticReport: parsedCritic.value,
    };
  }

  const parsedBlock = await parseAndRepairJsonOnce(
    dispatched.content,
    (raw) => {
      if (!raw || typeof raw !== 'object') return { valid: false, error: 'Expected JSON object' };
      const o = raw as Record<string, unknown>;
      const text = typeof o.text === 'string' ? scrubForbiddenDashes(o.text) : '';
      const title = typeof o.title === 'string' ? scrubForbiddenDashes(o.title) : undefined;
      const items = Array.isArray(o.items)
        ? o.items.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(scrubForbiddenDashes)
        : undefined;
      if (!text && (!items || items.length === 0)) {
        return { valid: false, error: 'Expected non-empty "text" or "items"' };
      }
      return { valid: true, value: { title, text, items } };
    },
    async (broken, err) =>
      dispatchLlmRequest({
        lane: laneInput,
        mode: 'press_block_repair',
        messages: [
          { role: 'system', content: schemaPrompt },
          { role: 'user', content: `Fix JSON validation error (${err}) in: ${broken}` },
        ],
        maxOutputTokens: 500,
        temperature: 0,
        ...input.routerOverrides,
      })
  );

  if (!parsedBlock.ok) {
    return buildReplayAssistOutput(input);
  }

  const cleanSource = input.sourceId?.trim() || undefined;
  const bType =
    input.action === 'draft'
      ? input.blockType ?? 'callout'
      : parsedBlock.value.items && parsedBlock.value.items.length > 0
        ? 'bullets'
        : 'paragraph';

  const combinedGeneratedText = [
    parsedBlock.value.title ?? '',
    parsedBlock.value.text ?? '',
    ...(parsedBlock.value.items ?? []),
  ].join(' ');
  const needsSource = containsNumericClaim(combinedGeneratedText) && !cleanSource;

  const newBlock: PressBlock =
    bType === 'bullets'
      ? {
          id: `blk-ai-${Date.now().toString(36)}`,
          type: 'bullets',
          items: parsedBlock.value.items?.length ? parsedBlock.value.items : [parsedBlock.value.text],
          sourceId: cleanSource,
          // I12 invariant: ALWAYS mark AI output aiDraft: true until human clicks Accept Draft!
          aiDraft: true,
        }
      : bType === 'callout'
        ? {
            id: `blk-ai-${Date.now().toString(36)}`,
            type: 'callout',
            title: parsedBlock.value.title || 'AI-Assisted Draft (Review Required)',
            text: parsedBlock.value.text || (parsedBlock.value.items ?? []).join(' '),
            sourceId: cleanSource,
            aiDraft: true,
          }
        : {
            id: `blk-ai-${Date.now().toString(36)}`,
            type: 'paragraph',
            text: parsedBlock.value.text || (parsedBlock.value.items ?? []).join(' '),
            sourceId: cleanSource,
            aiDraft: true,
          };

  return {
    ok: true,
    replay: false,
    action: input.action,
    lane,
    providerId: dispatched.providerId,
    modelId: dispatched.pinnedModelId,
    repairedJson: parsedBlock.repaired,
    usedTokensWeighted: dispatched.usedTokensWeighted,
    requiresSourceBinding: needsSource,
    block: newBlock,
  };
}
