import type { PressDocument } from './schema';

export function exportPressToMarkdown(doc: PressDocument): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: "${doc.meta.title.replace(/"/g, '\\"')}"`);
  if (doc.meta.subtitle) lines.push(`subtitle: "${doc.meta.subtitle.replace(/"/g, '\\"')}"`);
  lines.push(`language: ${doc.meta.language}`);
  lines.push(`market: ${doc.meta.market}`);
  lines.push(`doc_type: ${doc.meta.docType}`);
  lines.push(`audience: ${doc.meta.audience}`);
  lines.push(`updated_at: ${doc.meta.updatedAt}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${doc.meta.title}`);
  if (doc.meta.subtitle) {
    lines.push('');
    lines.push(`*${doc.meta.subtitle}*`);
  }
  lines.push('');

  const headings = doc.blocks.filter((b) => b.type === 'heading' && b.text);

  for (const b of doc.blocks) {
    switch (b.type) {
      case 'toc': {
        lines.push(`## ${b.title || 'Contents'}`);
        headings.forEach((h, idx) => {
          lines.push(`${idx + 1}. ${h.text}`);
        });
        lines.push('');
        break;
      }
      case 'heading': {
        const lvl = b.level ?? 2;
        if (b.eyebrow) lines.push(`\`${b.eyebrow.toUpperCase()}\``);
        lines.push(`${'#'.repeat(lvl)} ${b.text ?? ''}`);
        lines.push('');
        break;
      }
      case 'paragraph': {
        lines.push(b.text ?? '');
        lines.push('');
        break;
      }
      case 'bullets': {
        for (const it of b.items ?? []) {
          lines.push(`- ${it}`);
        }
        lines.push('');
        break;
      }
      case 'numbered': {
        (b.items ?? []).forEach((it, i) => {
          lines.push(`${i + 1}. ${it}`);
        });
        lines.push('');
        break;
      }
      case 'kpi_row': {
        const kpis = b.kpis ?? [];
        if (kpis.length > 0) {
          lines.push('| Metric | Value | Note |');
          lines.push('| :--- | :--- | :--- |');
          for (const k of kpis) {
            lines.push(`| ${k.label} | **${k.value}** | ${k.note ?? ''} |`);
          }
          lines.push('');
        }
        break;
      }
      case 'table': {
        const headers = b.headers ?? [];
        if (headers.length > 0) {
          lines.push(`| ${headers.join(' | ')} |`);
          lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);
          for (const r of b.rows ?? []) {
            lines.push(`| ${r.join(' | ')} |`);
          }
          lines.push('');
        }
        break;
      }
      case 'callout': {
        const tag = b.variant === 'tip' ? 'TIP / NOTE' : b.variant === 'context' ? 'CONTEXT' : 'KEY POINT';
        lines.push(`> **${b.title || tag}:** ${b.text ?? ''}`);
        lines.push('');
        break;
      }
      case 'quote': {
        lines.push(`> ${b.text ?? ''}`);
        lines.push('');
        break;
      }
      case 'hero_image': {
        lines.push(`![${b.alt ?? 'Signal illustration'}](press-assets/heroes/${b.heroId ?? 'glyph'}.svg)`);
        if (b.caption) lines.push(`*${b.caption}*`);
        lines.push('');
        break;
      }
      case 'divider': {
        lines.push('---');
        lines.push('');
        break;
      }
      case 'page_break': {
        lines.push('<!-- page-break -->');
        lines.push('');
        break;
      }
      case 'source_note': {
        lines.push(`- ${b.text ?? ''}`);
        lines.push('');
        break;
      }
    }
  }

  return lines.join('\n').trim() + '\n';
}
