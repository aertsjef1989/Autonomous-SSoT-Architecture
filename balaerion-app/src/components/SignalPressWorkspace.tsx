'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { consumePressDocHandoffFromLocalStorage, loadHandoffFromLocalStorage } from '../lib/signal-handoff';
import {
  ALL_HERO_ASSET_IDS,
  PRESS_THEMES,
  estimateA4Pages,
  validatePressDocument,
  type ExportFormat,
  type HeroAssetId,
  type PressAudience,
  type PressBlock,
  type PressBlockType,
  type PressDocument,
  type PressLanguage,
  type PressThemeId,
  type SourceClassification,
} from '../lib/press/schema';
import { PRESS_TEMPLATES, getTemplateById } from '../lib/press/templates';
import { autoFixDashes, runBlockingPreExportLint, type LintFinding } from '../lib/press/lint';
import { importMarkdownToPress, importProspectBriefJson } from '../lib/press/importers';
import { exportPressToMarkdown } from '../lib/press/export-markdown';
import { exportPressToEmailHtml } from '../lib/press/export-email-html';
import { renderPressToPrintHtml } from '../lib/press/export-pdf-html';

const AUTOSAVE_STORAGE_KEY = 'signal_press_offline_autosave_v1';

const UI_STRINGS = {
  en: {
    modeBadge: 'OFFLINE MODE · ZERO NETWORK CALLS',
    subtitle:
      'Client-side A4 document designer in the Signal system. Styling renders dynamically at export time; content stays theme-free and never leaves your browser.',
    templateLabel: 'Template',
    themeLabel: 'Preview Theme',
    langLabel: 'Doc Language',
    audienceLabel: 'Audience',
    nlBePack: 'NL/BE Rule Pack (Province Geo & Advisory)',
    autosaveOff: 'Autosave: OFF',
    autosaveOn: 'Autosave: ON (Browser Only)',
    clearLocal: 'Clear Local Storage',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    addBlock: 'Add Block',
    importTab: 'Import MD / JSON',
    samplesTab: 'Pre-Rendered Replay Samples',
    lintClean: 'Pre-Export Lint Passed: 0 blocking issues.',
    lintBlocked: 'EXPORT BLOCKED BY PRE-EXPORT LINT:',
    autoFixDashes: 'Auto-Fix Em/En Dashes',
  },
  nl: {
    modeBadge: 'OFFLINE MODUS · GEEN NETWERKVERZOEKEN',
    subtitle:
      'Client-side A4 documentontwerper in het Signal-systeem. Opmaak wordt pas bij export toegepast; inhoud blijft themavrij en verlaat uw browser niet.',
    templateLabel: 'Sjabloon',
    themeLabel: 'Weergavethema',
    langLabel: 'Documenttaal',
    audienceLabel: 'Doelgroep',
    nlBePack: 'NL/BE Regelpakket (Provincie-geo & Advieskader)',
    autosaveOff: 'Automatisch opslaan: UIT',
    autosaveOn: 'Automatisch opslaan: AAN (Alleen browser)',
    clearLocal: 'Lokale opslag wissen',
    undo: 'Ongedaan maken (Ctrl+Z)',
    redo: 'Opnieuw (Ctrl+Y)',
    addBlock: 'Blok toevoegen',
    importTab: 'Importeer MD / JSON',
    samplesTab: 'Vooraf gerenderde voorbeelden',
    lintClean: 'Pre-export controle geslaagd: 0 blokkerende fouten.',
    lintBlocked: 'EXPORT GEBLOKKEERD DOOR LINT-CONTROLE:',
    autoFixDashes: 'Herstel gedachtestreepjes automatisch',
  },
} as const;

const CUSTOM_HERO_LABELS: Record<string, string> = {
  glyph: 'Signal two-dot glyph',
  H57: 'H57 · Multi-LLM Two-Lane Router',
  H58: 'H58 · Pre-Dispatch PII & Lane Gate',
  H59: 'H59 · Pixel + Server CAPI event_id Dedup',
  H60: 'H60 · Readiness Radar & 7-State Funnel',
  H61: 'H61 · Bivariate Poisson Scoreline Heatmap',
  H62: 'H62 · Attack vs Defense xG Quadrant',
  H63: 'H63 · Unit-Share NAV Waterfall',
};

const BLOCK_TYPES: PressBlockType[] = [
  'heading',
  'paragraph',
  'bullets',
  'numbered',
  'table',
  'kpi_row',
  'comparison_matrix',
  'timeline_roadmap',
  'checklist_gate',
  'two_column_split',
  'stat_delta_strip',
  'callout',
  'quote',
  'hero_image',
  'divider',
  'source_note',
  'page_break',
  'toc',
];

