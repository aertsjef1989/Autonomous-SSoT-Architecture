import { parseInlineMarks, type PressDocument } from './schema';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInlineEmail(text: string): string {
  return parseInlineMarks(text)
    .map((r) => {
      let out = esc(r.text);
      if (r.code) {
        out = `<code style="font-family:Consolas,Menlo,monospace;font-size:13px;background-color:#F5F6F8;color:#14161C;padding:1px 5px;border-radius:4px;">${out}</code>`;
      }
      if (r.bold) out = `<strong style="font-weight:700;color:#14161C;">${out}</strong>`;
      if (r.italic) out = `<em>${out}</em>`;
      if (r.href) {
        out = `<a href="${esc(r.href)}" style="color:#C71048;text-decoration:underline;font-weight:600;">${out}</a>`;
      }
      return out;
    })
    .join('');
}

/**
 * Generates strict 600px table-based Email-Body HTML with 100% inline CSS and zero external requests (I11).
 * Compatible with Outlook Word-engine tables, Gmail web/mobileinline CSS stripper, and Apple Mail.
 */
export function exportPressToEmailHtml(doc: PressDocument): string {
  const fontStack = "Calibri, Carlito, 'Segoe UI', Arial, sans-serif";
  const headings = doc.blocks.filter((b) => b.type === 'heading' && b.text);
  const rowsHtml: string[] = [];

  // Header two-dot Signal signature row
  rowsHtml.push(`
    <tr>
      <td style="padding:24px 28px 16px 28px;border-bottom:2px solid #14161C;font-family:${fontStack};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#0A7571;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#F0245C;margin-right:4px;"></span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#21E0DC;margin-right:8px;"></span>
              ${esc(doc.meta.market)} &middot; ${esc(doc.meta.docType.replace(/_/g, ' ').toUpperCase())}
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:24px;line-height:1.25;font-weight:700;color:#14161C;font-family:${fontStack};">
              ${esc(doc.meta.title)}
            </td>
          </tr>
          ${
            doc.meta.subtitle
              ? `<tr><td style="padding-top:6px;font-size:14px;line-height:1.45;color:#5B6270;font-family:${fontStack};">${esc(doc.meta.subtitle)}</td></tr>`
              : ''
          }
        </table>
      </td>
    </tr>
  `);

  for (const b of doc.blocks) {
    switch (b.type) {
      case 'toc': {
        const tocItems = headings
          .map(
            (h, idx) =>
              `<tr><td style="padding:3px 0;font-size:14px;color:#14161C;font-family:${fontStack};"><strong style="color:${idx % 2 === 0 ? '#C71048' : '#0A7571'};">${idx + 1}.</strong> ${esc(h.text ?? '')}</td></tr>`
          )
          .join('');
        rowsHtml.push(`
          <tr>
            <td style="padding:14px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F6F8;border:1px solid #E1E4EA;border-radius:6px;">
                <tr><td style="padding:12px 16px;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:#0A7571;margin-bottom:6px;font-family:${fontStack};">${esc(b.title || 'Contents')}</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${tocItems}</table>
                </td></tr>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'heading': {
        const size = b.level === 1 ? 20 : b.level === 2 ? 17 : 15;
        rowsHtml.push(`
          <tr>
            <td style="padding:18px 28px 6px 28px;font-family:${fontStack};">
              ${
                b.eyebrow
                  ? `<div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#0A7571;padding-bottom:3px;">${esc(b.eyebrow)}</div>`
                  : ''
              }
              <div style="font-size:${size}px;line-height:1.3;font-weight:700;color:#14161C;">${renderInlineEmail(b.text ?? '')}</div>
            </td>
          </tr>
        `);
        break;
      }
      case 'paragraph': {
        rowsHtml.push(`
          <tr>
            <td style="padding:6px 28px 10px 28px;font-size:15px;line-height:1.55;color:#14161C;font-family:${fontStack};">
              ${renderInlineEmail(b.text ?? '')}
            </td>
          </tr>
        `);
        break;
      }
      case 'bullets': {
        const li = (b.items ?? [])
          .map(
            (it) => `
              <tr>
                <td valign="top" width="18" style="padding:4px 0;font-size:15px;color:#C71048;font-weight:700;font-family:${fontStack};">&bull;</td>
                <td valign="top" style="padding:4px 0;font-size:15px;line-height:1.5;color:#14161C;font-family:${fontStack};">${renderInlineEmail(it)}</td>
              </tr>`
          )
          .join('');
        rowsHtml.push(`
          <tr>
            <td style="padding:6px 28px 12px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${li}</table>
            </td>
          </tr>
        `);
        break;
      }
      case 'numbered': {
        const li = (b.items ?? [])
          .map((it, idx) => {
            const badgeBg = idx % 2 === 0 ? '#F0245C' : '#21E0DC';
            const badgeFg = idx % 2 === 0 ? '#FFFFFF' : '#14161C';
            return `
              <tr>
                <td valign="top" width="32" style="padding:5px 8px 5px 0;">
                  <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;background-color:${badgeBg};color:${badgeFg};font-size:12px;font-weight:700;font-family:${fontStack};">${idx + 1}</span>
                </td>
                <td valign="top" style="padding:5px 0;font-size:15px;line-height:1.5;color:#14161C;font-family:${fontStack};">${renderInlineEmail(it)}</td>
              </tr>`;
          })
          .join('');
        rowsHtml.push(`
          <tr>
            <td style="padding:6px 28px 12px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${li}</table>
            </td>
          </tr>
        `);
        break;
      }
      case 'kpi_row': {
        const kpis = b.kpis ?? [];
        if (kpis.length > 0) {
          const widthPct = Math.floor(100 / kpis.length);
          const cells = kpis
            .map(
              (k) => `
                <td width="${widthPct}%" valign="top" style="padding:6px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F6F8;border:1px solid #E1E4EA;border-radius:6px;">
                    <tr>
                      <td style="padding:12px;font-family:${fontStack};">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#5B6270;">${esc(k.label)}</div>
                        <div style="font-size:20px;font-weight:700;color:#C71048;padding-top:4px;">${esc(k.value)}</div>
                        ${k.note ? `<div style="font-size:12px;color:#5B6270;padding-top:3px;">${esc(k.note)}</div>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>`
            )
            .join('');
          rowsHtml.push(`
            <tr>
              <td style="padding:6px 22px 12px 22px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${cells}</tr></table>
              </td>
            </tr>
          `);
        }
        break;
      }
      case 'table': {
        const headers = b.headers ?? [];
        const ths = headers
          .map(
            (h) =>
              `<th align="left" style="padding:9px 10px;background-color:#14161C;color:#FFFFFF;font-size:12px;font-weight:700;border:1px solid #14161C;font-family:${fontStack};">${esc(h)}</th>`
          )
          .join('');
        const trs = (b.rows ?? [])
          .map((r, rIdx) => {
            const bg = rIdx % 2 === 1 ? '#F5F6F8' : '#FFFFFF';
            const tds = r
              .map((cell, cIdx) => {
                const isKey = b.highlightCol === cIdx;
                return `<td style="padding:8px 10px;background-color:${bg};border:1px solid #E1E4EA;font-size:13.5px;color:${isKey ? '#C71048' : '#14161C'};font-weight:${isKey ? 700 : 400};font-family:${fontStack};">${renderInlineEmail(cell)}</td>`;
              })
              .join('');
            return `<tr>${tds}</tr>`;
          })
          .join('');
        rowsHtml.push(`
          <tr>
            <td style="padding:8px 28px 14px 28px;">
              <table role="table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <thead><tr>${ths}</tr></thead>
                <tbody>${trs}</tbody>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'callout': {
        const isTip = b.variant === 'tip';
        const isCtx = b.variant === 'context';
        const bg = isTip ? '#E4FAF9' : isCtx ? '#F5F6F8' : '#FDE7EE';
        const border = isTip ? '#0A7571' : isCtx ? '#5B6270' : '#F0245C';
        const labelCol = isTip ? '#0A7571' : isCtx ? '#5B6270' : '#C71048';
        rowsHtml.push(`
          <tr>
            <td style="padding:8px 28px 12px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${bg};border-left:4px solid ${border};border-radius:4px;">
                <tr>
                  <td style="padding:12px 16px;font-family:${fontStack};">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:${labelCol};padding-bottom:4px;">${esc(b.title || (isTip ? 'TIP / NOTE' : isCtx ? 'CONTEXT' : 'KEY POINT'))}</div>
                    <div style="font-size:14.5px;line-height:1.5;color:#14161C;">${renderInlineEmail(b.text ?? '')}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'quote': {
        rowsHtml.push(`
          <tr>
            <td style="padding:10px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F6F8;border-radius:6px;">
                <tr>
                  <td align="center" style="padding:16px 20px;font-size:16px;font-weight:700;line-height:1.45;color:#14161C;font-family:${fontStack};">
                    &ldquo;${renderInlineEmail(b.text ?? '')}&rdquo;
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'divider':
      case 'page_break': {
        rowsHtml.push(`
          <tr>
            <td style="padding:12px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #E1E4EA;font-size:1px;line-height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'hero_image': {
        // Zero external requests in email HTML (I11): render clean inline typographic banner with alt description
        rowsHtml.push(`
          <tr>
            <td style="padding:8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#14161C;border-radius:6px;">
                <tr>
                  <td style="padding:14px 18px;color:#FFFFFF;font-family:${fontStack};font-size:12.5px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#F0245C;margin-right:4px;"></span>
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#21E0DC;margin-right:8px;"></span>
                    <strong>${esc(b.caption || b.alt || 'Signal Visual Header')}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `);
        break;
      }
      case 'source_note': {
        rowsHtml.push(`
          <tr>
            <td style="padding:2px 28px 4px 28px;font-size:12.5px;line-height:1.45;color:#5B6270;font-family:${fontStack};">
              ${renderInlineEmail(b.text ?? '')}
            </td>
          </tr>
        `);
        break;
      }
    }
  }

  rowsHtml.push(`
    <tr>
      <td style="padding:16px 28px 22px 28px;border-top:1px solid #E1E4EA;font-size:11.5px;color:#5B6270;font-family:${fontStack};">
        Generated offline by Signal Press &middot; Language: ${esc(doc.meta.language)} &middot; Updated: ${esc(doc.meta.updatedAt)}
      </td>
    </tr>
  `);

  return `<!DOCTYPE html>
<html lang="${esc(doc.meta.language)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(doc.meta.title)}</title>
</head>
<body style="margin:0;padding:20px 8px;background-color:#F5F6F8;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center">
        <table role="main" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E1E4EA;border-radius:8px;">
          ${rowsHtml.join('\n')}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
