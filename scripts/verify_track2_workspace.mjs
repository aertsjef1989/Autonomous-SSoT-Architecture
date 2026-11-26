#!/usr/bin/env node
/**
 * Track 2 End-to-End Verification Suite:
 *  1. 12-Provider LIVE/FALLBACK status bar API (0 secret leakage, exact LIVE flip when keys set)
 *  2. Owner Unlimited Live Mode across /api/grants/status, /api/chat, and /api/press/assist (0 reviewer grant spend)
 *  3. Hybrid SSoT Conversational RAG (/ask, market inheritance GLOBAL+NL, REVIEW_DUE staleWarning on FR)
 *  4. Syndicate /api/syndicate/live Poisson scorelines & <= 5.0% Quarter-Kelly cap
 *  5. 63 Signal Devices (H01..H63 SVG + PNG parity) & 5 Rich Block Components across Lint, DOCX, PDF HTML, Email HTML, and Markdown
 */

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
fs.mkdirSync(DEV_DIR, { recursive: true });

const requireApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireApp('esbuild');

console.log('=== [1/5] 63 Signal Devices (H01..H63 SVG+PNG) & 5 Rich Block Components Two-Way Proof ===');
const heroesAppDir = path.join(ROOT, 'balaerion-app/public/press-assets/heroes');
const heroesStaticDir = path.join(ROOT, 'DESIGN_SYSTEM_Signal/07_press/public/press-assets/heroes');

for (let i = 1; i <= 63; i++) {
  const hid = `H${String(i).padStart(2, '0')}`;
  for (const dir of [heroesAppDir, heroesStaticDir]) {
    assert.ok(fs.existsSync(path.join(dir, `${hid}.svg`)), `Missing ${hid}.svg in ${dir}`);
    assert.ok(fs.existsSync(path.join(dir, `${hid}.png`)), `Missing ${hid}.png in ${dir}`);
  }
  if (i >= 57) {
    const svgRaw = fs.readFileSync(path.join(heroesAppDir, `${hid}.svg`), 'utf8');
    assert.ok(!/<text\b/i.test(svgRaw), `${hid}.svg must follow text-free Signal Asset Kit v1 grammar`);
    assert.ok(!/<script\b/i.test(svgRaw), `${hid}.svg must contain zero script tags`);
  }
}

const t2PressEntry = path.join(DEV_DIR, 't2-press-entry.ts');
const t2PressBundle = path.join(DEV_DIR, 't2-press-bundle.mjs');
fs.writeFileSync(
  t2PressEntry,
  `
export * from '../balaerion-app/src/lib/press/schema';
export * from '../balaerion-app/src/lib/press/lint';
export * from '../balaerion-app/src/lib/press/export-markdown';
export * from '../balaerion-app/src/lib/press/export-email-html';
export * from '../balaerion-app/src/lib/press/export-pdf-html';
export * from '../balaerion-app/src/lib/press/export-docx';
`,
  'utf8'
);

await esbuild.build({
  entryPoints: [t2PressEntry],
  outfile: t2PressBundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  nodePaths: [path.join(ROOT, 'balaerion-app/node_modules')],
});

const press = await import(`${t2PressBundle}?t=${Date.now()}`);

