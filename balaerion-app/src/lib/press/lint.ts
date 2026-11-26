import { PRESS_LINT_CONFIG } from './lint-config';
import { validatePressDocument, type ExportFormat, type PressBlock, type PressDocument } from './schema';

export interface LintFinding {
  code: string;
  severity: 'error';
  blockId?: string;
  message: string;
  autoFixable?: 'dashes';
}

export interface LintOptions {
  enableNlBeRulePack?: boolean;
  customEmployerTerms?: string[];
  targetFormat?: ExportFormat;
}

export interface LintReport {
  passed: boolean;
  findings: LintFinding[];
}

function collectBlockText(b: PressBlock): string {
  const parts: string[] = [];
  if (b.eyebrow) parts.push(b.eyebrow);
  if (b.title) parts.push(b.title);
  if (b.text) parts.push(b.text);
  if (b.caption) parts.push(b.caption);
  if (b.items) parts.push(...b.items);
  if (b.headers) parts.push(...b.headers);
  if (b.rows) b.rows.forEach((r) => parts.push(...r));
  if (b.kpis) b.kpis.forEach((k) => parts.push(k.label, k.value, k.note ?? ''));
  return parts.join(' ');
}

function hasNumericClaim(text: string): boolean {
  // Matches percentages, currency figures, xG, /10 scores, or explicit counts >= 10 (ignores step numbers 1. 2. 3. or "30-minute")
  const scrubbed = text.replace(/\b30(?:-|\s+)minute[s]?\b/gi, '');
  return /(?:\b\d+(?:[.,]\d+)?\s*%|\b(?:EUR|USD|GBP|€|\$)\s*\d+|\b\d+(?:[.,]\d+)?\s*\/\s*10\b|\b\d{2,}(?:,\d{3})+\b)/i.test(
    scrubbed
  );
}

