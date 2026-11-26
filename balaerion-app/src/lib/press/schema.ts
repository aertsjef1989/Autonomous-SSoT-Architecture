export type PressLanguage = 'en-GB' | 'nl-BE' | 'nl-NL' | 'fr-BE';

export type PressDocType =
  | 'one_pager'
  | 'research_brief'
  | 'activation_plan'
  | 'integration_guide'
  | 'playbook_page'
  | 'executive_report';

export type PressAudience = 'internal' | 'client';

export type PressThemeId = 'lightscreen' | 'console' | 'blueprint';

export type ExportFormat =
  | 'docx'
  | 'gdocs_docx'
  | 'pdf_dark'
  | 'pdf_light'
  | 'email_html'
  | 'markdown';

export type SourceClassification = 'verified' | 'reported' | 'unconfirmable';

export interface PressSource {
  id: string;
  label: string;
  reference: string;
  classification: SourceClassification;
}

export type HeroAssetId = 'glyph' | 'H01' | 'H02' | 'H03';

export type PressBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullets'
  | 'numbered'
  | 'table'
  | 'kpi_row'
  | 'callout'
  | 'quote'
  | 'hero_image'
  | 'divider'
  | 'source_note'
  | 'page_break'
  | 'toc';

export interface PressKpiItem {
  label: string;
  value: string;
  note?: string;
  sourceId?: string;
}

export interface PressBlock {
  id: string;
  type: PressBlockType;
  level?: 1 | 2 | 3;
  eyebrow?: string;
  text?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  highlightCol?: number;
  kpis?: PressKpiItem[];
  variant?: 'key' | 'tip' | 'context';
  title?: string;
  heroId?: HeroAssetId;
  alt?: string;
  caption?: string;
  sourceId?: string;
  aiDraft?: boolean;
}

export interface PressMetadata {
  title: string;
  subtitle?: string;
  author?: string;
  language: PressLanguage;
  market: string;
  docType: PressDocType;
  audience: PressAudience;
  templateId: string;
  themeId: PressThemeId;
  updatedAt: string;
}

export interface PressDocument {
  schemaVersion: 'signal-press-doc-v1';
  meta: PressMetadata;
  sources: PressSource[];
  blocks: PressBlock[];
}

export interface PressInlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

export interface PressThemeTokens {
  id: PressThemeId;
  label: string;
  dark: boolean;
  ground: string;
  surface: string;
  surfaceDeep: string;
  ink: string;
  muted: string;
  border: string;
  accent1: string;
  accent2: string;
  text1: string;
  text2: string;
  tint1: string;
  tint2: string;
}

// Reuses exact tokens from DESIGN_SYSTEM_Signal/00_cross_surface_standard/DESIGN.md and 03_engine/signal-app-model.js
export const PRESS_THEMES: Record<PressThemeId, PressThemeTokens> = {
  lightscreen: {
    id: 'lightscreen',
    label: 'Light Screen (Print / DOCX / Wiki)',
    dark: false,
    ground: '#FFFFFF',
    surface: '#F5F6F8',
    surfaceDeep: '#EDEFF3',
    ink: '#14161C',
    muted: '#525866',
    border: '#E1E4EA',
    accent1: '#F0245C',
    accent2: '#21E0DC',
    text1: '#B80D42',
    text2: '#0A7571',
    tint1: '#FDE7EE',
    tint2: '#E4FAF9',
  },
  console: {
    id: 'console',
    label: 'Console Dark (PDF Dark Preferred)',
    dark: true,
    ground: '#0B0C10',
    surface: '#15171F',
    surfaceDeep: '#1E2230',
    ink: '#FFFFFF',
    muted: '#B9C0CE',
    border: '#2A2E3A',
    accent1: '#F0245C',
    accent2: '#21E0DC',
    text1: '#FF5C86',
    text2: '#7BF0EE',
    tint1: '#1E2230',
    tint2: '#1E2230',
  },
  blueprint: {
    id: 'blueprint',
    label: 'Blueprint Paper',
    dark: false,
    ground: '#F5F4EF',
    surface: '#FFFFFF',
    surfaceDeep: '#E2E4E1',
    ink: '#203048',
    muted: '#526071',
    border: '#DCE0E3',
    accent1: '#C0504A',
    accent2: '#188860',
    text1: '#9E3530',
    text2: '#136B4B',
    tint1: '#F7E9E7',
    tint2: '#E6F3ED',
  },
};

const VALID_LANGUAGES: readonly PressLanguage[] = ['en-GB', 'nl-BE', 'nl-NL', 'fr-BE'];
const VALID_DOC_TYPES: readonly PressDocType[] = [
  'one_pager',
  'research_brief',
  'activation_plan',
  'integration_guide',
  'playbook_page',
  'executive_report',
];
const VALID_BLOCK_TYPES: readonly PressBlockType[] = [
  'heading',
  'paragraph',
  'bullets',
  'numbered',
  'table',
  'kpi_row',
  'callout',
  'quote',
  'hero_image',
  'divider',
  'source_note',
  'page_break',
  'toc',
];

