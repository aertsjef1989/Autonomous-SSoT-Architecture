import type {
  PressBlock,
  PressDocument,
  PressLanguage,
  PressSource,
  SourceClassification,
} from './schema';

export interface ImportResult {
  doc: PressDocument;
  mismatches: string[];
}

const KNOWN_FRONTMATTER_KEYS = new Set([
  'title',
  'subtitle',
  'language',
  'market',
  'doc_type',
  'audience',
  'author',
  'updated_at',
  'status',
  'folder',
  'id',
]);

const KNOWN_PROSPECTHUB_KEYS = new Set([
  'entity_name',
  'domain',
  'country_code',
  'language',
  'readiness_score',
  'confidence',
  'stack',
  'summary',
  'findings',
  'recommended_steps',
  'sources',
]);

function mapCountryToLanguage(cc: string): PressLanguage {
  const up = cc.toUpperCase();
  if (up === 'BE') return 'nl-BE';
  if (up === 'NL') return 'nl-NL';
  if (up === 'FR') return 'fr-BE';
  return 'en-GB';
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { meta: {}, body: raw };
  }
  const endIdx = raw.indexOf('\n---', 3);
  if (endIdx === -1) return { meta: {}, body: raw };
  const fmLines = raw.slice(4, endIdx).split(/\r?\n/);
  const meta: Record<string, string> = {};
  for (const line of fmLines) {
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (m) {
      meta[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  const rest = raw.slice(endIdx + 4).replace(/^\r?\n/, '');
  return { meta, body: rest };
}

/**
 * Client-side Markdown & SSoT Node importer (I7).
 * Supports structured filenames `[PREFIX]_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md` (including 3-letter enterprise prefixes),
 * YAML frontmatter, GFM tables, lists, callouts, and `## Sources` classification blocks, reporting unknown fields in `mismatches`.
 */
export function importMarkdownToPress(rawMarkdown: string, filename = 'imported_node.md'): ImportResult {
  const mismatches: string[] = [];
  const { meta: fm, body } = parseFrontmatter(rawMarkdown);

  for (const key of Object.keys(fm)) {
    if (!KNOWN_FRONTMATTER_KEYS.has(key.toLowerCase())) {
      mismatches.push(`Unknown frontmatter field "${key}" preserved as context note rather than dropped silently.`);
    }
  }

  let inferredMarket = fm.market || 'NL/BE';
  let inferredLang: PressLanguage = (fm.language as PressLanguage) || 'en-GB';
  let inferredTitle = fm.title || '';

  const baseName = filename.split('/').pop() ?? filename;
  // Matches structured convention: [PREFIX]_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md
  const nameMatch = /^([A-Z0-9]{2,5})_([A-Za-z0-9]+)_([A-Z]{2,4})_(\d{2,4})_([A-Za-z0-9_-]+)\.md$/i.exec(baseName);
  if (nameMatch) {
    const [, prefix, folderCode, cc, counter, topic] = nameMatch;
    inferredMarket = cc.toUpperCase() === 'GLB' ? 'NL/BE' : cc.toUpperCase();
    inferredLang = mapCountryToLanguage(cc);
    if (!inferredTitle) {
      inferredTitle = `${topic.replace(/[_-]+/g, ' ')} (${folderCode} #${counter})`;
    }
    if (prefix.toUpperCase() !== 'DOC' && prefix.toUpperCase() !== 'SOP') {
      mismatches.push(
        `Structured filename prefix "${prefix.toUpperCase()}_" detected (${baseName}); normalized metadata extracted (folder=${folderCode}, market=${inferredMarket}, counter=${counter}).`
      );
    }
  } else if (baseName !== 'imported_node.md' && !baseName.endsWith('.md')) {
    mismatches.push(`Filename "${baseName}" does not match [PREFIX]_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md convention.`);
  }

  const lines = body.split(/\r?\n/);
  const blocks: PressBlock[] = [];
  const sources: PressSource[] = [];
  let inSourcesSection = false;
  let idx = 0;
  let seq = 1;

  // Surface unknown frontmatter values visibly instead of dropping them
  const unknownFmEntries = Object.entries(fm).filter(([k]) => !KNOWN_FRONTMATTER_KEYS.has(k.toLowerCase()));
  if (unknownFmEntries.length > 0) {
    blocks.push({
      id: `imp-fm-${seq++}`,
      type: 'callout',
      variant: 'context',
      title: 'UNMAPPED FRONTMATTER FIELDS',
      text: unknownFmEntries.map(([k, v]) => `${k}: ${v}`).join(' · '),
    });
  }

  while (idx < lines.length) {
    const line = lines[idx].trim();
    if (!line) {
      idx++;
      continue;
    }

    const hMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (hMatch) {
      const depth = hMatch[1].length;
      const text = hMatch[2].trim();
      if (depth > 3) {
        mismatches.push(`Heading level H${depth} ("${text}") clamped to H3 (schema supports H1 to H3).`);
      }
      if (/^sources\b/i.test(text)) {
        inSourcesSection = true;
      } else {
        inSourcesSection = false;
      }
      if (!inferredTitle && depth === 1) {
        inferredTitle = text;
      }
      blocks.push({
        id: `imp-b-${seq++}`,
        type: 'heading',
        level: (Math.min(3, depth) as 1 | 2 | 3),
        text,
      });
      idx++;
      continue;
    }

    if (inSourcesSection && /^[-*]\s+/.test(line)) {
      const rawItem = line.replace(/^[-*]\s+/, '').trim();
      const clsMatch = /\b(verified|reported|unconfirmable)\b/i.exec(rawItem);
      const idMatch = /^\[([A-Za-z0-9_-]+)\]\s*(.*)$/.exec(rawItem);
      const srcId = idMatch ? idMatch[1] : `SRC-${sources.length + 1}`;
      const cls: SourceClassification = clsMatch
        ? (clsMatch[1].toLowerCase() as SourceClassification)
        : 'reported';
      if (!clsMatch) {
        mismatches.push(`Source entry "${rawItem.slice(0, 48)}" had no explicit class marker; defaulted to "reported".`);
      }
      sources.push({
        id: srcId,
        label: idMatch ? idMatch[2] : rawItem,
        reference: filename,
        classification: cls,
      });
      blocks.push({
        id: `imp-b-${seq++}`,
        type: 'source_note',
        sourceId: srcId,
        text: `[${srcId}] [${cls.toUpperCase()}] ${rawItem}`,
      });
      idx++;
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push({ id: `imp-b-${seq++}`, type: 'divider' });
      idx++;
      continue;
    }

    // Table block
    if (line.startsWith('|') && idx + 1 < lines.length && /^\|\s*[-:]+/.test(lines[idx + 1].trim())) {
      const headers = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      idx += 2;
      const rows: string[][] = [];
      while (idx < lines.length && lines[idx].trim().startsWith('|')) {
        rows.push(
          lines[idx]
            .trim()
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
        idx++;
      }
      blocks.push({
        id: `imp-b-${seq++}`,
        type: 'table',
        headers,
        rows,
      });
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && /^[-*]\s+/.test(lines[idx].trim())) {
        items.push(lines[idx].trim().replace(/^[-*]\s+/, ''));
        idx++;
      }
      blocks.push({ id: `imp-b-${seq++}`, type: 'bullets', items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && /^\d+\.\s+/.test(lines[idx].trim())) {
        items.push(lines[idx].trim().replace(/^\d+\.\s+/, ''));
        idx++;
      }
      blocks.push({ id: `imp-b-${seq++}`, type: 'numbered', items });
      continue;
    }

    // Blockquote / Callout
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith('>')) {
        quoteLines.push(lines[idx].trim().replace(/^>\s?/, ''));
        idx++;
      }
      const combined = quoteLines.join(' ');
      if (/^(?:\*\*)?(KEY POINT|TIP|NOTE|CONTEXT)/i.test(combined)) {
        blocks.push({
          id: `imp-b-${seq++}`,
          type: 'callout',
          variant: /TIP|NOTE/i.test(combined) ? 'tip' : /CONTEXT/i.test(combined) ? 'context' : 'key',
          title: 'IMPORTED CALLOUT',
          text: combined,
        });
      } else {
        blocks.push({ id: `imp-b-${seq++}`, type: 'quote', text: combined });
      }
      continue;
    }

    // Paragraph
    blocks.push({ id: `imp-b-${seq++}`, type: 'paragraph', text: line });
    idx++;
  }

  if (sources.length === 0) {
    sources.push({
      id: 'SRC-IMP-1',
      label: `Imported Markdown (${baseName})`,
      reference: baseName,
      classification: 'reported',
    });
  }

  // Attach fallback sourceId to imported quantitative blocks so user sees provenance link clearly
  for (const blk of blocks) {
    if (!blk.sourceId) blk.sourceId = sources[0].id;
  }

  if (blocks.length === 0) {
    blocks.push({
      id: 'imp-empty-1',
      type: 'heading',
      level: 1,
      text: inferredTitle || 'Imported Markdown Document',
    });
  }

  return {
    doc: {
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: inferredTitle || 'Imported Markdown Document',
        subtitle: fm.subtitle,
        author: fm.author || 'Offline Importer',
        language: ['en-GB', 'nl-BE', 'nl-NL', 'fr-BE'].includes(inferredLang) ? inferredLang : 'en-GB',
        market: inferredMarket,
        docType: 'playbook_page',
        audience: fm.audience === 'client' ? 'client' : 'internal',
        templateId: 'tpl-playbook-page',
        themeId: 'lightscreen',
        updatedAt: fm.updated_at || '2026-11-25',
      },
      sources,
      blocks,
    },
    mismatches,
  };
}

