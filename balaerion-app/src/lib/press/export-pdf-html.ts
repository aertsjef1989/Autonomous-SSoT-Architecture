import { PRESS_THEMES, parseInlineMarks, type PressDocument, type PressThemeId } from './schema';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInlineHtml(text: string, codeBg: string, ink: string, linkColor: string): string {
  return parseInlineMarks(text)
    .map((r) => {
      let out = esc(r.text);
      if (r.code) {
        out = `<code style="font-family:Consolas,Menlo,monospace;font-size:0.9em;background:${codeBg};color:${ink};padding:1px 5px;border-radius:4px;">${out}</code>`;
      }
      if (r.bold) out = `<strong>${out}</strong>`;
      if (r.italic) out = `<em>${out}</em>`;
      if (r.href) out = `<a href="${esc(r.href)}" style="color:${linkColor};text-decoration:underline;">${out}</a>`;
      return out;
    })
    .join('');
}

export interface PdfHtmlOptions {
  variant: 'dark' | 'light';
  assetBasePath?: string;
  inlineHeroSvgs?: Record<string, string>;
  /** Pre-fetched font URLs (blob: or data:). When set, offline preview/print makes zero network requests. */
  fontUrls?: Partial<Record<'regular' | 'bold' | 'italic', string>>;
}

/**
 * Generates self-contained A4 print-CSS HTML for PDF export (I10).
 * Supports DARK (`console` #0B0C10) and print-safe LIGHT (`lightscreen` #FFFFFF) variants,
 * WCAG AA >= 4.5:1 contrast in both, self-hosted Carlito @font-face, selectable text, and semantic headings/tables.
 */
