#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const requireApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireApp('esbuild');

const DEV_DIR = path.join(ROOT, '.dev');
const ASSETS_DIR = path.join(ROOT, 'balaerion-app', 'public', 'press-assets');
const SAMPLES_DIR = path.join(ROOT, 'balaerion-app', 'public', 'press-samples');
const STATIC_PRESS_SRC = path.join(ROOT, 'DESIGN_SYSTEM_Signal', '07_press');
const STATIC_PRESS_OUT = path.join(STATIC_PRESS_SRC, 'public');

fs.mkdirSync(DEV_DIR, { recursive: true });
fs.mkdirSync(SAMPLES_DIR, { recursive: true });
fs.rmSync(path.join(STATIC_PRESS_OUT, 'dist'), { recursive: true, force: true });
fs.mkdirSync(path.join(STATIC_PRESS_OUT, 'dist'), { recursive: true });

// 1. Bundle the TypeScript press library into .dev/press-lib.mjs for Node artifact generation & tests
const libEntryCode = `
export * from '../balaerion-app/src/lib/press/schema';
export * from '../balaerion-app/src/lib/press/lint-config';
export * from '../balaerion-app/src/lib/press/lint';
export * from '../balaerion-app/src/lib/press/templates';
export * from '../balaerion-app/src/lib/press/importers';
export * from '../balaerion-app/src/lib/press/export-markdown';
export * from '../balaerion-app/src/lib/press/export-email-html';
export * from '../balaerion-app/src/lib/press/export-pdf-html';
export * from '../balaerion-app/src/lib/press/export-docx';
`;
const libEntryPath = path.join(DEV_DIR, 'press-lib-entry.ts');
const libOutPath = path.join(DEV_DIR, 'press-lib.mjs');
fs.writeFileSync(libEntryPath, libEntryCode, 'utf8');

await esbuild.build({
  entryPoints: [libEntryPath],
  outfile: libOutPath,
  bundle: true,
  platform: 'node',
  format: 'esm',
  nodePaths: [path.join(ROOT, 'balaerion-app', 'node_modules')],
});

// Resolve `docx` via NODE_PATH or symlink/import map: import press-lib after registering docx path
const pressLib = await import(`file://${libOutPath}`);
const {
  PRESS_TEMPLATES,
  runBlockingPreExportLint,
  exportPressToMarkdown,
  exportPressToEmailHtml,
  renderPressToPrintHtml,
  exportPressToDocxBytes,
} = pressLib;

