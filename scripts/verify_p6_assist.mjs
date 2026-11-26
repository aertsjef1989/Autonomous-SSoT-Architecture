#!/usr/bin/env node
/**
 * P6 Verification Suite (Section I12, I18, F5, D10):
 *  1. Static GitHub Pages bundle isolation: 0 bytes of AI Assist / `/api/press/assist` in `07_press/public/`
 *  2. Engine two-way checks: F5 consent gate, PII gate, nl-BE vs nl-NL localization, aiDraft=true export block, and unsourced figure block
 *  3. Next.js HTTP + Playwright UI end-to-end workflow: disabled button before F5 consent -> draft -> export blocked -> Accept Draft -> export succeeds + 320/375/414px 0 overflow
 *  4. Removability check: SignalPressWorkspace.tsx has zero imports from `ai-assist` or `llm`
 */

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
const STATIC_OUT = path.join(ROOT, 'DESIGN_SYSTEM_Signal', '07_press', 'public');
fs.mkdirSync(DEV_DIR, { recursive: true });

console.log('=== [1/4] Rebuild Static GitHub Pages Bundle & Prove Zero AI-Assist Leakage (D10, I18) ===');
execFileSync('node', [path.join(ROOT, 'scripts/build_press_artifacts.mjs')], { stdio: 'inherit' });

const distDir = path.join(STATIC_OUT, 'dist');
const distFiles = fs.readdirSync(distDir);
const entryGzipKb = zlib.gzipSync(fs.readFileSync(path.join(distDir, 'entry.js'))).length / 1024;
assert.ok(entryGzipKb < 100, `Static entry.js exceeded 100 KB gzip budget: ${entryGzipKb.toFixed(1)} KB`);

for (const f of ['index.html', ...distFiles.map((x) => path.join('dist', x))]) {
  const content = fs.readFileSync(path.join(STATIC_OUT, f), 'utf8');
  assert.ok(!content.includes('/api/press/assist'), `AI Assist API leaked into static Pages file ${f}`);
  assert.ok(!content.includes('SignalPressAiAssist'), `AI Assist component leaked into static Pages file ${f}`);
  assert.ok(!content.includes('consentConfirmed'), `AI Assist state leaked into static Pages file ${f}`);
}
console.log(`  PASS: Static Pages bundle (${entryGzipKb.toFixed(1)} KB gzip) contains 0 AI-Assist references.`);

console.log('=== [2/4] Engine Two-Way F5 Consent, I12 aiDraft Export Lock, Source Binding & nl-BE vs nl-NL ===');
const requireFromApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireFromApp('esbuild');

const p6Entry = path.join(DEV_DIR, 'p6-entry.ts');
fs.writeFileSync(
  p6Entry,
  `
export * from '../balaerion-app/src/lib/ai-assist/press-assist-engine';
export * from '../balaerion-app/src/lib/press/templates';
export * from '../balaerion-app/src/lib/press/lint';
`,
  'utf8'
);
const p6Bundle = path.join(DEV_DIR, 'p6-bundle.mjs');
await esbuild.build({
  entryPoints: [p6Entry],
  outfile: p6Bundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
});
const p6 = await import(`${p6Bundle}?t=${Date.now()}`);

// 2a. Missing F5 consent must fail loudly
const noConsent = await p6.runPressAssistAction({
  action: 'draft',
  consentConfirmed: false,
  briefOrText: 'Synthetic SSoT summary',
});
assert.equal(noConsent.ok, false);
assert.ok((noConsent.error || '').includes('F5_CONSENT_REQUIRED'));

// 2b. PII in brief must fail loudly before dispatch
const piiAttempt = await p6.runPressAssistAction({
  action: 'draft',
  consentConfirmed: true,
  briefOrText: 'Draft brief for VAT BE0123.456.789',
});
assert.equal(piiAttempt.ok, false);
assert.ok((piiAttempt.error || '').includes('PII GATE BLOCKED'));