export function renderPressToPrintHtml(doc: PressDocument, opts: PdfHtmlOptions): string {
  const themeKey: PressThemeId = opts.variant === 'dark' ? 'console' : 'lightscreen';
  const T = PRESS_THEMES[themeKey];
  const basePath = opts.assetBasePath ?? '/press-assets';
  const fontUrl = (key: 'regular' | 'bold' | 'italic', file: string) =>
    opts.fontUrls?.[key] ?? `${basePath}/fonts/${file}`;
  const headings = doc.blocks.filter((b) => b.type === 'heading' && b.text);

  const blocksHtml = doc.blocks
    .map((b) => {
      switch (b.type) {
        case 'toc': {
          const items = headings
            .map(
              (h, idx) =>
                `<li style="margin:4px 0;"><strong style="color:${idx % 2 === 0 ? T.text1 : T.text2};">${idx + 1}.</strong> ${esc(h.text ?? '')}</li>`
            )
            .join('');
          return `<nav aria-label="Table of contents" class="block card"><div class="eyebrow">${esc(b.title || 'Contents')}</div><ol style="list-style:none;padding:0;margin:6px 0 0;">${items}</ol></nav>`;
        }
        case 'heading': {
          const tag = b.level === 1 ? 'h2' : b.level === 2 ? 'h3' : 'h4';
          const cls = b.level === 1 ? 'h1' : b.level === 2 ? 'h2' : 'h3';
          return `<div class="block">${b.eyebrow ? `<div class="eyebrow">${esc(b.eyebrow)}</div>` : ''}<${tag} class="${cls}">${renderInlineHtml(b.text ?? '', T.surface, T.ink, T.text1)}</${tag}></div>`;
        }
        case 'paragraph':
          return `<p class="block body-p">${renderInlineHtml(b.text ?? '', T.surface, T.ink, T.text1)}</p>`;
        case 'bullets': {
          const items = (b.items ?? [])
            .map((it) => `<li>${renderInlineHtml(it, T.surface, T.ink, T.text1)}</li>`)
            .join('');
          return `<ul class="block list-ul">${items}</ul>`;
        }
        case 'numbered': {
          const items = (b.items ?? [])
            .map((it, idx) => {
              const chipBg = idx % 2 === 0 ? T.accent1 : T.accent2;
              const chipFg = idx % 2 === 0 ? '#FFFFFF' : '#14161C';
              return `<li class="num-li"><span class="chip" style="background:${chipBg};color:${chipFg};">${idx + 1}</span><span>${renderInlineHtml(it, T.surface, T.ink, T.text1)}</span></li>`;
            })
            .join('');
          return `<ol class="block list-ol">${items}</ol>`;
        }
        case 'kpi_row': {
          const tiles = (b.kpis ?? [])
            .map(
              (k) => `
              <div class="kpi-tile">
                <div class="kpi-label">${esc(k.label)}</div>
                <div class="kpi-val">${esc(k.value)}</div>
                ${k.note ? `<div class="kpi-note">${esc(k.note)}</div>` : ''}
              </div>`
            )
            .join('');
          return `<div class="block kpi-row">${tiles}</div>`;
        }
        case 'table': {
          const ths = (b.headers ?? []).map((h) => `<th scope="col">${esc(h)}</th>`).join('');
          const trs = (b.rows ?? [])
            .map((r, rIdx) => {
              const bg = rIdx % 2 === 1 ? T.surface : T.ground;
              const tds = r
                .map((c, cIdx) => {
                  const hi = b.highlightCol === cIdx;
                  return `<td style="background:${bg};color:${hi ? T.text1 : T.ink};font-weight:${hi ? 700 : 400};">${renderInlineHtml(c, T.surfaceDeep, T.ink, T.text1)}</td>`;
                })
                .join('');
              return `<tr>${tds}</tr>`;
            })
            .join('');
          return `<div class="block"><table class="sig-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
        }
        case 'callout': {
          const isTip = b.variant === 'tip';
          const isCtx = b.variant === 'context';
          const bg = isTip ? T.tint2 : isCtx ? T.surface : T.tint1;
          const border = isTip ? T.accent2 : isCtx ? T.border : T.accent1;
          const lbl = isTip ? T.text2 : isCtx ? T.muted : T.text1;
          return `<aside class="block callout" style="background:${bg};border-left:4px solid ${border};"><div class="callout-label" style="color:${lbl};">${esc(b.title || (isTip ? 'TIP / NOTE' : isCtx ? 'CONTEXT' : 'KEY POINT'))}</div><div>${renderInlineHtml(b.text ?? '', T.ground, T.ink, T.text1)}</div></aside>`;
        }
        case 'quote':
          return `<blockquote class="block statement">&ldquo;${renderInlineHtml(b.text ?? '', T.ground, T.ink, T.text1)}&rdquo;</blockquote>`;
        case 'hero_image': {
          const hid = b.heroId ?? 'glyph';
          const inlineSvg = opts.inlineHeroSvgs?.[hid];
          const imgMarkup = inlineSvg
            ? `<div role="img" aria-label="${esc(b.alt ?? 'Signal illustration')}" class="hero-svg">${inlineSvg}</div>`
            : `<img src="${esc(basePath)}/heroes/${esc(hid)}.svg" alt="${esc(b.alt ?? 'Signal illustration')}" class="hero-img" />`;
          return `<figure class="block hero-fig">${imgMarkup}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
        }
        case 'divider':
          return `<hr class="block divider" />`;
        case 'page_break':
          return `<div class="page-break" aria-hidden="true"></div>`;
        case 'source_note':
          return `<div class="block source-note">${renderInlineHtml(b.text ?? '', T.surface, T.muted, T.text2)}</div>`;
      }
    })
    .join('\n');

  // Signal standard margins: ~14mm top/bottom, 15mm left/right on A4 (210mm x 297mm)
  return `<!DOCTYPE html>
<html lang="${esc(doc.meta.language)}">
<head>
  <meta charset="UTF-8">
  <title>${esc(doc.meta.title)}</title>
  <style>
    @font-face {
      font-family: 'Carlito';
      src: url('${esc(fontUrl('regular', 'Carlito-Regular.ttf'))}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Carlito';
      src: url('${esc(fontUrl('bold', 'Carlito-Bold.ttf'))}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Carlito';
      src: url('${esc(fontUrl('italic', 'Carlito-Italic.ttf'))}') format('truetype');
      font-weight: 400;
      font-style: italic;
    }
    @page {
      size: A4 portrait;
      margin: 14mm 15mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${T.ground};
      color: ${T.ink};
      font-family: 'Carlito', 'Calibri', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.48;
    }
    main.sheet {
      max-width: 180mm;
      margin: 0 auto;
      padding: 4mm 0;
      background: ${T.ground};
      color: ${T.ink};
    }
    header.doc-header {
      border-bottom: 2px solid ${T.border};
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .sig-dots { display: inline-flex; gap: 5px; vertical-align: middle; margin-right: 8px; }
    .sig-dots i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .eyebrow {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: ${T.text2};
      margin-bottom: 3px;
    }
    h1.doc-title { font-size: 20pt; font-weight: 700; margin: 4px 0; line-height: 1.2; color: ${T.ink}; }
    .doc-sub { font-size: 10.5pt; color: ${T.muted}; margin: 2px 0 0; }
    .block { margin-bottom: 10px; }
    .h1 { font-size: 15pt; font-weight: 700; margin: 8px 0 4px; color: ${T.ink}; }
    .h2 { font-size: 12.5pt; font-weight: 700; margin: 6px 0 3px; color: ${T.ink}; }
    .h3 { font-size: 11pt; font-weight: 700; margin: 4px 0 2px; color: ${T.ink}; }
    .body-p { margin: 0 0 8px; }
    .list-ul { margin: 0 0 10px 18px; padding: 0; }
    .list-ul li { margin-bottom: 4px; }
    .list-ol { list-style: none; margin: 0 0 10px; padding: 0; }
    .num-li { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 6px; }
    .chip {
      width: 20px; height: 20px; border-radius: 999px; flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 9pt; font-weight: 700; margin-top: 1px;
    }
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; break-inside: avoid; }
    .kpi-tile { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 6px; padding: 10px 12px; }
    .kpi-label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; color: ${T.muted}; }
    .kpi-val { font-size: 15pt; font-weight: 700; color: ${T.text1}; margin-top: 3px; }
    .kpi-note { font-size: 8.5pt; color: ${T.muted}; margin-top: 2px; }
    .sig-table { width: 100%; border-collapse: collapse; font-size: 9.8pt; break-inside: avoid; }
    .sig-table th {
      background: #14161C; color: #FFFFFF; font-weight: 700; text-align: left;
      padding: 7px 9px; border: 1px solid ${T.border};
    }
    .sig-table td { padding: 6px 9px; border: 1px solid ${T.border}; }
    .callout { padding: 10px 14px; border-radius: 6px; break-inside: avoid; }
    .callout-label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 3px; }
    .statement {
      background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 6px;
      padding: 14px 18px; text-align: center; font-size: 12.5pt; font-weight: 700;
      margin: 10px 0; break-inside: avoid;
    }
    .card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 6px; padding: 12px 14px; break-inside: avoid; }
    .hero-fig {
      margin: 0 0 12px; padding: 12px; background: ${T.surface}; border: 1px solid ${T.border};
      border-radius: 6px; text-align: center; break-inside: avoid;
    }
    .hero-img, .hero-svg svg { max-height: 110px; width: auto; max-width: 100%; }
    .hero-fig figcaption { font-size: 8.5pt; color: ${T.muted}; margin-top: 6px; }
    .divider { border: none; border-top: 1px solid ${T.border}; margin: 12px 0; }
    .page-break { page-break-after: always; break-after: page; height: 0; }
    .source-note { font-size: 9pt; color: ${T.muted}; }
    footer.doc-footer {
      margin-top: 16px; padding-top: 8px; border-top: 1px solid ${T.border};
      font-size: 8.5pt; color: ${T.muted}; display: flex; justify-content: space-between;
    }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="doc-header">
      <div class="eyebrow">
        <span class="sig-dots"><i style="background:#F0245C;"></i><i style="background:#21E0DC;"></i></span>
        ${esc(doc.meta.market)} &middot; ${esc(doc.meta.language)} &middot; ${esc(doc.meta.docType.replace(/_/g, ' '))}
      </div>
      <h1 class="doc-title">${esc(doc.meta.title)}</h1>
      ${doc.meta.subtitle ? `<div class="doc-sub">${esc(doc.meta.subtitle)}</div>` : ''}
    </header>
    ${blocksHtml}
    <footer class="doc-footer">
      <span>Signal Press (${opts.variant.toUpperCase()} Edition) &middot; ${esc(doc.meta.author || 'Portfolio')}</span>
      <span>${esc(doc.meta.updatedAt)}</span>
    </footer>
  </main>
</body>
</html>
`;
}