export function runBlockingPreExportLint(doc: PressDocument, opts: LintOptions = {}): LintReport {
  const findings: LintFinding[] = [];

  // 0. Schema & unaccepted AI draft gate (M1, I12)
  const schemaCheck = validatePressDocument(doc);
  if (!schemaCheck.valid) {
    for (const err of schemaCheck.errors) {
      findings.push({ code: 'LINT_SCHEMA_INVALID', severity: 'error', message: err });
    }
  }

  // Allowed export target per template (I6 / I11)
  if (opts.targetFormat) {
    const allowed = PRESS_LINT_CONFIG.allowedExportsByTemplate[doc.meta.templateId];
    if (allowed && !allowed.includes(opts.targetFormat)) {
      findings.push({
        code: 'LINT_EXPORT_DISALLOWED',
        severity: 'error',
        message: `Template "${doc.meta.templateId}" (${doc.meta.audience}) disallows "${opts.targetFormat}" export. Client-facing materials export via inline Email HTML, DOCX, or Markdown rather than PDF attachments.`,
      });
    }
    if (doc.meta.audience === 'client' && (opts.targetFormat === 'pdf_dark' || opts.targetFormat === 'pdf_light')) {
      findings.push({
        code: 'LINT_CLIENT_NO_PDF',
        severity: 'error',
        message: 'Client-facing documents cannot be exported as PDF attachments (I11 / I13). Use Email-Body HTML or DOCX.',
      });
    }
  }

  const validSourceIds = new Set(doc.sources.map((s) => s.id));
  const customPatterns = (opts.customEmployerTerms ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
  const employerMatchers = [...PRESS_LINT_CONFIG.employerPatterns, ...customPatterns];

  const headingTexts: string[] = [];

  // Check metadata title/subtitle for dashes and employer names too
  const metaText = `${doc.meta.title} ${doc.meta.subtitle ?? ''}`;
  if (/[\u2014\u2013]/.test(metaText)) {
    findings.push({
      code: 'LINT_DASH_TYPOGRAPHY',
      severity: 'error',
      message: 'Metadata title or subtitle contains an em dash or en dash (Rule 2.8 / I13). Use Auto-Fix Dashes.',
      autoFixable: 'dashes',
    });
  }
  for (const pat of employerMatchers) {
    const m = pat.exec(metaText);
    if (m) {
      findings.push({
        code: 'LINT_EMPLOYER_NAME',
        severity: 'error',
        message: `Flagged employer or restricted brand name "${m[0]}" in document metadata.`,
      });
    }
  }

  for (const block of doc.blocks) {
    if (block.aiDraft) {
      findings.push({
        code: 'LINT_UNACCEPTED_AI_DRAFT',
        severity: 'error',
        blockId: block.id,
        message: 'Unaccepted AI draft block must be reviewed and explicitly accepted before export (I12).',
      });
    }

    if (block.type === 'heading' && block.text?.trim()) {
      headingTexts.push(block.text.trim());
    }

    // Empty content block check (I13)
    if (
      (block.type === 'heading' || block.type === 'paragraph' || block.type === 'callout' || block.type === 'quote') &&
      (!block.text || !block.text.trim())
    ) {
      findings.push({
        code: 'LINT_EMPTY_SECTION',
        severity: 'error',
        blockId: block.id,
        message: `Block (${block.type}) is empty. Fill or remove empty blocks before export.`,
      });
    }
    if ((block.type === 'bullets' || block.type === 'numbered') && (!block.items || block.items.every((x) => !x.trim()))) {
      findings.push({
        code: 'LINT_EMPTY_SECTION',
        severity: 'error',
        blockId: block.id,
        message: `List block (${block.type}) has no non-empty items.`,
      });
    }

    const fullText = collectBlockText(block);

    // 1. Employer names
    for (const pat of employerMatchers) {
      const m = pat.exec(fullText);
      if (m) {
        findings.push({
          code: 'LINT_EMPLOYER_NAME',
          severity: 'error',
          blockId: block.id,
          message: `Flagged employer or restricted name "${m[0]}" in block.`,
        });
      }
    }

    // 2. Em and en dashes
    if (/[\u2014\u2013]/.test(fullText)) {
      findings.push({
        code: 'LINT_DASH_TYPOGRAPHY',
        severity: 'error',
        blockId: block.id,
        message: 'Em dash or en dash detected (I13). Click "Auto-Fix Dashes" to normalize punctuation.',
        autoFixable: 'dashes',
      });
    }

    // 3. Budget or daily ad spend in intro/outreach/one-pager templates
    if (PRESS_LINT_CONFIG.outreachDocTypes.includes(doc.meta.docType) || doc.meta.audience === 'client') {
      for (const pat of PRESS_LINT_CONFIG.outreachBudgetPatterns) {
        if (pat.test(fullText)) {
          findings.push({
            code: 'LINT_OUTREACH_BUDGET',
            severity: 'error',
            blockId: block.id,
            message: 'Daily ad spend or budget minimums are prohibited in intro, one-pager, or client outreach documents (I13).',
          });
          break;
        }
      }
    }

    // 4. Discovery call length other than 30 minutes
    const callMatches = Array.from(fullText.matchAll(/\b(\d+)\s*(?:-|\s)?\s*(?:min(?:ute)?s?)\s+discovery\s+(?:call|session|meeting)\b/gi));
    for (const cm of callMatches) {
      if (cm[1] !== '30') {
        findings.push({
          code: 'LINT_DISCOVERY_DURATION',
          severity: 'error',
          blockId: block.id,
          message: `Discovery call duration "${cm[0]}" must be exactly 30 minutes (I13).`,
        });
      }
    }
    const revCallMatches = Array.from(fullText.matchAll(/\bdiscovery\s+(?:call|session|meeting)\s+(?:of\s+|lasting\s+)?(\d+)\s*(?:min(?:ute)?s?)\b/gi));
    for (const cm of revCallMatches) {
      if (cm[1] !== '30') {
        findings.push({
          code: 'LINT_DISCOVERY_DURATION',
          severity: 'error',
          blockId: block.id,
          message: `Discovery call duration "${cm[0]}" must be exactly 30 minutes (I13).`,
        });
      }
    }

    // 5. Real advertiser, contact email, or non-synthetic domain in generic templates
    const emailMatches = Array.from(fullText.matchAll(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi));
    for (const em of emailMatches) {
      const dom = em[1].toLowerCase();
      if (!dom.endsWith('.example') && !PRESS_LINT_CONFIG.allowedSyntheticDomains.includes(dom)) {
        findings.push({
          code: 'LINT_REAL_CONTACT_OR_DOMAIN',
          severity: 'error',
          blockId: block.id,
          message: `Non-synthetic email domain "${em[0]}" detected in template. Use *.example domains for generic templates (C5 / I13).`,
        });
      }
    }
    const domainMatches = Array.from(fullText.matchAll(/\bhttps?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?:\/|\b)/gi));
    for (const dm of domainMatches) {
      const dom = dm[1].toLowerCase();
      if (!dom.endsWith('.example') && !PRESS_LINT_CONFIG.allowedSyntheticDomains.includes(dom)) {
        findings.push({
          code: 'LINT_REAL_CONTACT_OR_DOMAIN',
          severity: 'error',
          blockId: block.id,
          message: `External domain "${dom}" detected in generic template. Use synthetic *.example URLs (C5 / I13).`,
        });
      }
    }

    // 6. Client-facing doc rules: internal reasoning, agency tooling, client comparisons, send-PDF prompts
    if (doc.meta.audience === 'client') {
      for (const pat of PRESS_LINT_CONFIG.clientInternalKeywords) {
        if (pat.test(fullText)) {
          findings.push({
            code: 'LINT_CLIENT_INTERNAL_REASONING',
            severity: 'error',
            blockId: block.id,
            message: 'Client-facing document contains internal reasoning or commercial margin terminology (I13).',
          });
          break;
        }
      }
      for (const pat of PRESS_LINT_CONFIG.clientAgencyToolingKeywords) {
        if (pat.test(fullText)) {
          findings.push({
            code: 'LINT_CLIENT_AGENCY_TOOLING',
            severity: 'error',
            blockId: block.id,
            message: 'Client-facing document references internal agency/OSINT tooling (I13).',
          });
          break;
        }
      }
      for (const pat of PRESS_LINT_CONFIG.clientComparisonKeywords) {
        if (pat.test(fullText)) {
          findings.push({
            code: 'LINT_CLIENT_COMPARISON',
            severity: 'error',
            blockId: block.id,
            message: 'Client-facing document compares the recipient against other clients or competitors (I13).',
          });
          break;
        }
      }
      for (const pat of PRESS_LINT_CONFIG.clientSendPdfPrompts) {
        if (pat.test(fullText)) {
          findings.push({
            code: 'LINT_CLIENT_SEND_PDF',
            severity: 'error',
            blockId: block.id,
            message: 'Client-facing document references sending or attaching a PDF (I11 / I13).',
          });
          break;
        }
      }
    }

    // 7. Unsourced figures check (I4, I13, M1)
    if (block.type === 'kpi_row' && block.kpis) {
      for (const kpi of block.kpis) {
        const sid = kpi.sourceId || block.sourceId;
        if (!sid || !validSourceIds.has(sid)) {
          findings.push({
            code: 'LINT_UNSOURCED_FIGURE',
            severity: 'error',
            blockId: block.id,
            message: `KPI "${kpi.label}: ${kpi.value}" lacks a valid source_id in doc.sources (I4 / I13).`,
          });
        }
      }
    } else if (block.type !== 'heading' && block.type !== 'toc' && block.type !== 'source_note' && hasNumericClaim(fullText)) {
      if (!block.sourceId || !validSourceIds.has(block.sourceId)) {
        findings.push({
          code: 'LINT_UNSOURCED_FIGURE',
          severity: 'error',
          blockId: block.id,
          message: 'Block contains a quantitative figure or score without a valid source_id reference (I4 / I13).',
        });
      }
    }

    // 8. Optional NL/BE Rule Pack (province-only NL geo + advisory framing)
    if (opts.enableNlBeRulePack) {
      if (/nl/i.test(doc.meta.market) || doc.meta.language === 'nl-NL') {
        for (const pat of PRESS_LINT_CONFIG.nlCityOrRadiusPatterns) {
          const m = pat.exec(fullText);
          if (m) {
            findings.push({
              code: 'LINT_NL_PROVINCE_GEO_ONLY',
              severity: 'error',
              blockId: block.id,
              message: `NL/BE Rule Pack: "${m[0]}" uses city-level or radius geo targeting. Use province-level targeting in NL (for example Noord-Holland, Zuid-Holland, Noord-Brabant).`,
            });
            break;
          }
        }
      }
      if (doc.meta.docType === 'activation_plan' || doc.meta.audience === 'client') {
        for (const pat of PRESS_LINT_CONFIG.nonAdvisoryFramingPatterns) {
          const m = pat.exec(fullText);
          if (m) {
            findings.push({
              code: 'LINT_ADVISORY_FRAMING',
              severity: 'error',
              blockId: block.id,
              message: `NL/BE Rule Pack: "${m[0]}" violates advisory framing. Phrase steps as instructions the client executes in their own environment.`,
            });
            break;
          }
        }
      }
    }
  }

  // 9. Required sections check per template (I13)
  const reqSections = PRESS_LINT_CONFIG.requiredSectionsByTemplate[doc.meta.templateId] ?? [];
  for (const req of reqSections) {
    const present = headingTexts.some((h) => h.toLowerCase().includes(req.toLowerCase()));
    if (!present) {
      findings.push({
        code: 'LINT_MISSING_REQUIRED_SECTION',
        severity: 'error',
        message: `Missing required heading "${req}" for template "${doc.meta.templateId}" (I13).`,
      });
    }
  }

  return {
    passed: findings.length === 0,
    findings,
  };
}

export function autoFixDashes(doc: PressDocument): PressDocument {
  const clean = (s?: string) =>
    s === undefined
      ? undefined
      : s
          .replace(/\s*\u2014\s*/g, ': ')
          .replace(/(\d)\u2013(\d)/g, '$1 to $2')
          .replace(/\s*\u2013\s*/g, ': ')
          .replace(/[\u2014\u2013]/g, '-');

  return {
    ...doc,
    meta: {
      ...doc.meta,
      title: clean(doc.meta.title) ?? doc.meta.title,
      subtitle: clean(doc.meta.subtitle),
    },
    blocks: doc.blocks.map((b) => ({
      ...b,
      eyebrow: clean(b.eyebrow),
      title: clean(b.title),
      text: clean(b.text),
      caption: clean(b.caption),
      items: b.items?.map((i) => clean(i) ?? i),
      headers: b.headers?.map((h) => clean(h) ?? h),
      rows: b.rows?.map((r) => r.map((c) => clean(c) ?? c)),
      kpis: b.kpis?.map((k) => ({
        ...k,
        label: clean(k.label) ?? k.label,
        value: clean(k.value) ?? k.value,
        note: clean(k.note),
      })),
    })),
  };
}