export function parseInlineMarks(input: string): PressInlineRun[] {
  if (!input) return [];
  const runs: PressInlineRun[] = [];
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(input)) !== null) {
    if (match.index > lastIdx) {
      runs.push({ text: input.slice(lastIdx, match.index) });
    }
    const tok = match[0];
    if (tok.startsWith('**') && tok.endsWith('**')) {
      runs.push({ text: tok.slice(2, -2), bold: true });
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      runs.push({ text: tok.slice(1, -1), italic: true });
    } else if (tok.startsWith('`') && tok.endsWith('`')) {
      runs.push({ text: tok.slice(1, -1), code: true });
    } else if (tok.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (linkMatch) {
        runs.push({ text: linkMatch[1], href: linkMatch[2] });
      } else {
        runs.push({ text: tok });
      }
    }
    lastIdx = tokenRe.lastIndex;
  }

  if (lastIdx < input.length) {
    runs.push({ text: input.slice(lastIdx) });
  }
  return runs;
}

export function validatePressDocument(raw: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Document must be a non-null object.'] };
  }
  const d = raw as Record<string, unknown>;
  if (d.schemaVersion !== 'signal-press-doc-v1') {
    errors.push('schemaVersion must equal "signal-press-doc-v1".');
  }
  if (!d.meta || typeof d.meta !== 'object') {
    errors.push('meta object is required.');
  } else {
    const m = d.meta as Record<string, unknown>;
    if (typeof m.title !== 'string' || !m.title.trim()) errors.push('meta.title must be non-empty.');
    if (!VALID_LANGUAGES.includes(m.language as PressLanguage)) {
      errors.push(`meta.language must be one of ${VALID_LANGUAGES.join(', ')}.`);
    }
    if (!VALID_DOC_TYPES.includes(m.docType as PressDocType)) {
      errors.push(`meta.docType must be one of ${VALID_DOC_TYPES.join(', ')}.`);
    }
    if (m.audience !== 'internal' && m.audience !== 'client') {
      errors.push('meta.audience must be "internal" or "client".');
    }
    if (!(String(m.themeId) in PRESS_THEMES)) {
      errors.push('meta.themeId is invalid.');
    }
  }

  if (!Array.isArray(d.sources)) {
    errors.push('sources must be an array.');
  } else {
    d.sources.forEach((s, idx) => {
      if (!s || typeof s !== 'object') {
        errors.push(`sources[${idx}] must be an object.`);
        return;
      }
      const src = s as Record<string, unknown>;
      if (typeof src.id !== 'string' || !src.id.trim()) errors.push(`sources[${idx}].id is required.`);
      if (!['verified', 'reported', 'unconfirmable'].includes(String(src.classification))) {
        errors.push(`sources[${idx}].classification must be verified, reported, or unconfirmable.`);
      }
    });
  }

  if (!Array.isArray(d.blocks) || d.blocks.length === 0) {
    errors.push('blocks must be a non-empty array.');
  } else {
    d.blocks.forEach((b, idx) => {
      if (!b || typeof b !== 'object') {
        errors.push(`blocks[${idx}] must be an object.`);
        return;
      }
      const blk = b as Record<string, unknown>;
      if (typeof blk.id !== 'string' || !blk.id.trim()) errors.push(`blocks[${idx}].id is required.`);
      if (!VALID_BLOCK_TYPES.includes(blk.type as PressBlockType)) {
        errors.push(`blocks[${idx}].type "${String(blk.type)}" is invalid.`);
      }
      if (blk.type === 'hero_image' && (typeof blk.alt !== 'string' || !blk.alt.trim())) {
        errors.push(`blocks[${idx}] (hero_image) requires non-empty alt text (I16).`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function estimateA4Pages(doc: PressDocument): { estimatedHeightMm: number; pageCount: number; fitsOnePage: boolean } {
  // Usable A4 height: 297mm - 28mm top/bottom margins = 269mm
  const USABLE_MM = 269;
  let h = 28; // header + title block baseline
  for (const b of doc.blocks) {
    switch (b.type) {
      case 'page_break':
        h = Math.ceil(h / USABLE_MM) * USABLE_MM + 12;
        break;
      case 'heading':
        h += b.level === 1 ? 15 : b.level === 2 ? 12 : 10;
        break;
      case 'paragraph': {
        const chars = (b.text ?? '').length;
        h += Math.max(1, Math.ceil(chars / 92)) * 6 + 4;
        break;
      }
      case 'bullets':
      case 'numbered': {
        const items = b.items ?? [];
        const lines = items.reduce((acc, it) => acc + Math.max(1, Math.ceil(it.length / 84)), 0);
        h += lines * 6 + 5;
        break;
      }
      case 'table': {
        const rowCount = (b.rows?.length ?? 0) + 1;
        h += rowCount * 8.5 + 8;
        break;
      }
      case 'kpi_row':
        h += 24;
        break;
      case 'callout':
      case 'quote': {
        const chars = (b.text ?? '').length;
        h += Math.max(1, Math.ceil(chars / 82)) * 6 + 12;
        break;
      }
      case 'hero_image':
        h += 42;
        break;
      case 'divider':
        h += 6;
        break;
      case 'source_note':
        h += 8;
        break;
      case 'toc':
        h += 22;
        break;
    }
  }
  const pageCount = Math.max(1, Math.ceil(h / USABLE_MM));
  return {
    estimatedHeightMm: Math.round(h),
    pageCount,
    fitsOnePage: pageCount === 1 && h <= USABLE_MM - 8,
  };
}