// 2c. Live mock server testing draft (with figure), nl-BE vs nl-NL translate, and critic
const mockLlm = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const sysPrompt = body.messages?.[0]?.content || '';

  let payload = {};
  if (sysPrompt.includes('(critic)')) {
    payload = {
      summary: 'Checked synthetic provenance and advisory framing.',
      exportReady: false,
      issues: [{ code: 'LINT_UNSOURCED_FIGURE', severity: 'high', message: 'Missing source_id.', fixSuggestion: 'Attach SRC-01.' }],
    };
  } else if (sysPrompt.includes('Target locale: nl-BE')) {
    payload = { text: 'Uw intern team in Vlaanderen beheert het advertentieaccount op provincieniveau.' };
  } else if (sysPrompt.includes('Target locale: nl-NL')) {
    payload = { text: 'Uw eigen team in Nederland stuurt de campagne op provincieniveau aan.' };
  } else {
    // Intentionally include an em dash to prove scrubForbiddenDashes strips it, plus 24% figure to test sourceId gate!
    payload = {
      title: 'Synthetic Throughput Gain',
      text: 'Cycle latency dropped by 24% \u2014 verified across synthetic test nodes.',
    };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }], usage: { total_tokens: 150 } }));
});
await new Promise((r) => mockLlm.listen(0, '127.0.0.1', r));
const mockLlmPort = mockLlm.address().port;

try {
  const routerOverrides = {
    registryOverride: [
      {
        id: 'ovhcloud-eu',
        displayName: 'Mock OVH EU',
        lane: 'safe',
        protocol: 'openai_compat',
        endpointUrl: `http://127.0.0.1:${mockLlmPort}/v1/chat/completions`,
        pinnedModelId: 'Mistral-Nemo-Instruct-2407',
        apiKeyEnvVar: 'OVH_KEY',
        enabledByDefault: true,
        weightMultiplier: 1.0,
        maxRpm: 50,
        maxRpd: 200,
        timeoutMs: 5000,
      },
    ],
    envOverride: { OVH_KEY: 'test-key' },
  };

  const drafted = await p6.runPressAssistAction({
    action: 'draft',
    consentConfirmed: true,
    blockType: 'callout',
    briefOrText: 'Summarize synthetic latency improvement',
    routerOverrides,
  });
  assert.equal(drafted.ok, true);
  assert.equal(drafted.replay, false);
  assert.equal(drafted.block.aiDraft, true, 'AI-generated block MUST set aiDraft=true');
  assert.equal(drafted.requiresSourceBinding, true, '24% without sourceId must flag requiresSourceBinding');
  assert.ok(!/[\u2014\u2013]/.test(drafted.block.text), 'Em/en dashes must be scrubbed from LLM output');

  // Verify export is BLOCKED while aiDraft=true, STILL BLOCKED when aiDraft=false without sourceId, and ALLOWED once sourceId bound!
  const baseDoc = p6.PRESS_TEMPLATES[0].createDocument();
  const docUnaccepted = { ...baseDoc, blocks: [...baseDoc.blocks, drafted.block] };
  const lint1 = p6.runBlockingPreExportLint(docUnaccepted);
  assert.equal(lint1.passed, false);
  assert.ok(lint1.findings.some((f) => f.code === 'LINT_UNACCEPTED_AI_DRAFT'));

  const docAcceptedUnsourced = {
    ...baseDoc,
    blocks: [...baseDoc.blocks, { ...drafted.block, aiDraft: false }],
  };
  const lint2 = p6.runBlockingPreExportLint(docAcceptedUnsourced);
  assert.equal(lint2.passed, false);
  assert.ok(lint2.findings.some((f) => f.code === 'LINT_UNSOURCED_FIGURE'));

  const validSrcId = baseDoc.sources[0].id;
  const docAcceptedAndSourced = {
    ...baseDoc,
    blocks: [...baseDoc.blocks, { ...drafted.block, aiDraft: false, sourceId: validSrcId }],
  };
  const lint3 = p6.runBlockingPreExportLint(docAcceptedAndSourced);
  assert.equal(lint3.passed, true, `Expected clean lint after human accept + sourceId, got ${JSON.stringify(lint3.findings)}`);

  const nlBe = await p6.runPressAssistAction({
    action: 'translate',
    consentConfirmed: true,
    targetLocale: 'nl-BE',
    briefOrText: 'Advisory targeting control.',
    routerOverrides,
  });
  const nlNl = await p6.runPressAssistAction({
    action: 'translate',
    consentConfirmed: true,
    targetLocale: 'nl-NL',
    briefOrText: 'Advisory targeting control.',
    routerOverrides,
  });
  assert.ok(nlBe.block.text.includes('Vlaanderen') && nlNl.block.text.includes('Nederland'));

  const criticOut = await p6.runPressAssistAction({
    action: 'critic',
    consentConfirmed: true,
    briefOrText: 'Check section.',
    routerOverrides,
  });
  assert.equal(criticOut.criticReport.exportReady, false);
  assert.equal(criticOut.criticReport.issues[0].code, 'LINT_UNSOURCED_FIGURE');
  console.log('  PASS: F5 consent, PII block, dash scrub, aiDraft->sourceId->Accept export lifecycle, nl-BE/nl-NL, and Critic verified.');
} finally {
  mockLlm.close();
}