// Load PNG and SVG hero maps across glyph + all 63 Signal devices (H01..H63)
const heroIds = ['glyph', ...Array.from({ length: 63 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`)];
const heroPngMap = {};
const inlineHeroSvgs = {};
for (const hid of heroIds) {
  const pngPath = path.join(ASSETS_DIR, 'heroes', `${hid}.png`);
  const svgPath = path.join(ASSETS_DIR, 'heroes', `${hid}.svg`);
  if (fs.existsSync(pngPath)) heroPngMap[hid] = new Uint8Array(fs.readFileSync(pngPath));
  if (fs.existsSync(svgPath)) inlineHeroSvgs[hid] = fs.readFileSync(svgPath, 'utf8');
}

// Inline base64 Carlito fonts into print HTML for deterministic headless PDF generation
const fontRegularB64 = fs.readFileSync(path.join(ASSETS_DIR, 'fonts', 'Carlito-Regular.ttf')).toString('base64');
const fontBoldB64 = fs.readFileSync(path.join(ASSETS_DIR, 'fonts', 'Carlito-Bold.ttf')).toString('base64');
const fontItalicB64 = fs.readFileSync(path.join(ASSETS_DIR, 'fonts', 'Carlito-Italic.ttf')).toString('base64');

function embedFontsInPrintHtml(html) {
  return html
    .replace(/url\('[^']*\/fonts\/Carlito-Regular\.ttf'\)/g, `url('data:font/ttf;base64,${fontRegularB64}')`)
    .replace(/url\('[^']*\/fonts\/Carlito-Bold\.ttf'\)/g, `url('data:font/ttf;base64,${fontBoldB64}')`)
    .replace(/url\('[^']*\/fonts\/Carlito-Italic\.ttf'\)/g, `url('data:font/ttf;base64,${fontItalicB64}')`);
}

const pdfJobs = [];

for (const tpl of PRESS_TEMPLATES) {
  const doc = tpl.createDocument();
  const lintRes = runBlockingPreExportLint(doc, { enableNlBeRulePack: true });
  if (!lintRes.passed) {
    throw new Error(`Template ${tpl.id} failed pre-export lint: ${JSON.stringify(lintRes.findings)}`);
  }

  // DOCX
  const docxBytes = await exportPressToDocxBytes(doc, { heroPngMap });
  fs.writeFileSync(path.join(SAMPLES_DIR, `${tpl.id}.docx`), Buffer.from(docxBytes));

  // Markdown
  const md = exportPressToMarkdown(doc);
  fs.writeFileSync(path.join(SAMPLES_DIR, `${tpl.id}.md`), md, 'utf8');

  // Email HTML
  const emailHtml = exportPressToEmailHtml(doc);
  fs.writeFileSync(path.join(SAMPLES_DIR, `${tpl.id}-email.html`), emailHtml, 'utf8');

  // PDFs for internal templates where PDF is permitted (I10, I11, I15)
  if (tpl.allowedExports.includes('pdf_dark')) {
    for (const variant of ['dark', 'light']) {
      const rawHtml = renderPressToPrintHtml(doc, { variant, inlineHeroSvgs });
      const embeddedHtml = embedFontsInPrintHtml(rawHtml);
      const htmlPath = path.join(DEV_DIR, `${tpl.id}-${variant}.html`);
      const pdfPath = path.join(SAMPLES_DIR, `${tpl.id}-${variant}.pdf`);
      fs.writeFileSync(htmlPath, embeddedHtml, 'utf8');
      pdfJobs.push({ htmlPath, pdfPath });
    }
  }
}

// Render selectable-text A4 PDFs with Playwright Chromium
const pyScript = `
import json, sys
from playwright.sync_api import sync_playwright

jobs = json.loads(sys.argv[1])
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    page = browser.new_page()
    for job in jobs:
        page.goto("file://" + job["htmlPath"], wait_until="load")
        page.pdf(path=job["pdfPath"], format="A4", print_background=True, prefer_css_page_size=True)
    browser.close()
`;
execFileSync('python3', ['-c', pyScript, JSON.stringify(pdfJobs)], { stdio: 'inherit' });
console.log(`Generated I15 Replay samples in ${SAMPLES_DIR} (${pdfJobs.length} PDFs + 6 DOCX + 6 Email HTML + 6 MD).`);

// 2. Build standalone static offline GitHub Pages bundle (I21, D10)
await esbuild.build({
  entryPoints: [path.join(STATIC_PRESS_SRC, 'entry.tsx')],
  outdir: path.join(STATIC_PRESS_OUT, 'dist'),
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  jsx: 'automatic',
  nodePaths: [path.join(ROOT, 'balaerion-app', 'node_modules')],
  // Pin a single React instance. The repo root has its own node_modules/react, and two copies
  // produce a null hooks dispatcher ("reading 'useState'") at runtime.
  alias: {
    react: path.join(ROOT, 'balaerion-app', 'node_modules', 'react'),
    'react-dom': path.join(ROOT, 'balaerion-app', 'node_modules', 'react-dom'),
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// Write static index.html with self-hosted Carlito @font-face and strict offline CSP
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="description" content="Signal Press: standalone client-side A4 document designer for DOCX, Google Docs, PDF, Email HTML, and Markdown.">
  <meta name="theme-color" content="#0B0C10">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self';">
  <title>Signal Press · Offline Document Designer</title>
  <style>
    @font-face {
      font-family: 'Carlito';
      src: url('./press-assets/fonts/Carlito-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Carlito';
      src: url('./press-assets/fonts/Carlito-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Carlito';
      src: url('./press-assets/fonts/Carlito-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }
    html, body { margin: 0; padding: 0; background: #08090D; color: #F2F5F9;  }
    *, *::before, *::after { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="signal-press-root"></div>
  <script type="module" src="./dist/entry.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(STATIC_PRESS_OUT, 'index.html'), indexHtml, 'utf8');

// Copy press-assets and press-samples into STATIC_PRESS_OUT for standalone GitHub Pages deploy
fs.cpSync(ASSETS_DIR, path.join(STATIC_PRESS_OUT, 'press-assets'), { recursive: true });
fs.cpSync(SAMPLES_DIR, path.join(STATIC_PRESS_OUT, 'press-samples'), { recursive: true });

console.log(`Built static GitHub Pages Signal Press bundle in ${STATIC_PRESS_OUT}`);
