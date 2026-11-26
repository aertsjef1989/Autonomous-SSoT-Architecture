import type { ExportFormat, PressDocType } from './schema';

export interface PressLintConfig {
  /**
   * Default employer / proprietary workspace terms flagged before any export.
   * Users in OFFLINE mode can append custom employer/client names in browser memory.
   */
  employerPatterns: RegExp[];
  /**
   * Allowed synthetic domains and fictional calibration entities in generic templates (C5 / I13).
   */
  allowedSyntheticDomains: string[];
  allowedSyntheticEntities: string[];
  /**
   * Budget / daily ad spend patterns forbidden in intro / one-pager / outreach contexts.
   */
  outreachBudgetPatterns: RegExp[];
  outreachDocTypes: PressDocType[];
  /**
   * Client-facing restrictions (I13): internal reasoning, agency tooling, client comparisons, and PDF attachment prompts.
   */
  clientInternalKeywords: RegExp[];
  clientAgencyToolingKeywords: RegExp[];
  clientComparisonKeywords: RegExp[];
  clientSendPdfPrompts: RegExp[];
  /**
   * Required heading keywords per template ID so empty or deleted required sections block export (I13).
   */
  requiredSectionsByTemplate: Record<string, string[]>;
  /**
   * Allowed export formats per template ID (I6).
   */
  allowedExportsByTemplate: Record<string, ExportFormat[]>;
  /**
   * Optional NL/BE Short-Form Video & Advisory Rule Pack (I13):
   * - Province-level geo targeting only in NL (flags Dutch city names or radius targeting).
   * - Advisory framing check (flags agency-operated promises in client-facing activation plans).
   */
  nlCityOrRadiusPatterns: RegExp[];
  nonAdvisoryFramingPatterns: RegExp[];
}

export const PRESS_LINT_CONFIG: PressLintConfig = {
  employerPatterns: [
    /\b(?:accenture|deloitte|mckinsey|capgemini|publicis|wpp|omnicom|dentsu|havas|mediamonks)\b/i,
    // Catches internal 3-letter prefix patterns if imported into a client/public export unless cleared
    /\b(?:EMP_CONFIDENTIAL|INTERNAL_EMPLOYER)\b/i,
  ],
  allowedSyntheticDomains: [
    'vuurtoren-atelier.example',
    'noordzee-fietsen.example',
    'atelier-lumiere.example',
    'nordic-grid.example',
    'example.com',
    'example.org',
    'example.net',
  ],
  allowedSyntheticEntities: [
    'Kapsalon Vuurtoren BV',
    'Noordzee Rijwielen BV',
    'Atelier Lumiere SAS',
    'Nordic Grid AB',
  ],
  outreachBudgetPatterns: [
    /\bdaily\s+(?:ad\s+)?(?:spend|budget)\b/i,
    /\bminimum\s+(?:ad\s+)?(?:spend|budget)\b/i,
    /\b(?:eur|€|\$)\s*\d[\d,.]*\s*(?:\/\s*day|per\s+day|daily|ad\s+spend)\b/i,
  ],
  outreachDocTypes: ['one_pager'],
  clientInternalKeywords: [
    /\binternal\s+reasoning\b/i,
    /\binternal\s+only\b/i,
    /\bmargin\s+target\b/i,
    /\bupsell\s+angle\b/i,
    /\brep\s+commission\b/i,
  ],
  clientAgencyToolingKeywords: [
    /\bprospecthub\b/i,
    /\bomniroute\b/i,
    /\bscraper\s+pipeline\b/i,
    /\blead\s+tier\s+[abc]\b/i,
    /\bcrm\s+velocity\b/i,
  ],
  clientComparisonKeywords: [
    /\bunlike\s+other\s+clients\b/i,
    /\bcompared\s+to\s+(?:other|similar)\s+(?:clients|advertisers|brands)\b/i,
    /\byour\s+competitor[s]?\s+spend\b/i,
  ],
  clientSendPdfPrompts: [
    /\bsend\s+(?:you\s+)?(?:a\s+|the\s+)?pdf\b/i,
    /\battached\s+pdf\b/i,
    /\bsee\s+the\s+pdf\s+attachment\b/i,
    /\bdownload\s+the\s+attached\s+pdf\b/i,
  ],
  requiredSectionsByTemplate: {
    'tpl-one-pager': ['Objective', 'Key Architecture Controls'],
    'tpl-research-brief': ['Entity Snapshot', 'Readiness Rubric', 'Sources'],
    'tpl-activation-plan': ['Discovery Summary', 'Client Implementation Steps', 'Measurement Checklist'],
    'tpl-integration-guide': ['Prerequisites', 'Implementation Steps', 'Verification'],
    'tpl-playbook-page': ['Operational Answer', 'Guardrails'],
    'tpl-executive-report': ['Executive Summary', 'Findings', 'Recommendations'],
  },
  allowedExportsByTemplate: {
    'tpl-one-pager': ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    'tpl-research-brief': ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    'tpl-activation-plan': ['email_html', 'docx', 'gdocs_docx', 'markdown'],
    'tpl-integration-guide': ['email_html', 'docx', 'gdocs_docx', 'markdown'],
    'tpl-playbook-page': ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    'tpl-executive-report': ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
  },
  nlCityOrRadiusPatterns: [
    /\b(?:amsterdam|rotterdam|utrecht|den\s+haag|the\s+hague|eindhoven|groningen|tilburg|almere|breda|nijmegen|haarlem|arnhem|maastricht)\b/i,
    /\b\d+\s*(?:km|kilometer|mile|mi)\s+radius\b/i,
    /\bradius\s+targeting\b/i,
    /\bcity-level\s+targeting\b/i,
  ],
  nonAdvisoryFramingPatterns: [
    /\bwe\s+will\s+(?:manage|run|operate|optimize)\s+your\s+(?:campaigns|ads|ad\s+account)\b/i,
    /\bour\s+team\s+will\s+log\s+into\s+your\b/i,
    /\bwe\s+set\s+up\s+the\s+campaigns\s+for\s+you\b/i,
  ],
};