function createDefaultBlock(type: PressBlockType, defaultSourceId?: string): PressBlock {
  const id = `blk-${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case 'heading':
      return { id, type, level: 2, eyebrow: 'SECTION', text: 'New Section Heading' };
    case 'paragraph':
      return { id, type, text: 'Enter structured paragraph copy here.', sourceId: defaultSourceId };
    case 'bullets':
      return { id, type, items: ['First concise point.', 'Second concise point.'], sourceId: defaultSourceId };
    case 'numbered':
      return { id, type, items: ['Step one.', 'Step two.'], sourceId: defaultSourceId };
    case 'table':
      return {
        id,
        type,
        headers: ['Item', 'Owner', 'Status'],
        rows: [['Verification Gate', 'QA Lead', 'On track']],
        highlightCol: 2,
        sourceId: defaultSourceId,
      };
    case 'kpi_row':
      return {
        id,
        type,
        sourceId: defaultSourceId,
        kpis: [
          { label: 'Target Metric', value: '95%', note: 'Baseline target', sourceId: defaultSourceId },
          { label: 'Review Window', value: '30 days', note: 'Archive cutoff', sourceId: defaultSourceId },
        ],
      };
    case 'comparison_matrix':
      return {
        id,
        type,
        title: 'Architecture Option Comparison',
        headers: ['Dimension', 'Legacy Manual', 'Signal Target'],
        rows: [
          ['Verification Cadence', 'Ad-hoc quarterly', 'Automated daily scan'],
          ['Publish Gate', 'Unverified edits', 'Human sign-off required'],
        ],
        highlightCol: 2,
        sourceId: defaultSourceId,
      };
    case 'timeline_roadmap':
      return {
        id,
        type,
        title: 'Implementation Roadmap',
        milestones: [
          { phase: 'Phase 1', title: 'Staging Tag & Event Hygiene', detail: 'Configure deterministic event_id on staging.', status: 'done' },
          { phase: 'Phase 2', title: 'Province-Scope Activation', detail: 'Launch initial regional campaign structure.', status: 'active' },
          { phase: 'Phase 3', title: 'Holdout Lift Review', detail: 'Verify conversion quality before scaling.', status: 'planned' },
        ],
        sourceId: defaultSourceId,
      };
    case 'checklist_gate':
      return {
        id,
        type,
        title: 'Pre-Launch Governance Gate',
        checklist: [
          { item: 'Owner assigned and escalation cadence active', state: 'pass', owner: 'Ops Lead' },
          { item: 'Server-side event deduplication verified', state: 'pass', owner: 'Client Eng' },
          { item: 'Human sign-off recorded prior to publish', state: 'pending', owner: 'Reviewer' },
        ],
        sourceId: defaultSourceId,
      };
    case 'two_column_split':
      return {
        id,
        type,
        leftTitle: 'Advisory Guidance',
        leftItems: ['Provide structured technical playbook.', 'Validate staging payload schema.'],
        rightTitle: 'Client Team Execution',
        rightItems: ['Deploy tags inside client GTM container.', 'Approve regional campaign launch.'],
        sourceId: defaultSourceId,
      };
    case 'stat_delta_strip':
      return {
        id,
        type,
        deltas: [
          { metric: 'Automation Runs', baseline: '1,700/mo', target: '30/mo', delta: '-98.2%' },
          { metric: 'Health Threshold', baseline: 'Unscored', target: '>= 80 pts', delta: '10/10 Controls' },
        ],
        sourceId: defaultSourceId,
      };
    case 'callout':
      return { id, type, variant: 'key', title: 'KEY POINT', text: 'State the single decision-critical takeaway.' };
    case 'quote':
      return { id, type, text: 'A single high-leverage statement worth pausing on.' };
    case 'hero_image':
      return { id, type, heroId: 'glyph', alt: 'Signal geometric two-dot emblem', caption: 'Signal Design System illustration' };
    case 'divider':
      return { id, type };
    case 'source_note':
      return { id, type, sourceId: defaultSourceId, text: `[${defaultSourceId ?? 'SRC-1'}] [VERIFIED] Primary specification reference.` };
    case 'page_break':
      return { id, type };
    case 'toc':
      return { id, type, title: 'Contents' };
  }
}

export interface SignalPressWorkspaceProps {
  assetBasePath?: string;
  samplesBasePath?: string;
  renderWorkspaceSlot?: (ctx: {
    doc: PressDocument;
    commitDoc: (next: PressDocument) => void;
  }) => React.ReactNode;
}

export function SignalPressWorkspace({
  assetBasePath = '/press-assets',
  samplesBasePath = '/press-samples',
  renderWorkspaceSlot,
}: SignalPressWorkspaceProps) {
  const [uiLang, setUiLang] = useState<'en' | 'nl'>('en');
  const [doc, setDoc] = useState<PressDocument>(() => PRESS_TEMPLATES[0].createDocument());
  const [past, setPast] = useState<PressDocument[]>([]);
  const [future, setFuture] = useState<PressDocument[]>([]);

  const [autosave, setAutosave] = useState(false);
  const [nlBePack, setNlBePack] = useState(true);
  const [customEmployers, setCustomEmployers] = useState('');
  const [newBlockType, setNewBlockType] = useState<PressBlockType>('paragraph');

  const [showImporter, setShowImporter] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [importFilename, setImportFilename] = useState('DOC_FMT_NL_001_Attribution_Guide.md');
  const [importText, setImportText] = useState('');
  const [mismatches, setMismatches] = useState<string[]>([]);

  const [blockingFindings, setBlockingFindings] = useState<LintFinding[] | null>(null);
  const [statusBanner, setStatusBanner] = useState<string>('');

  const t = UI_STRINGS[uiLang];

  // Offline asset cache: fetch same-origin fonts and hero SVGs once at load, then serve them to
  // the preview and print iframes as blob: URLs / inline SVG. After this, editing, preview and
  // export work with the network fully disconnected.
  const [fontUrls, setFontUrls] = useState<Partial<Record<'regular' | 'bold' | 'italic', string>>>({});
  const [heroSvgs, setHeroSvgs] = useState<Record<string, string>>({});
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    const fontFiles = { regular: 'Carlito-Regular.ttf', bold: 'Carlito-Bold.ttf', italic: 'Carlito-Italic.ttf' } as const;
    (async () => {
      const nextFonts: Partial<Record<'regular' | 'bold' | 'italic', string>> = {};
      for (const [key, file] of Object.entries(fontFiles) as Array<[keyof typeof fontFiles, string]>) {
        try {
          const res = await fetch(`${assetBasePath}/fonts/${file}`);
          if (!res.ok) continue;
          const buf = new Uint8Array(await res.arrayBuffer());
          let bin = '';
          for (let i = 0; i < buf.length; i += 8192) {
            bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 8192)));
          }
          nextFonts[key] = `data:font/ttf;base64,${btoa(bin)}`;
        } catch {
          /* fall back to the plain asset URL */
        }
      }
      const nextHeroes: Record<string, string> = {};
      for (const hid of ['glyph', 'H01', 'H02', 'H03']) {
        try {
          const res = await fetch(`${assetBasePath}/heroes/${hid}.svg`);
          if (!res.ok) continue;
          const svg = await res.text();
          if (svg.trim().startsWith('<svg') && !/<script/i.test(svg)) nextHeroes[hid] = svg;
        } catch {
          /* fall back to the plain asset URL */
        }
      }
      try {
        if (typeof document !== 'undefined' && document.fonts) {
          await Promise.all([
            document.fonts.load("400 14px 'Carlito'"),
            document.fonts.load("700 14px 'Carlito'"),
            document.fonts.load("italic 400 14px 'Carlito'"),
          ]);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setFontUrls(nextFonts);
        setHeroSvgs(nextHeroes);
        setOfflineReady(true);
      }
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [assetBasePath]);

  useEffect(() => {
    const directPressDoc = consumePressDocHandoffFromLocalStorage();
    if (directPressDoc) {
      setDoc(directPressDoc);
      setStatusBanner(`Loaded workspace A4 handoff: "${directPressDoc.meta.title}".`);
      return;
    }
    const handoff = loadHandoffFromLocalStorage();
    if (handoff && handoff.slides.length > 0) {
      const converted: PressDocument = {
        schemaVersion: 'signal-press-doc-v1',
        meta: {
          title: handoff.deckTitle,
          subtitle: `Converted from Signal Studio (${handoff.slides.length} slides)`,
          author: 'Signal Studio Handoff',
          language: 'en-GB',
          market: handoff.market || 'NL/BE',
          docType: 'one_pager',
          audience: 'internal',
          templateId: 'tpl-one-pager',
          themeId: handoff.theme,
          updatedAt: handoff.updatedAt,
        },
        sources: [
          {
            id: 'SRC-STUDIO',
            label: `Signal Studio Handoff (${handoff.deckTitle})`,
            reference: 'signal-handoff-v1',
            classification: 'verified',
          },
        ],
        blocks: [
          { id: 'ho-obj', type: 'heading', level: 1, eyebrow: 'STUDIO HANDOFF', text: 'Objective & Slide Summary' },
          ...handoff.slides.flatMap((s, idx): PressBlock[] => [
            { id: `ho-h-${idx}`, type: 'heading', level: 2, eyebrow: s.eyebrow, text: s.title },
            { id: `ho-p-${idx}`, type: 'paragraph', text: s.body, sourceId: 'SRC-STUDIO' },
            ...(s.callout
              ? [{ id: `ho-c-${idx}`, type: 'callout' as const, variant: 'tip' as const, title: 'SLIDE CALLOUT', text: s.callout, sourceId: 'SRC-STUDIO' }]
              : []),
          ]),
          { id: 'ho-ctrl', type: 'heading', level: 2, text: 'Key Architecture Controls' },
          { id: 'ho-src', type: 'source_note', sourceId: 'SRC-STUDIO', text: '[SRC-STUDIO] [VERIFIED] Imported offline via localStorage handoff.' },
        ],
      };
      setDoc(converted);
      setStatusBanner(`Loaded Signal Studio handoff: "${handoff.deckTitle}".`);
    }
  }, []);

  const commitDoc = useCallback(
    (next: PressDocument) => {
      setPast((p) => [...p.slice(-29), doc]);
      setFuture([]);
      setDoc(next);
      setBlockingFindings(null);
      if (autosave) {
        try {
          window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(next));
        } catch {
          setStatusBanner('Warning: Browser localStorage quota reached; autosave skipped.');
        }
      }
    },
    [doc, autosave]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [doc, ...f]);
    setDoc(prev);
  }, [past, doc]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const nxt = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, doc]);
    setDoc(nxt);
  }, [future, doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const liveLint = useMemo(
    () =>
      runBlockingPreExportLint(doc, {
        enableNlBeRulePack: nlBePack,
        customEmployerTerms: customEmployers.split(','),
      }),
    [doc, nlBePack, customEmployers]
  );

  const fit = useMemo(() => estimateA4Pages(doc), [doc]);
  const activeTheme = PRESS_THEMES[doc.meta.themeId];
  const previewHtml = useMemo(
    () =>
      renderPressToPrintHtml(doc, {
        variant: activeTheme.dark ? 'dark' : 'light',
        assetBasePath,
        fontUrls,
        inlineHeroSvgs: heroSvgs,
      }),
    [doc, activeTheme.dark, assetBasePath, fontUrls, heroSvgs]
  );

  const selectTemplate = (tplId: string) => {
    const tpl = getTemplateById(tplId);
    commitDoc(tpl.createDocument());
    setMismatches([]);
    setStatusBanner(`Loaded template: ${tpl.name}`);
  };

  const toggleAutosave = () => {
    const next = !autosave;
    setAutosave(next);
    if (next) {
      try {
        window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(doc));
        setStatusBanner('Autosave enabled (stored in this browser localStorage only; never transmitted).');
      } catch {
        setStatusBanner('localStorage is unavailable in this browser context.');
      }
    }
  };

  const clearLocalData = () => {
    try {
      window.localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
      window.localStorage.removeItem('signal_press_handoff_v1');
      setAutosave(false);
      setStatusBanner('Cleared all Signal Press data from browser localStorage.');
    } catch {
      setStatusBanner('Could not access localStorage.');
    }
  };

  const triggerDownload = (bytesOrText: Uint8Array | string, filename: string, mime: string) => {
    const blob =
      typeof bytesOrText === 'string'
        ? new Blob([bytesOrText], { type: mime })
        : new Blob([bytesOrText as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleExport = async (format: ExportFormat) => {
    const report = runBlockingPreExportLint(doc, {
      enableNlBeRulePack: nlBePack,
      customEmployerTerms: customEmployers.split(','),
      targetFormat: format,
    });
    if (!report.passed) {
      setBlockingFindings(report.findings);
      setStatusBanner('');
      return;
    }
    setBlockingFindings(null);

    const slug =
      doc.meta.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'signal-document';

    if (format === 'markdown') {
      const md = exportPressToMarkdown(doc);
      triggerDownload(md, `${slug}.md`, 'text/markdown;charset=utf-8');
      setStatusBanner(`Exported ${slug}.md`);
      return;
    }

    if (format === 'email_html') {
      const html = exportPressToEmailHtml(doc);
      triggerDownload(html, `${slug}-email.html`, 'text/html;charset=utf-8');
      setStatusBanner(`Exported table-based inline-CSS ${slug}-email.html`);
      return;
    }

    if (format === 'docx' || format === 'gdocs_docx') {
      const { exportPressToDocxBytes } = await import('../lib/press/export-docx');
      const bytes = await exportPressToDocxBytes(doc, { tunedForGoogleDocs: format === 'gdocs_docx' });
      const suffix = format === 'gdocs_docx' ? '-gdocs.docx' : '.docx';
      triggerDownload(
        bytes,
        `${slug}${suffix}`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      setStatusBanner(`Exported Light-surface A4 Word file ${slug}${suffix}`);
      return;
    }

    if (format === 'pdf_dark' || format === 'pdf_light') {
      const variant = format === 'pdf_dark' ? 'dark' : 'light';
      const html = renderPressToPrintHtml(doc, { variant, assetBasePath, fontUrls, inlineHeroSvgs: heroSvgs });
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const win = iframe.contentWindow;
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => {
          win.focus();
          win.print();
          setTimeout(() => document.body.removeChild(iframe), 1500);
        }, 350);
      }
      setStatusBanner(`Opened A4 ${variant.toUpperCase()} print/PDF dialog (selectable text, Carlito embedded).`);
    }
  };

  const handleImportRun = (kind: 'markdown' | 'json') => {
    try {
      const res =
        kind === 'markdown'
          ? importMarkdownToPress(importText, importFilename)
          : importProspectBriefJson(importText);
      const check = validatePressDocument(res.doc);
      if (!check.valid) {
        setStatusBanner(`Import validation failed: ${check.errors.join(' ')}`);
        return;
      }
      commitDoc(res.doc);
      setMismatches(res.mismatches);
      setStatusBanner(`Imported "${res.doc.meta.title}" (${res.mismatches.length} mismatch notes).`);
    } catch (err) {
      setStatusBanner(`Import error: ${err instanceof Error ? err.message : 'Invalid input'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      setImportText(content);
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const res = importProspectBriefJson(content);
          commitDoc(res.doc);
          setMismatches(res.mismatches);
          setStatusBanner(`Imported JSON file "${file.name}".`);
        } catch (err) {
          setStatusBanner(`JSON import failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
        }
      } else {
        const res = importMarkdownToPress(content, file.name);
        commitDoc(res.doc);
        setMismatches(res.mismatches);
        setStatusBanner(`Imported Markdown file "${file.name}".`);
      }
    };
    reader.readAsText(file);
  };

  const updateBlock = (idx: number, patch: Partial<PressBlock>) => {
    const nextBlocks = doc.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    commitDoc({ ...doc, blocks: nextBlocks });
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= doc.blocks.length) return;
    const copy = [...doc.blocks];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    commitDoc({ ...doc, blocks: copy });
  };

  const duplicateBlock = (idx: number) => {
    const orig = doc.blocks[idx];
    const clone: PressBlock = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `blk-${Math.random().toString(36).slice(2, 9)}`,
    };
    const copy = [...doc.blocks];
    copy.splice(idx + 1, 0, clone);
    commitDoc({ ...doc, blocks: copy });
  };

  const deleteBlock = (idx: number) => {
    if (doc.blocks.length <= 1) return;
    commitDoc({ ...doc, blocks: doc.blocks.filter((_, i) => i !== idx) });
  };

  const addBlock = () => {
    const defaultSrc = doc.sources[0]?.id;
    commitDoc({ ...doc, blocks: [...doc.blocks, createDefaultBlock(newBlockType, defaultSrc)] });
  };

  const findings = blockingFindings ?? liveLint.findings;
  const showLintAlert = Boolean(blockingFindings) || !liveLint.passed;

  return (
    <div className="press-root" data-offline-ready={offlineReady ? 'true' : 'false'}>
      <style>{`
        .press-root{--bg:#0B0C10;--card:#15171F;--line:#2A2E3A;--txt:#fff;--mist:#B9C0CE;--faint:#7A828F;--pink:#F0245C;--cyan:#21E0DC;
          background:var(--bg);color:var(--txt);font-family:Carlito,Calibri,system-ui,sans-serif;
          display:grid;grid-template-columns:340px minmax(0,1fr);min-height:calc(100vh - 0px);max-width:100%;min-width:0;border:1px solid var(--line)}
        .press-root,.press-root *{box-sizing:border-box}
        .press-root aside{border-right:1px solid var(--line);padding:18px;overflow:auto;max-height:100vh;min-width:0}
        .press-root h1{font-size:17px;margin:0 0 4px;font-weight:700}
        .press-root .sub{color:var(--faint);font-size:12px;margin-bottom:12px;line-height:1.4}
        .press-root .badge{display:inline-block;font-size:9.5px;letter-spacing:2px;color:var(--cyan);border:1px solid var(--line);border-radius:4px;padding:3px 7px;margin-bottom:10px}
        .press-root label{display:block;font-size:11px;color:var(--mist);margin:10px 0 4px;text-transform:uppercase;letter-spacing:1px;max-width:100%;min-width:0}
        .press-root label.chk{display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--txt);cursor:pointer}
        .press-root label.chk input{width:16px;height:16px;accent-color:var(--cyan);padding:0}
        .press-root select,.press-root input,.press-root textarea,.press-root button{width:100%;max-width:100%;min-width:0;background:var(--card);border:1px solid var(--line);color:var(--txt);padding:8px 10px;border-radius:6px;font:inherit;font-size:13px}
        .press-root textarea{min-height:64px;resize:vertical;line-height:1.4}
        .press-root textarea.mono,.press-root input.mono{font-family:ui-monospace,Menlo,monospace;font-size:12px}
        .press-root button{cursor:pointer;margin-top:8px;white-space:normal;word-break:break-word}
        .press-root button:hover:not(:disabled){border-color:var(--cyan)}
        .press-root button:disabled{opacity:.4;cursor:default}
        .press-root button.pri{border-color:var(--cyan);color:var(--cyan)}
        .press-root button.hot{border-color:var(--pink);color:var(--pink)}
        .press-root button.solid{background:var(--cyan);color:#0B0C10;border-color:var(--cyan);font-weight:700}
        .press-root .row{display:flex;gap:8px;min-width:0}
        .press-root .row>*{flex:1;min-width:0}
        .press-root .row button{margin-top:0}
        .press-root .grp{margin:18px 0 2px;font-size:10px;letter-spacing:2px;color:var(--cyan);border-top:1px solid var(--line);padding-top:12px;text-transform:uppercase}
        .press-root .hint{color:var(--faint);font-size:10.5px;margin-top:3px;line-height:1.35}
        .press-root code{color:var(--cyan);font-size:11px}
        .press-root ol.blocks{list-style:none;margin:10px 0;padding:0}
        .press-root ol.blocks>li{background:var(--card);border:1px solid var(--line);border-radius:5px;padding:8px;margin-bottom:6px}
        .press-root ol.blocks>li.draft{border-color:var(--pink)}
        .press-root .bhead{display:flex;gap:6px;align-items:center;font-size:12px;margin-bottom:6px}
        .press-root .bhead .n{color:var(--faint);font-size:10px;width:16px}
        .press-root .bhead .ty{text-transform:uppercase;letter-spacing:1px;font-size:10.5px;color:var(--mist)}
        .press-root .bhead .tools{margin-left:auto;display:flex;gap:2px}
        .press-root .bhead .tools button{width:auto;margin:0;padding:2px 7px;background:none;border-color:transparent;color:var(--faint);font-size:12px}
        .press-root .bhead .tools button:hover{color:var(--cyan);border-color:var(--line)}
        .press-root .bhead .tools button.x:hover{color:var(--pink)}
        .press-root .bfields>*+*{margin-top:6px}
        .press-root main{padding:22px;overflow:auto;display:flex;flex-direction:column;gap:14px;align-items:center;min-width:0}
        .press-root .bar{width:100%;max-width:900px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .press-root .bar b{font-size:13px}
        .press-root .bar .sp{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
        .press-root .bar button{width:auto;margin:0;padding:7px 14px}
        .press-root .fit{font-size:11px;letter-spacing:1px;padding:4px 8px;border-radius:4px;border:1px solid var(--line)}
        .press-root .fit.ok{color:var(--cyan)}
        .press-root .fit.bad{color:var(--pink);border-color:var(--pink)}
        .press-root .panel{width:100%;max-width:900px;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:14px;font-size:13px}
        .press-root .panel h2{margin:0 0 8px;font-size:10px;letter-spacing:2px;color:var(--cyan);font-weight:400;text-transform:uppercase}
        .press-root .panel.alert{border-color:var(--pink)}
        .press-root .panel.alert strong{color:var(--pink);font-size:12.5px}
        .press-root .panel ul{margin:6px 0 0;padding-left:18px;line-height:1.5}
        .press-root .status{width:100%;max-width:900px;font-size:12px;color:var(--cyan);border-left:2px solid var(--cyan);padding:4px 10px}
        .press-root .lintok{width:100%;max-width:900px;font-size:11px;color:var(--faint);letter-spacing:.5px}
        .press-root .lintok b{color:var(--cyan);font-weight:400}
        .press-root table{width:100%;min-width:520px;border-collapse:collapse;font-size:12.5px}
        .press-root th{color:var(--cyan);text-align:left;padding:6px;font-weight:400;font-size:10.5px;letter-spacing:1px;text-transform:uppercase}
        .press-root td{padding:6px;border-top:1px solid var(--line)}
        .press-root td a{color:var(--cyan)}
        .press-root .stage{width:100%;max-width:900px;box-shadow:0 0 0 1px var(--line)}
        .press-root .stage iframe{width:100%;height:1080px;border:0;display:block}
        .press-root .mobile-edit-toggle{display:none}
        @media (max-width:900px){
          .press-root{grid-template-columns:minmax(0,1fr)}
          .press-root aside{border-right:0;border-bottom:1px solid var(--line);max-height:none}
          .press-root main{padding:14px}
          .press-root .stage iframe{height:720px}
          .press-root .mobile-edit-toggle{display:block}
          .press-root .press-editor-col[data-mobile-open="false"]{display:none}
          .press-root select,.press-root input:not([type=checkbox]),.press-root button{min-height:44px}
          .press-root .bhead .tools button{min-width:44px}
        }
      `}</style>

      <aside>
        <span className="badge">{t.modeBadge}</span>
        <h1>Signal Press</h1>
        <div className="sub">{t.subtitle}</div>

        <label>{t.templateLabel}</label>
        <select value={doc.meta.templateId} onChange={(e) => selectTemplate(e.target.value)}>
          {PRESS_TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {uiLang === 'nl' ? tpl.nameNl : tpl.name} ({tpl.audience})
            </option>
          ))}
        </select>
        <div className="row">
          <div>
            <label>{t.themeLabel}</label>
            <select
              value={doc.meta.themeId}
              onChange={(e) => commitDoc({ ...doc, meta: { ...doc.meta, themeId: e.target.value as PressThemeId } })}
            >
              <option value="lightscreen">Light (screen)</option>
              <option value="console">Dark (console)</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </div>
          <div>
            <label>{t.audienceLabel}</label>
            <select
              value={doc.meta.audience}
              onChange={(e) => commitDoc({ ...doc, meta: { ...doc.meta, audience: e.target.value as PressAudience } })}
            >
              <option value="internal">Internal</option>
              <option value="client">Client (strict)</option>
            </select>
          </div>
        </div>
        <label>{t.langLabel}</label>
        <select
          value={doc.meta.language}
          onChange={(e) => commitDoc({ ...doc, meta: { ...doc.meta, language: e.target.value as PressLanguage } })}
        >
          <option value="en-GB">English (en-GB)</option>
          <option value="nl-BE">Nederlands BE (nl-BE)</option>
          <option value="nl-NL">Nederlands NL (nl-NL)</option>
          <option value="fr-BE">Francais BE (fr-BE)</option>
        </select>
        <label className="chk">
          <input type="checkbox" checked={nlBePack} onChange={(e) => setNlBePack(e.target.checked)} />
          {t.nlBePack}
        </label>

        <button className="mobile-edit-toggle pri" onClick={() => setShowMobileEditor(!showMobileEditor)}>
          {showMobileEditor ? 'Hide Mobile Editor' : 'Toggle Block Editor'}
        </button>

        <div className="press-editor-col" data-mobile-open={showMobileEditor ? 'true' : 'false'}>
          <div className="grp">CONTENT</div>
          <label>Title</label>
          <input
            type="text"
            value={doc.meta.title}
            onChange={(e) => commitDoc({ ...doc, meta: { ...doc.meta, title: e.target.value } })}
            aria-label="Document Title"
          />
          <label>Subtitle</label>
          <input
            type="text"
            value={doc.meta.subtitle ?? ''}
            onChange={(e) => commitDoc({ ...doc, meta: { ...doc.meta, subtitle: e.target.value } })}
            placeholder="Optional subtitle"
            aria-label="Document Subtitle"
          />
          <label>Blocked names</label>
          <input
            type="text"
            value={customEmployers}
            onChange={(e) => setCustomEmployers(e.target.value)}
            placeholder="Comma-separated, kept in browser RAM"
            aria-label="Custom blocked employer terms"
          />

          <div className="grp">SOURCES ({doc.sources.length})</div>
          {doc.sources.map((s, sIdx) => (
            <div key={s.id} className="row" style={{ marginTop: 6, alignItems: 'center' }}>
              <code style={{ flex: '0 0 auto' }}>{s.id}</code>
              <input
                type="text"
                value={s.label}
                aria-label={`Source ${s.id} label`}
                onChange={(e) => {
                  const next = doc.sources.map((x, i) => (i === sIdx ? { ...x, label: e.target.value } : x));
                  commitDoc({ ...doc, sources: next });
                }}
              />
              <select
                value={s.classification}
                aria-label={`Source ${s.id} classification`}
                style={{ flex: '0 0 96px' }}
                onChange={(e) => {
                  const next = doc.sources.map((x, i) =>
                    i === sIdx ? { ...x, classification: e.target.value as SourceClassification } : x
                  );
                  commitDoc({ ...doc, sources: next });
                }}
              >
                <option value="verified">verified</option>
                <option value="reported">reported</option>
                <option value="unconfirmable">unconfirmable</option>
              </select>
            </div>
          ))}
          <button
            onClick={() => {
              const nextId = `SRC-${doc.sources.length + 1}`;
              commitDoc({
                ...doc,
                sources: [
                  ...doc.sources,
                  { id: nextId, label: 'New Reference Source', reference: 'https://example.com', classification: 'verified' },
                ],
              });
            }}
          >
            + Add Source
          </button>

          <div className="grp">BLOCKS ({doc.blocks.length})</div>
          <ol className="blocks">
            {doc.blocks.map((b, idx) => (
              <li key={b.id} className={b.aiDraft ? 'draft' : undefined}>
                <div className="bhead">
                  <span className="n">{idx + 1}</span>
                  <span className="ty">
                    {b.type}
                    {b.aiDraft ? ' · PENDING REVIEW' : ''}
                  </span>
                  <span className="tools">
                    <button onClick={() => moveBlock(idx, -1)} aria-label="Move block up">↑</button>
                    <button onClick={() => moveBlock(idx, 1)} aria-label="Move block down">↓</button>
                    <button onClick={() => duplicateBlock(idx)} aria-label="Duplicate block">⧉</button>
                    <button className="x" onClick={() => deleteBlock(idx)} aria-label="Delete block">×</button>
                  </span>
                </div>
                <div className="bfields">
                  {b.aiDraft ? (
                    <button type="button" className="pri" onClick={() => updateBlock(idx, { aiDraft: false })}>
                      Accept Draft
                    </button>
                  ) : null}
                  <select
                    value={b.sourceId ?? ''}
                    onChange={(e) => updateBlock(idx, { sourceId: e.target.value || undefined })}
                    aria-label="Block source ID"
                  >
                    <option value="">No source_id</option>
                    {doc.sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} ({s.classification})
                      </option>
                    ))}
                  </select>

                  {b.type === 'heading' && (
                    <>
                      <div className="row">
                        <select
                          value={b.level ?? 2}
                          style={{ flex: '0 0 64px' }}
                          aria-label="Heading level"
                          onChange={(e) => updateBlock(idx, { level: Number(e.target.value) as 1 | 2 | 3 })}
                        >
                          <option value={1}>H1</option>
                          <option value={2}>H2</option>
                          <option value={3}>H3</option>
                        </select>
                        <input
                          type="text"
                          value={b.eyebrow ?? ''}
                          onChange={(e) => updateBlock(idx, { eyebrow: e.target.value })}
                          placeholder="Eyebrow"
                          aria-label="Heading eyebrow"
                        />
                      </div>
                      <input
                        type="text"
                        value={b.text ?? ''}
                        aria-label="Heading text"
                        onChange={(e) => updateBlock(idx, { text: e.target.value })}
                      />
                    </>
                  )}

                  {(b.type === 'paragraph' || b.type === 'quote' || b.type === 'source_note') && (
                    <textarea
                      value={b.text ?? ''}
                      aria-label={`${b.type} text`}
                      onChange={(e) => updateBlock(idx, { text: e.target.value })}
                    />
                  )}

                  {b.type === 'callout' && (
                    <>
                      <div className="row">
                        <select
                          value={b.variant ?? 'key'}
                          aria-label="Callout variant"
                          onChange={(e) => updateBlock(idx, { variant: e.target.value as 'key' | 'tip' | 'context' })}
                        >
                          <option value="key">Key (pink)</option>
                          <option value="tip">Tip (cyan)</option>
                          <option value="context">Context</option>
                        </select>
                        <input
                          type="text"
                          value={b.title ?? ''}
                          onChange={(e) => updateBlock(idx, { title: e.target.value })}
                          placeholder="Label"
                          aria-label="Callout label"
                        />
                      </div>
                      <textarea
                        value={b.text ?? ''}
                        aria-label="Callout text"
                        onChange={(e) => updateBlock(idx, { text: e.target.value })}
                      />
                    </>
                  )}

                  {(b.type === 'bullets' || b.type === 'numbered') && (
                    <textarea
                      value={(b.items ?? []).join('\n')}
                      onChange={(e) => updateBlock(idx, { items: e.target.value.split('\n') })}
                      placeholder="One item per line"
                      aria-label="List items"
                    />
                  )}

                  {b.type === 'hero_image' && (
                    <>
                      <select
                        value={b.heroId ?? 'glyph'}
                        aria-label="Hero device"
                        onChange={(e) => {
                          const nextHero = e.target.value as HeroAssetId;
                          updateBlock(idx, { heroId: nextHero });
                          if (!heroSvgs[nextHero] && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
                            fetch(`${assetBasePath}/heroes/${nextHero}.svg`)
                              .then((r) => (r.ok ? r.text() : ''))
                              .then((svg) => {
                                if (svg.trim().startsWith('<svg') && !/<script/i.test(svg)) {
                                  setHeroSvgs((prev) => ({ ...prev, [nextHero]: svg }));
                                }
                              })
                              .catch(() => {});
                          }
                        }}
                      >
                        {ALL_HERO_ASSET_IDS.map((hid) => (
                          <option key={hid} value={hid}>
                            {CUSTOM_HERO_LABELS[hid] || `Hero device ${hid}`}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={b.alt ?? ''}
                        onChange={(e) => updateBlock(idx, { alt: e.target.value })}
                        placeholder="Required alt text"
                        aria-label="Hero alt text"
                      />
                    </>
                  )}

                  {(b.type === 'table' || b.type === 'comparison_matrix') && (
                    <>
                      {b.type === 'comparison_matrix' && (
                        <input
                          type="text"
                          value={b.title ?? ''}
                          onChange={(e) => updateBlock(idx, { title: e.target.value })}
                          placeholder="Matrix eyebrow title"
                          aria-label="Matrix title"
                        />
                      )}
                      <input
                        type="text"
                        className="mono"
                        value={(b.headers ?? []).join(' | ')}
                        onChange={(e) => updateBlock(idx, { headers: e.target.value.split('|').map((s) => s.trim()) })}
                        aria-label="Table headers pipe separated"
                        placeholder="Col 1 | Col 2 | Col 3"
                      />
                      <textarea
                        className="mono"
                        value={(b.rows ?? []).map((r) => r.join(' | ')).join('\n')}
                        onChange={(e) =>
                          updateBlock(idx, {
                            rows: e.target.value.split('\n').map((line) => line.split('|').map((s) => s.trim())),
                          })
                        }
                        aria-label="Table rows pipe separated"
                        placeholder="Row 1 Col 1 | Row 1 Col 2"
                      />
                    </>
                  )}

                  {b.type === 'kpi_row' && (
                    <textarea
                      className="mono"
                      value={(b.kpis ?? []).map((k) => `${k.label} | ${k.value} | ${k.note ?? ''}`).join('\n')}
                      onChange={(e) =>
                        updateBlock(idx, {
                          kpis: e.target.value.split('\n').map((line) => {
                            const [label = '', value = '', note = ''] = line.split('|').map((s) => s.trim());
                            return { label, value, note: note || undefined, sourceId: b.sourceId };
                          }),
                        })
                      }
                      aria-label="KPI items pipe separated"
                      placeholder="Label | Value | Note"
                    />
                  )}

                  {b.type === 'timeline_roadmap' && (
                    <>
                      <input
                        type="text"
                        value={b.title ?? ''}
                        onChange={(e) => updateBlock(idx, { title: e.target.value })}
                        placeholder="Roadmap title"
                        aria-label="Roadmap title"
                      />
                      <textarea
                        className="mono"
                        value={(b.milestones ?? []).map((m) => `${m.phase} | ${m.title} | ${m.detail} | ${m.status ?? 'planned'}`).join('\n')}
                        onChange={(e) =>
                          updateBlock(idx, {
                            milestones: e.target.value.split('\n').map((line) => {
                              const [phase = '', title = '', detail = '', rawSt = 'planned'] = line.split('|').map((s) => s.trim());
                              const status = rawSt === 'done' || rawSt === 'active' ? rawSt : 'planned';
                              return { phase, title, detail, status };
                            }),
                          })
                        }
                        aria-label="Roadmap milestones pipe separated"
                        placeholder="Phase 1 | Title | Detail | done|active|planned"
                      />
                    </>
                  )}

                  {b.type === 'checklist_gate' && (
                    <>
                      <input
                        type="text"
                        value={b.title ?? ''}
                        onChange={(e) => updateBlock(idx, { title: e.target.value })}
                        placeholder="Gate checklist title"
                        aria-label="Checklist title"
                      />
                      <textarea
                        className="mono"
                        value={(b.checklist ?? []).map((c) => `${c.state} | ${c.item} | ${c.owner ?? ''}`).join('\n')}
                        onChange={(e) =>
                          updateBlock(idx, {
                            checklist: e.target.value.split('\n').map((line) => {
                              const [rawState = 'pending', item = '', owner = ''] = line.split('|').map((s) => s.trim());
                              const state = rawState === 'pass' || rawState === 'blocked' ? rawState : 'pending';
                              return { state, item, owner: owner || undefined };
                            }),
                          })
                        }
                        aria-label="Checklist items pipe separated"
                        placeholder="pass|pending|blocked | Gate item | Owner"
                      />
                    </>
                  )}

                  {b.type === 'two_column_split' && (
                    <>
                      <div className="row">
                        <input
                          type="text"
                          value={b.leftTitle ?? ''}
                          onChange={(e) => updateBlock(idx, { leftTitle: e.target.value })}
                          placeholder="Left column title"
                          aria-label="Left column title"
                        />
                        <input
                          type="text"
                          value={b.rightTitle ?? ''}
                          onChange={(e) => updateBlock(idx, { rightTitle: e.target.value })}
                          placeholder="Right column title"
                          aria-label="Right column title"
                        />
                      </div>
                      <textarea
                        value={(b.leftItems ?? []).join('\n')}
                        onChange={(e) => updateBlock(idx, { leftItems: e.target.value.split('\n') })}
                        placeholder="Left column bullets (one per line)"
                        aria-label="Left column items"
                      />
                      <textarea
                        value={(b.rightItems ?? []).join('\n')}
                        onChange={(e) => updateBlock(idx, { rightItems: e.target.value.split('\n') })}
                        placeholder="Right column bullets (one per line)"
                        aria-label="Right column items"
                      />
                    </>
                  )}

                  {b.type === 'stat_delta_strip' && (
                    <textarea
                      className="mono"
                      value={(b.deltas ?? []).map((d) => `${d.metric} | ${d.baseline} | ${d.target} | ${d.delta}`).join('\n')}
                      onChange={(e) =>
                        updateBlock(idx, {
                          deltas: e.target.value.split('\n').map((line) => {
                            const [metric = '', baseline = '', target = '', delta = ''] = line.split('|').map((s) => s.trim());
                            return { metric, baseline, target, delta };
                          }),
                        })
                      }
                      aria-label="Stat delta items pipe separated"
                      placeholder="Metric | Baseline | Target | Delta"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="row">
            <select
              value={newBlockType}
              onChange={(e) => setNewBlockType(e.target.value as PressBlockType)}
              aria-label="New block type"
            >
              {BLOCK_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
            <button onClick={addBlock}>+ {t.addBlock}</button>
          </div>
        </div>

        <div className="grp">EXPORT</div>
        <div className="row">
          <button className="pri" onClick={() => handleExport('docx')}>Export DOCX (Word / Wiki)</button>
          <button onClick={() => handleExport('gdocs_docx')}>Export Google Docs (.docx)</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={() => handleExport('pdf_dark')}>Export PDF (Dark)</button>
          <button onClick={() => handleExport('pdf_light')}>Export PDF (Print Light)</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={() => handleExport('email_html')}>Export Email HTML (Inline)</button>
          <button onClick={() => handleExport('markdown')}>Export Markdown</button>
        </div>
        <div className="hint">Pre-export lint runs before every export. Nothing leaves the browser.</div>

        <div className="grp">WORKSPACE</div>
        <div className="row">
          <button onClick={() => setShowImporter(!showImporter)}>{t.importTab}</button>
          <button onClick={() => setShowSamples(!showSamples)}>{t.samplesTab}</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className={autosave ? 'pri' : undefined} onClick={toggleAutosave}>
            {autosave ? t.autosaveOn : t.autosaveOff}
          </button>
          <button className="hot" onClick={clearLocalData}>{t.clearLocal}</button>
        </div>
      </aside>

      <main>
        <div className="bar">
          <b>{doc.meta.title || 'Untitled document'}</b>
          <code>
            {activeTheme.label} · A4 210 &times; 297 mm
          </code>
          <span className={`fit ${fit.fitsOnePage ? 'ok' : 'bad'}`}>
            A4 Fit: ~{fit.estimatedHeightMm}mm / 269mm ({fit.pageCount}{' '}
            {fit.pageCount === 1 ? 'page · Fits 1-Pager' : 'pages'})
          </span>
          <div className="sp">
            <button onClick={undo} disabled={past.length === 0}>{t.undo}</button>
            <button onClick={redo} disabled={future.length === 0}>{t.redo}</button>
            <button className="pri" onClick={() => setUiLang(uiLang === 'en' ? 'nl' : 'en')}>
              UI: {uiLang.toUpperCase()}
            </button>
          </div>
        </div>

        {statusBanner && <div className="status">{statusBanner}</div>}

        {showLintAlert && (
          <div role="alert" className="panel alert">
            <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>
                {t.lintBlocked} {findings.length} issue(s)
              </strong>
              {findings.some((f) => f.autoFixable === 'dashes') && (
                <button className="solid" style={{ flex: '0 0 auto', width: 'auto' }} onClick={() => commitDoc(autoFixDashes(doc))}>
                  {t.autoFixDashes}
                </button>
              )}
            </div>
            <ul>
              {findings.map((f, idx) => (
                <li key={idx}>
                  <code style={{ color: 'var(--pink)' }}>{f.code}</code>: {f.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {liveLint.passed && !blockingFindings && (
          <div className="lintok">
            <b>●</b> {t.lintClean}
          </div>
        )}

        {showImporter && (
          <div className="panel">
            <h2>Importer · Markdown, SSoT nodes, ProspectHub JSON</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} aria-label="Import file" />
              <input
                type="text"
                value={importFilename}
                onChange={(e) => setImportFilename(e.target.value)}
                placeholder="Filename (e.g. DOC_FMT_NL_001_Topic.md)"
                aria-label="Import filename"
              />
            </div>
            <textarea
              className="mono"
              style={{ marginTop: 8 }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder="Paste SSoT Markdown (optional YAML frontmatter and ## Sources) or ProspectHub brief JSON"
              aria-label="Import text"
            />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="pri" onClick={() => handleImportRun('markdown')}>Import as Markdown / SSoT Node</button>
              <button onClick={() => handleImportRun('json')}>Import as ProspectHub JSON</button>
            </div>
            {mismatches.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ color: '#F0A824', fontSize: 12 }}>Importer mismatch report ({mismatches.length})</strong>
                <ul style={{ color: 'var(--mist)' }}>
                  {mismatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {showSamples && (
          <div className="panel">
            <h2>Pre-rendered replay samples · all 6 templates</h2>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>DOCX</th>
                    <th>PDF dark</th>
                    <th>PDF light</th>
                    <th>Email</th>
                    <th>MD</th>
                  </tr>
                </thead>
                <tbody>
                  {PRESS_TEMPLATES.map((tpl) => {
                    const allowsPdf = tpl.allowedExports.includes('pdf_dark');
                    return (
                      <tr key={tpl.id}>
                        <td>{tpl.name}</td>
                        <td><a href={`${samplesBasePath}/${tpl.id}.docx`} download>.docx</a></td>
                        <td>
                          {allowsPdf ? (
                            <a href={`${samplesBasePath}/${tpl.id}-dark.pdf`} download>dark.pdf</a>
                          ) : (
                            <span style={{ color: 'var(--faint)' }}>Client: No PDF</span>
                          )}
                        </td>
                        <td>
                          {allowsPdf ? (
                            <a href={`${samplesBasePath}/${tpl.id}-light.pdf`} download>light.pdf</a>
                          ) : (
                            <span style={{ color: 'var(--faint)' }}>Client: No PDF</span>
                          )}
                        </td>
                        <td><a href={`${samplesBasePath}/${tpl.id}-email.html`} download>email.html</a></td>
                        <td><a href={`${samplesBasePath}/${tpl.id}.md`} download>.md</a></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {renderWorkspaceSlot ? <div className="panel">{renderWorkspaceSlot({ doc, commitDoc })}</div> : null}

        <div className="stage">
          <iframe
            title="Signal Press A4 Live Preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            style={{ backgroundColor: activeTheme.ground }}
          />
        </div>
      </main>
    </div>
  );
}