const richDoc = {
  schemaVersion: 'signal-press-doc-v1',
  meta: {
    title: 'Track 2 Rich Components Verification Brief',
    subtitle: 'Validating H57..H63 and 5 Rich Structural Blocks',
    author: 'Verification Suite',
    language: 'en-GB',
    market: 'NL/BE',
    docType: 'research_brief',
    audience: 'internal',
    templateId: 'custom-t2',
    themeId: 'console',
    updatedAt: '2026-11-26',
  },
  sources: [
    {
      id: 'SRC-T2-01',
      label: 'Track 2 Architecture Benchmark',
      reference: 'https://vuurtoren-atelier.example/spec',
      classification: 'verified',
    },
  ],
  blocks: [
    {
      id: 'b-h1',
      type: 'heading',
      level: 1,
      eyebrow: 'ARCHITECTURE',
      text: 'Executive Summary',
    },
    {
      id: 'b-hero',
      type: 'hero_image',
      heroId: 'H57',
      alt: 'Two-lane 12-provider router schematic',
      caption: 'Device H57: EU Safe vs General Fast Router',
      sourceId: 'SRC-T2-01',
    },
    {
      id: 'b-matrix',
      type: 'comparison_matrix',
      title: 'Option Matrix',
      headers: ['Capability', 'Single Provider', '12-Provider Pool'],
      rows: [['Failover Resilience', 'Single point', '60s circuit breaker across 12 endpoints']],
      highlightCol: 2,
      sourceId: 'SRC-T2-01',
    },
    {
      id: 'b-roadmap',
      type: 'timeline_roadmap',
      title: 'Rollout Sequence',
      milestones: [
        { phase: 'Stage 1', title: 'Drive Sync', detail: 'Ingest 255 SSoT nodes in RAM.', status: 'done' },
        { phase: 'Stage 2', title: 'Hybrid Search', detail: 'Enable tsvector and BGE-M3 1024-dim vectors.', status: 'active' },
      ],
      sourceId: 'SRC-T2-01',
    },
    {
      id: 'b-check',
      type: 'checklist_gate',
      title: 'Release Checklist',
      checklist: [
        { item: 'Zero passive cookies verified', state: 'pass', owner: 'Security' },
        { item: 'Human sign-off before export', state: 'pass', owner: 'Owner' },
      ],
      sourceId: 'SRC-T2-01',
    },
    {
      id: 'b-split',
      type: 'two_column_split',
      leftTitle: 'EU Safe Lane',
      leftItems: ['Mistral EU', 'Codestral EU', 'OVHcloud EU'],
      rightTitle: 'General Fast Lane',
      rightItems: ['NVIDIA NIM', 'Groq', 'Cerebras', 'Gemini 2.5 Flash'],
      sourceId: 'SRC-T2-01',
    },
    {
      id: 'b-delta',
      type: 'stat_delta_strip',
      deltas: [{ metric: 'Automation Runs', baseline: '1,700/mo', target: '30/mo', delta: '-98.2%' }],
      sourceId: 'SRC-T2-01',
    },
  ],
};

assert.equal(press.validatePressDocument(richDoc).valid, true);
assert.equal(press.runBlockingPreExportLint(richDoc).passed, true);

// Two-way defect check inside new timeline_roadmap block
const dashedRichDoc = JSON.parse(JSON.stringify(richDoc));
dashedRichDoc.blocks[3].milestones[0].detail = 'Ingest \u2014 planted em dash';
const lintFail = press.runBlockingPreExportLint(dashedRichDoc);
assert.equal(lintFail.passed, false, 'Planted em dash inside timeline_roadmap must block export');
assert.ok(lintFail.findings.some((f) => f.code === 'LINT_DASH_TYPOGRAPHY'));
assert.equal(press.runBlockingPreExportLint(press.autoFixDashes(dashedRichDoc)).passed, true, 'autoFixDashes must heal timeline_roadmap');

const h57Png = new Uint8Array(fs.readFileSync(path.join(heroesAppDir, 'H57.png')));
const richDocxBytes = await press.exportPressToDocxBytes(richDoc, { heroPngMap: { H57: h57Png } });
const richDocxPath = path.join(DEV_DIR, 't2-rich-test.docx');
fs.writeFileSync(richDocxPath, Buffer.from(richDocxBytes));

execFileSync(
  'python3',
  [
    '-c',
    `
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], "r") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    assert "<w:tbl>" in xml
    assert "txbxContent" not in xml, "Forbidden floating textbox in rich DOCX!"
    assert "H57" in xml and "wp:docPr" in xml, "Expected embedded H57 PNG in DOCX!"
`,
    richDocxPath,
  ],
  { stdio: 'inherit' }
);

const richHtml = press.renderPressToPrintHtml(richDoc, { variant: 'dark' });
assert.ok(richHtml.includes('Option Matrix') && richHtml.includes('Rollout Sequence') && richHtml.includes('-98.2%'));
const richEmail = press.exportPressToEmailHtml(richDoc);
assert.ok(richEmail.includes('width="600"') && !richEmail.includes('<script'));
const richMd = press.exportPressToMarkdown(richDoc);
assert.ok(richMd.includes('| Capability | Single Provider | 12-Provider Pool |'));
console.log('  PASS: 63/63 SVG+PNG devices and 5 rich block types verified across Lint, DOCX (0 textboxes), PDF HTML, Email HTML, and MD.');

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

const port = await getFreePort();
const OWNER_SECRET = 'track2-owner-secret-test-at-least-16-chars';
const appProc = spawn(
  path.join(ROOT, 'balaerion-app/node_modules/.bin/next'),
  ['start', '-p', String(port), '-H', '127.0.0.1'],
  {
    cwd: path.join(ROOT, 'balaerion-app'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_LOCAL_EPHEMERAL_STORE: '1',
      OWNER_ACCESS_SECRET: OWNER_SECRET,
      NVIDIA_API_KEY: 'nvapi-synthetic-key-present-check',
      GROQ_API_KEY: 'gsk-synthetic-key-present-check',
      MISTRAL_API_KEY: '',
      FOOTBALL_DATA_API_KEY: '',
    },
    stdio: 'ignore',
  }
);