console.log('=== [3/4] Live Next.js /press Playwright End-to-End UI & Mobile Overflow Proof ===');
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

const appPort = await getFreePort();
const appProc = spawn(
  path.join(ROOT, 'balaerion-app/node_modules/.bin/next'),
  ['start', '-p', String(appPort), '-H', '127.0.0.1'],
  {
    cwd: path.join(ROOT, 'balaerion-app'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_LOCAL_EPHEMERAL_STORE: '1',
      GRANT_CODE_PEPPER: 'test-grant-pepper-at-least-16-chars-long',
      GRANT_SESSION_SECRET: 'test-session-secret-at-least-16-chars-long',
    },
    stdio: 'ignore',
  }
);

try {
  const base = `http://127.0.0.1:${appPort}`;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/press`);
      if (r.status === 200) break;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // API negative checks
  const rNoConsent = await fetch(`${base}/api/press/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'draft', consentConfirmed: false, briefOrText: 'Synthetic test' }),
  });
  assert.equal(rNoConsent.status, 400);

  const rPii = await fetch(`${base}/api/press/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'draft', consentConfirmed: true, briefOrText: 'VAT BE0123.456.789' }),
  });
  assert.equal(rPii.status, 403);

  const pwScript = `
import sys
from playwright.sync_api import sync_playwright

base_url = sys.argv[1]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
    page = ctx.new_page()

    page.goto(base_url + "/press", wait_until="networkidle")
    page.get_by_role("button", name="Open AI Assist (Optional)").click()

    run_btn = page.get_by_role("button", name="Run DRAFT Assist")
    assert run_btn.is_disabled(), "Run Assist button MUST be disabled before F5 consent is checked!"

    page.get_by_label("Confirm synthetic-only AI Assist consent (F5)").check()
    assert not run_btn.is_disabled(), "Run Assist button should enable after F5 consent"

    page.get_by_label("Synthetic AI Assist Brief").fill("Synthetic SSoT escalation check")
    run_btn.click()
    page.wait_for_selector("text=PENDING REVIEW", timeout=10000)

    # Attempt export while AI draft is unaccepted -> MUST be blocked by LINT_UNACCEPTED_AI_DRAFT!
    page.get_by_role("button", name="Export Markdown").click()
    assert "LINT_UNACCEPTED_AI_DRAFT" in page.content(), "Export MUST block while AI draft is unaccepted!"

    # Human clicks Accept Draft -> export unlocks and downloads!
    page.get_by_role("button", name="Accept Draft").click()
    with page.expect_download(timeout=10000) as dl_info:
        page.get_by_role("button", name="Export Markdown").click()
    assert dl_info.value.suggested_filename.endswith(".md")

    # Verify 0 horizontal overflow at 320, 375, 414px even with AI Assist drawer open
    for w in (320, 375, 414):
        page.set_viewport_size({"width": w, "height": 800})
        overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
        assert not overflow, f"Horizontal overflow on /press with AI Assist open at {w}px!"

    browser.close()
`;
  execFileSync('python3', ['-c', pwScript, base], { stdio: 'inherit' });
  console.log('  PASS: Playwright verified F5 consent lock, AI draft -> lint block -> Accept Draft -> export unlock, and 320/375/414px 0 overflow.');
} finally {
  appProc.kill('SIGTERM');
}

console.log('=== [4/4] Removability Check (I18) ===');
const wsSource = fs.readFileSync(path.join(ROOT, 'balaerion-app/src/components/SignalPressWorkspace.tsx'), 'utf8');
assert.ok(!wsSource.includes('ai-assist'), 'SignalPressWorkspace.tsx must not import ai-assist');
assert.ok(!wsSource.includes('/lib/llm'), 'SignalPressWorkspace.tsx must not import llm router');
assert.ok(!wsSource.includes('/api/'), 'SignalPressWorkspace.tsx must not contain /api/ endpoints');
console.log('  PASS: SignalPressWorkspace.tsx remains 100% decoupled from AI Assist and API routes.');

console.log('\nALL P6 SIGNAL PRESS AI ASSIST VERIFICATION GATES PASSED.');
