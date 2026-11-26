import { parseInlineMarks, type HeroAssetId, type PressDocument } from './schema';

export interface DocxExportOptions {
  /**
   * Optional pre-loaded PNG buffers keyed by HeroAssetId (used in Node CI tests or cached offline).
   * In browser mode, fetched from same-origin `/press-assets/heroes/<id>.png` if not supplied.
   */
  heroPngMap?: Partial<Record<HeroAssetId, Uint8Array>>;
  tunedForGoogleDocs?: boolean;
}

/**
 * Client-side and Node-compatible OOXML `.docx` exporter (I8, I9, V16, V19).
 * Lazy-loads `docx` (`import('docx')`) so initial editor bundle stays small (I14).
 * Uses Signal LIGHT surface (#FFFFFF ground, #14161C ink, #F5F6F8 banding, #C71048 deep pink, #0A7571 deep cyan)
 * so documents open cleanly in Microsoft Word, Google Docs (V19), and enterprise wikis (I3).
 */
export async function exportPressToDocxBytes(doc: PressDocument, opts: DocxExportOptions = {}): Promise<Uint8Array> {
  const docx = await import('docx');
  const {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    Footer,
    Header,
    HeadingLevel,
    ImageRun,
    PageBreak,
    PageNumber,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docx;

  const lang = doc.meta.language;
  const fontName = 'Calibri'; // Metric-compatible with Carlito; native in Word, Google Docs, and enterprise wikis (I3, V18, V19)

  const makeRuns = (text: string, baseColor = '14161C', baseSizeHalfPt = 22, forceBold = false) => {
    const parsed = parseInlineMarks(text);
    return parsed.map((r) => {
      const runOpts = {
        text: r.text,
        font: r.code ? 'Consolas' : fontName,
        size: r.code ? baseSizeHalfPt - 2 : baseSizeHalfPt,
        bold: forceBold || Boolean(r.bold),
        italics: Boolean(r.italic),
        color: r.href ? 'C71048' : baseColor,
        language: { value: lang },
        shading: r.code
          ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F6F8' }
          : undefined,
      };
      if (r.href) {
        return new ExternalHyperlink({
          link: r.href,
          children: [new TextRun({ ...runOpts, style: 'Hyperlink' })],
        });
      }
      return new TextRun(runOpts);
    });
  };

  async function resolveHeroPng(heroId: HeroAssetId): Promise<Uint8Array | null> {
    if (opts.heroPngMap?.[heroId]) return opts.heroPngMap[heroId]!;
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`./press-assets/heroes/${heroId}.png`).catch(() =>
          fetch(`/press-assets/heroes/${heroId}.png`)
        );
        if (res && res.ok) {
          const buf = await res.arrayBuffer();
          return new Uint8Array(buf);
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [];

  // Document Title & Subtitle using named Title style (I8)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${doc.meta.market.toUpperCase()} · ${doc.meta.docType.replace(/_/g, ' ').toUpperCase()}`,
          font: fontName,
          size: 18,
          bold: true,
          color: '0A7571',
          language: { value: lang },
        }),
      ],
      spacing: { after: 60 },
    })
  );

  children.push(
    new Paragraph({
      style: 'Title',
      children: [
        new TextRun({
          text: doc.meta.title,
          font: fontName,
          size: 44,
          bold: true,
          color: '14161C',
          language: { value: lang },
        }),
      ],
      spacing: { after: doc.meta.subtitle ? 80 : 200 },
    })
  );

  if (doc.meta.subtitle) {
    children.push(
      new Paragraph({
        style: 'Normal',
        children: [
          new TextRun({
            text: doc.meta.subtitle,
            font: fontName,
            size: 22,
            italics: true,
            color: '5B6270',
            language: { value: lang },
          }),
        ],
        spacing: { after: 220 },
      })
    );
  }

  const headings = doc.blocks.filter((b) => b.type === 'heading' && b.text);

  for (const b of doc.blocks) {
    switch (b.type) {
      case 'toc': {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: b.title || 'Contents',
                font: fontName,
                bold: true,
                size: 28,
                color: '14161C',
                language: { value: lang },
              }),
            ],
            spacing: { before: 160, after: 100 },
          })
        );
        headings.forEach((h, i) => {
          children.push(
            new Paragraph({
              style: 'Normal',
              children: [
                new TextRun({
                  text: `${i + 1}. `,
                  font: fontName,
                  bold: true,
                  size: 21,
                  color: i % 2 === 0 ? 'C71048' : '0A7571',
                  language: { value: lang },
                }),
                new TextRun({
                  text: h.text ?? '',
                  font: fontName,
                  size: 21,
                  color: '14161C',
                  language: { value: lang },
                }),
              ],
              spacing: { after: 60 },
            })
          );
        });
        break;
      }

      case 'heading': {
        if (b.eyebrow) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: b.eyebrow.toUpperCase(),
                  font: fontName,
                  size: 17,
                  bold: true,
                  color: '0A7571',
                  language: { value: lang },
                }),
              ],
              spacing: { before: 180, after: 40 },
            })
          );
        }
        const hLevel =
          b.level === 1 ? HeadingLevel.HEADING_1 : b.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
        const hSize = b.level === 1 ? 32 : b.level === 2 ? 26 : 23;
        children.push(
          new Paragraph({
            heading: hLevel,
            children: makeRuns(b.text ?? '', '14161C', hSize, true),
            spacing: { before: b.eyebrow ? 20 : 180, after: 100 },
          })
        );
        break;
      }

      case 'paragraph': {
        children.push(
          new Paragraph({
            style: 'Normal',
            children: makeRuns(b.text ?? '', '14161C', 22),
            spacing: { after: 140 },
          })
        );
        break;
      }

      case 'bullets': {
        for (const it of b.items ?? []) {
          children.push(
            new Paragraph({
              style: 'Normal',
              bullet: { level: 0 },
              children: makeRuns(it, '14161C', 22),
              spacing: { after: 80 },
            })
          );
        }
        break;
      }

      case 'numbered': {
        (b.items ?? []).forEach((it, idx) => {
          const numColor = idx % 2 === 0 ? 'C71048' : '0A7571';
          children.push(
            new Paragraph({
              style: 'Normal',
              children: [
                new TextRun({
                  text: `${idx + 1}. `,
                  font: fontName,
                  size: 22,
                  bold: true,
                  color: numColor,
                  language: { value: lang },
                }),
                ...makeRuns(it, '14161C', 22),
              ],
              spacing: { after: 90 },
            })
          );
        });
        break;
      }

      case 'kpi_row': {
        const kpis = b.kpis ?? [];
        if (kpis.length > 0) {
          const colWidthPct = Math.floor(100 / kpis.length);
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: kpis.map(
                    (k) =>
                      new TableCell({
                        width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F6F8' },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                          left: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                          right: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                        },
                        margins: { top: 120, bottom: 120, left: 140, right: 140 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: k.label.toUpperCase(),
                                font: fontName,
                                size: 17,
                                bold: true,
                                color: '5B6270',
                                language: { value: lang },
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: k.value,
                                font: fontName,
                                size: 30,
                                bold: true,
                                color: 'C71048',
                                language: { value: lang },
                              }),
                            ],
                            spacing: { before: 40, after: k.note ? 40 : 0 },
                          }),
                          ...(k.note
                            ? [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: k.note,
                                      font: fontName,
                                      size: 18,
                                      color: '5B6270',
                                      language: { value: lang },
                                    }),
                                  ],
                                }),
                              ]
                            : []),
                        ],
                      })
                  ),
                }),
              ],
            })
          );
          children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }
        break;
      }

      case 'table': {
        const headers = b.headers ?? [];
        if (headers.length > 0) {
          const colW = Math.floor(100 / headers.length);
          const headerRow = new TableRow({
            tableHeader: true,
            children: headers.map(
              (h) =>
                new TableCell({
                  width: { size: colW, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: 'auto', fill: '14161C' },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: '14161C' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: '14161C' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: '2A2E3A' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: '2A2E3A' },
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: h,
                          font: fontName,
                          size: 20,
                          bold: true,
                          color: 'FFFFFF',
                          language: { value: lang },
                        }),
                      ],
                    }),
                  ],
                })
            ),
          });

          const dataRows = (b.rows ?? []).map((r, rIdx) => {
            const fill = rIdx % 2 === 1 ? 'F5F6F8' : 'FFFFFF';
            return new TableRow({
              children: r.map((cellText, cIdx) => {
                const isKey = b.highlightCol === cIdx;
                return new TableCell({
                  width: { size: colW, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: 'auto', fill },
                  margins: { top: 90, bottom: 90, left: 120, right: 120 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: 'E1E4EA' },
                  },
                  children: [
                    new Paragraph({
                      children: makeRuns(cellText, isKey ? 'C71048' : '14161C', 20, isKey),
                    }),
                  ],
                });
              }),
            });
          });

          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...dataRows],
            })
          );
          children.push(new Paragraph({ text: '', spacing: { after: 140 } }));
        }
        break;
      }

      case 'callout': {
        // Single-cell shaded table instead of floating textbox so Google Docs (V19) and enterprise wikis (I3) preserve layout!
        const isTip = b.variant === 'tip';
        const isCtx = b.variant === 'context';
        const fill = isTip ? 'E4FAF9' : isCtx ? 'F5F6F8' : 'FDE7EE';
        const borderCol = isTip ? '0A7571' : isCtx ? '5B6270' : 'F0245C';
        const labelCol = isTip ? '0A7571' : isCtx ? '5B6270' : 'C71048';
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, color: 'auto', fill },
                    margins: { top: 120, bottom: 120, left: 160, right: 160 },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: borderCol },
                      top: { style: BorderStyle.SINGLE, size: 2, color: fill },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: fill },
                      right: { style: BorderStyle.SINGLE, size: 2, color: fill },
                    },
                    children: [
                      new Paragraph({
                        style: 'Callout',
                        children: [
                          new TextRun({
                            text: (b.title || (isTip ? 'TIP / NOTE' : isCtx ? 'CONTEXT' : 'KEY POINT')).toUpperCase(),
                            font: fontName,
                            size: 18,
                            bold: true,
                            color: labelCol,
                            language: { value: lang },
                          }),
                        ],
                        spacing: { after: 50 },
                      }),
                      new Paragraph({
                        style: 'Callout',
                        children: makeRuns(b.text ?? '', '14161C', 21),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        break;
      }

      case 'quote': {
        children.push(
          new Paragraph({
            style: 'Callout',
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F6F8' },
            children: makeRuns(`"${b.text ?? ''}"`, '14161C', 24, true),
            spacing: { before: 140, after: 160 },
          })
        );
        break;
      }

      case 'hero_image': {
        const png = await resolveHeroPng(b.heroId ?? 'glyph');
        if (png) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: png,
                  type: 'png',
                  transformation: { width: 360, height: 135 },
                  altText: {
                    title: b.heroId ?? 'Signal Hero',
                    description: b.alt ?? 'Signal flat vector illustration',
                    name: b.heroId ?? 'glyph',
                  },
                }),
              ],
              spacing: { before: 80, after: b.caption ? 40 : 140 },
            })
          );
        }
        if (b.caption) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: b.caption,
                  font: fontName,
                  size: 18,
                  italics: true,
                  color: '5B6270',
                  language: { value: lang },
                }),
              ],
              spacing: { after: 140 },
            })
          );
        }
        break;
      }

      case 'divider': {
        children.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E1E4EA' } },
            spacing: { before: 100, after: 140 },
          })
        );
        break;
      }

      case 'page_break': {
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      }

      case 'source_note': {
        children.push(
          new Paragraph({
            style: 'Normal',
            children: makeRuns(b.text ?? '', '5B6270', 18),
            spacing: { after: 60 },
          })
        );
        break;
      }
    }
  }

  const wordDoc = new Document({
    creator: doc.meta.author || 'Signal Press',
    title: doc.meta.title,
    subject: doc.meta.subtitle || doc.meta.docType,
    description: `Signal Press ${opts.tunedForGoogleDocs ? 'Google Docs Tuned ' : ''}A4 Export (${lang})`,
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: 22,
            color: '14161C',
            language: { value: lang },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: fontName, size: 44, bold: true, color: '14161C' },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: fontName, size: 32, bold: true, color: '14161C' },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: fontName, size: 26, bold: true, color: '14161C' },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: fontName, size: 23, bold: true, color: '14161C' },
        },
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: fontName, size: 22, color: '14161C' },
        },
        {
          id: 'Callout',
          name: 'Callout',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: fontName, size: 21, color: '14161C' },
        },
      ],
    },
    sections: [
      {
        properties: {
          // A4 portrait: 210mm x 297mm = 11906 x 16838 twips; margins ~14mm top/bottom (794 twips), 15mm left/right (850 twips)
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 794, bottom: 794, left: 850, right: 850 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `SIGNAL PRESS · ${doc.meta.market} · ${doc.meta.title}`,
                    font: fontName,
                    size: 16,
                    color: '5B6270',
                    language: { value: lang },
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${doc.meta.updatedAt} · Page `,
                    font: fontName,
                    size: 16,
                    color: '5B6270',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: fontName,
                    size: 16,
                    color: '5B6270',
                  }),
                  new TextRun({
                    text: ' of ',
                    font: fontName,
                    size: 16,
                    color: '5B6270',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: fontName,
                    size: 16,
                    color: '5B6270',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(wordDoc);
  return new Uint8Array(buf);
}