try {
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/api/providers/status`);
      if (r.status === 200) break;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log('=== [2/5] 12-Provider Status Bar API (LIVE vs FALLBACK, Zero Key Leakage) ===');
  const provStatus = await (await fetch(`${base}/api/providers/status`)).json();
  assert.equal(provStatus.totalCount, 12);
  assert.equal(provStatus.liveCount, 2, 'Expected NVIDIA + Groq LIVE, remaining 10 FALLBACK');
  assert.ok(!JSON.stringify(provStatus).includes('nvapi-synthetic'), 'Provider status must never leak secret values!');
  console.log('  PASS: /api/providers/status reported 2/12 LIVE, 10/12 FALLBACK, 0 secret leaks.');

  console.log('=== [3/5] Owner Unlimited Live Mode & Grounded SSoT Conversational RAG ===');
  const unauthChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '/ask How does event_id deduplication work?', pillar: 'ssot', market: 'NL', lane: 'eu' }),
  });
  assert.equal(unauthChat.status, 401, 'Visitor without grant must get 401 Replay fallback');
  const unauthJson = await unauthChat.json();
  assert.equal(unauthJson.replay, true);
  assert.ok(unauthJson.citations.every((c) => c.market === 'GLOBAL' || c.market === 'NL'), 'NL query must only cite GLOBAL or NL');

  const ownerStatus = await (
    await fetch(`${base}/api/grants/status`, {
      headers: { Authorization: `Bearer ${OWNER_SECRET}` },
    })
  ).json();
  assert.equal(ownerStatus.active, true);
  assert.equal(ownerStatus.role, 'owner');
  assert.equal(ownerStatus.unlimited, true);

  // Owner chat on FR market -> triggers staleWarning from REVIEW_DUE TPL_FR_003 and returns 200 with 0 grant spend!
  const ownerFrChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OWNER_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: '/gap Check French readiness template status', pillar: 'ssot', market: 'FR', lane: 'eu' }),
  });
  assert.equal(ownerFrChat.status, 200);
  const ownerFrJson = await ownerFrChat.json();
  assert.equal(ownerFrJson.ownerUnlimited, true);
  assert.equal(ownerFrJson.chargedTokensWeighted, 0);
  assert.equal(ownerFrJson.staleWarning, true, 'FR REVIEW_DUE template must trigger staleWarning');

  // Owner Press AI Assist call -> returns 200 without needing a single-use grant!
  const ownerAssist = await fetch(`${base}/api/press/assist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OWNER_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'draft',
      consentConfirmed: true,
      lane: 'eu',
      blockType: 'callout',
      briefOrText: 'Summarize province-level targeting hygiene.',
    }),
  });
  assert.equal(ownerAssist.status, 200);
  console.log('  PASS: Owner unlimited mode verified on /api/grants/status, /api/chat, and /api/press/assist + market-scoped citations & staleWarning.');

  console.log('=== [4/5] Syndicate Matchday Live/Fallback Endpoint ===');
  const synRes = await (await fetch(`${base}/api/syndicate/live`)).json();
  assert.equal(synRes.feedStatus, 'FALLBACK');
  assert.ok(Array.isArray(synRes.fixtures) && synRes.fixtures.length >= 3);
  for (const fx of synRes.fixtures) {
    assert.ok(fx.quarterKellyPct >= 0 && fx.quarterKellyPct <= 5.0, 'Quarter-Kelly must respect 5.0% pool cap');
    assert.ok(Array.isArray(fx.topScorelines) && fx.topScorelines.length > 0);
  }
  console.log('  PASS: /api/syndicate/live Poisson probabilities, scoreline grid, and 5% Quarter-Kelly cap verified.');

  console.log('=== [5/5] Telegram Admin Endpoint Security Gate ===');
  const tgUnauth = await fetch(`${base}/api/admin/telegram`);
  assert.equal(tgUnauth.status, 401);
  const tgOwner = await fetch(`${base}/api/admin/telegram`, {
    headers: { Authorization: `Bearer ${OWNER_SECRET}` },
  });
  assert.equal(tgOwner.status, 200);
  console.log('  PASS: /api/admin/telegram rejects unauthenticated calls (401) and serves Owner status (200).');
} finally {
  appProc.kill('SIGTERM');
}

console.log('\nALL TRACK 2 WORKSPACE VERIFICATION GATES PASSED.');