/**
 * Client-side ProspectHub-style JSON brief importer (I7).
 * Surfaces every unmapped or unknown JSON property in `mismatches` rather than silently dropping fields.
 */
export function importProspectBriefJson(rawJson: string): ImportResult {
  const parsed = JSON.parse(rawJson);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ProspectHub brief JSON must be a top-level JSON object.');
  }

  // Also accept native signal-press-doc-v1 JSON directly
  const obj = parsed as Record<string, unknown>;
  if (obj.schemaVersion === 'signal-press-doc-v1') {
    return { doc: parsed as PressDocument, mismatches: [] };
  }

  const mismatches: string[] = [];
  const unmappedPairs: string[] = [];
  for (const key of Object.keys(obj)) {
    if (!KNOWN_PROSPECTHUB_KEYS.has(key)) {
      mismatches.push(`Unrecognized JSON field "${key}" surfaced in Unmapped Fields callout instead of dropped.`);
      unmappedPairs.push(`${key}=${JSON.stringify(obj[key])}`);
    }
  }

  const entity = typeof obj.entity_name === 'string' && obj.entity_name ? obj.entity_name : 'Synthetic Prospect BV';
  const domain = typeof obj.domain === 'string' && obj.domain ? obj.domain : 'prospect.example';
  const cc = typeof obj.country_code === 'string' && obj.country_code ? obj.country_code : 'BE';
  const score = typeof obj.readiness_score === 'number' || typeof obj.readiness_score === 'string' ? String(obj.readiness_score) : '8.0';
  const conf = typeof obj.confidence === 'number' ? `${Math.round(obj.confidence * 100)}%` : '90%';
  const stack = Array.isArray(obj.stack) ? obj.stack.join(', ') : String(obj.stack ?? 'Unknown Stack');

  const sources: PressSource[] = Array.isArray(obj.sources) && obj.sources.length > 0
    ? (obj.sources as Array<Record<string, unknown>>).map((s, i) => {
        const clsRaw = String(s.classification ?? 'reported').toLowerCase();
        const cls: SourceClassification =
          clsRaw === 'verified' || clsRaw === 'reported' || clsRaw === 'unconfirmable' ? clsRaw : 'reported';
        if (clsRaw !== cls) {
          mismatches.push(`sources[${i}].classification "${clsRaw}" normalized to "reported".`);
        }
        return {
          id: typeof s.id === 'string' && s.id ? s.id : `SRC-PH-${i + 1}`,
          label: String(s.label ?? s.title ?? `Brief Source ${i + 1}`),
          reference: String(s.reference ?? s.url ?? domain),
          classification: cls,
        };
      })
    : [
        {
          id: 'SRC-PH-1',
          label: `ProspectHub Deterministic Snapshot (${domain})`,
          reference: `https://${domain}`,
          classification: 'verified',
        },
      ];

  const primarySrc = sources[0].id;
  const blocks: PressBlock[] = [
    {
      id: 'ph-h1',
      type: 'heading',
      level: 1,
      eyebrow: 'IMPORTED PROSPECTHUB BRIEF',
      text: 'Entity Snapshot',
    },
    {
      id: 'ph-p1',
      type: 'paragraph',
      sourceId: primarySrc,
      text:
        typeof obj.summary === 'string' && obj.summary
          ? obj.summary
          : `Deterministic account snapshot for **${entity}** (\`${domain}\`, market ${cc}).`,
    },
    {
      id: 'ph-h2',
      type: 'heading',
      level: 2,
      text: 'Readiness Rubric',
    },
    {
      id: 'ph-kpi',
      type: 'kpi_row',
      sourceId: primarySrc,
      kpis: [
        { label: 'Readiness Score', value: `${score} / 10`, sourceId: primarySrc },
        { label: 'Entity Confidence', value: conf, sourceId: primarySrc },
        { label: 'Detected Stack', value: stack, sourceId: primarySrc },
      ],
    },
  ];

  if (Array.isArray(obj.findings) && obj.findings.length > 0) {
    blocks.push({
      id: 'ph-findings',
      type: 'bullets',
      sourceId: primarySrc,
      items: obj.findings.map((x) => String(x)),
    });
  }

  if (unmappedPairs.length > 0) {
    blocks.push({
      id: 'ph-unmapped',
      type: 'callout',
      variant: 'context',
      title: 'MISMATCH REPORT (UNMAPPED JSON FIELDS PRESERVED)',
      text: unmappedPairs.join(' | '),
      sourceId: primarySrc,
    });
  }

  blocks.push({
    id: 'ph-h3',
    type: 'heading',
    level: 2,
    text: 'Sources',
  });
  for (const s of sources) {
    blocks.push({
      id: `ph-src-${s.id}`,
      type: 'source_note',
      sourceId: s.id,
      text: `[${s.id}] [${s.classification.toUpperCase()}] ${s.label} (${s.reference})`,
    });
  }

  return {
    doc: {
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: `Account Research Brief: ${entity}`,
        subtitle: `Domain: ${domain} (${cc})`,
        author: 'ProspectHub Importer',
        language: mapCountryToLanguage(cc),
        market: cc === 'NL' || cc === 'BE' ? 'NL/BE' : cc,
        docType: 'research_brief',
        audience: 'internal',
        templateId: 'tpl-research-brief',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources,
      blocks,
    },
    mismatches,
  };
}
