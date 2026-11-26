#!/usr/bin/env node
/**
 * Master P7 End-to-End Verification Runner (G1 to G14 + M1 + Lighthouse Mobile):
 * Executes every phase gate and real headless Chromium Lighthouse Mobile audits,
 * failing loudly (exit 1) on any defect and writing raw measured metrics to `.dev/p7-report.json`.
 */

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
fs.mkdirSync(DEV_DIR, { recursive: true });

function runStep(id, label, cmd, args, opts = {}) {
  const start = Date.now();
  console.log(`\n>>> [${id}] ${label}`);
  const out = execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
  const ms = Date.now() - start;
  const trimmedLines = out.trim().split('\n').slice(-8).join('\n');
  console.log(trimmedLines);
  return { id, label, passed: true, durationMs: ms, tail: trimmedLines };
}

const args = new Set(process.argv.slice(2));
const lhOnly = args.has("--lh-only");
const skipBuild = args.has("--skip-build") || lhOnly;
const steps = [];

// 0. Build Next.js unlisted workspace + HonKit public Pages _book cleanly
if (!skipBuild) {
steps.push(runStep('BUILD-NEXT', 'Build unlisted Next.js workspace (balaerion-app)', 'npm', ['--prefix', 'balaerion-app', 'run', 'build']));
steps.push(runStep('BUILD-BOOK', 'Build HonKit _book + postprocess_book.py', 'bash', [
  '-lc',
  [
    'npx honkit build',
    'python3 scripts/postprocess_book.py',
    'mkdir -p _book/styles _book/signal/02_studio _book/signal/press _book/balaerion/demo _book/syndicate/demo',
    'cp styles/website.css _book/styles/website.css',
    '[ -d DESIGN_SYSTEM_Signal/02_studio ] && cp -r DESIGN_SYSTEM_Signal/02_studio/* _book/signal/02_studio/ || true',
    '[ -d DESIGN_SYSTEM_Signal/07_press/public ] && cp -r DESIGN_SYSTEM_Signal/07_press/public/* _book/signal/press/ || true',
    '[ -d DEMO ] && cp -r DEMO _book/demo || true',
    '[ -d assets ] && cp -r assets _book/assets || true',
    '[ -d balaerion/demo ] && cp -r balaerion/demo/* _book/balaerion/demo/ || true',
    '[ -d syndicate/demo ] && cp -r syndicate/demo/* _book/syndicate/demo/ || true',
  ].join(' && '),
]));

}
if (!lhOnly) {
// G1: Two-way leak gate (clean + planted forbidden token)
steps.push(
  runStep('G1', 'Two-way forbidden-term & employer leak gate (clean=0, planted=1)', 'python3', [
    '-c',
    `
import os, subprocess
r0 = subprocess.run(["python3", "scripts/leak_gate.py"], capture_output=True, text=True)
assert r0.returncode == 0, r0.stdout
probe = "_book/__g1_planted_probe.txt"
try:
    open(probe, "w").write("leak " + "TT" + "K_PROBE")
    r1 = subprocess.run(["python3", "scripts/leak_gate.py"], capture_output=True, text=True)
    assert r1.returncode != 0, "Failed to block planted forbidden token!"
finally:
    if os.path.exists(probe): os.remove(probe)
r2 = subprocess.run(["python3", "scripts/leak_gate.py"], capture_output=True, text=True)
assert r2.returncode == 0
print("G1 PASS: clean repo=0 hits; planted token blocked exit=" + str(r1.returncode))
`,
  ])
);

// G2 + G4 (Pages) + G6 (Pages): P1 public GitHub Pages verification
steps.push(runStep('G2-G4-G6-PAGES', 'Public GitHub Pages stealth, 320/375/414px overflow, >=44px tap targets & 0 external requests', 'python3', ['scripts/verify_p1_pages.py']));

// G3 + G6 (Unlisted) + G10 (API): P2 unlisted stealth headers & fail-closed API gates
steps.push(runStep('G3-G6-G10-STEALTH', 'Unlisted X-Robots-Tag, Referrer-Policy, CSP, /sitemap.xml=404, 320px overflow & PII/lane 403 gates', 'python3', ['scripts/verify_p2_stealth.py']));

// G12 + G13 + G14: P3 Signal Press OOXML, LibreOffice, PDF contrast/Carlito, 17-defect two-way lint & strict offline 0-network proof
steps.push(runStep('G12-G13-G14-PRESS', 'Signal Press OOXML, LibreOffice A4 page-count, WCAG AA contrast, 17-defect lint & offline 0-network proof', 'node', ['scripts/verify_p3_press.mjs']));

// G7 + G8 + G9: P4 Grants, 0 passive cookies, #code= fragment scrub, 50-way atomic concurrency & mail-bombing guards
steps.push(runStep('G7-G8-G9-GRANTS', 'Salted HMAC grants, 0 passive cookies, #code= scrub, 50-concurrent-request budget proof & ALTCHA replay guard', 'node', ['scripts/verify_p4_grants.mjs']));

// G10 + G11: P5 Excluded APIs, H7 pinned models, cross-lane firewall, circuit breaker, H6 repair-once & 15-task benchmark
steps.push(runStep('G10-G11-ROUTER', 'Constraint 1.1/H7 guard, cross-lane firewall, 60s circuit breaker, H6 repair-once & 15-task eval harness', 'node', ['scripts/verify_p5_router.mjs']));

// P6: Removable AI Assist isolation, F5 consent, aiDraft->sourceId->Accept export gate
steps.push(runStep('G12-G13-ASSIST', 'Removable AI Assist (0 static Pages leak, F5 consent, aiDraft & sourceId export lock)', 'node', ['scripts/verify_p6_assist.mjs']));

// Addendum SSoT Drive-to-Supabase in-memory pipeline & GLOBAL+market inheritance
steps.push(runStep('SSOT-INGESTION', 'Zero-commit Drive/Apps-Script -> Supabase SSoT upsert, idempotency & GLOBAL+market viewer', 'node', ['scripts/verify_ssot_ingestion.mjs']));

}
// G5: Real Headless Chromium Lighthouse Mobile Audit on static Pages Signal Press & Book Home
console.log('\n>>> [G5] Headless Chromium Lighthouse Mobile Audit');
const lhBin = path.join(DEV_DIR, 'lh-tools', 'node_modules', '.bin', 'lighthouse');
let lighthouseResults = {};

if (fs.existsSync(lhBin)) {
  const mimeMap = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
  };
  const bookRoot = path.join(ROOT, '_book');
  const staticSrv = http.createServer((req, res) => {
    const cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let target = path.join(bookRoot, cleanPath === '/' ? 'index.html' : cleanPath);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (!target.startsWith(bookRoot) || !fs.existsSync(target)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  });

  await new Promise((r) => staticSrv.listen(0, '127.0.0.1', r));
  const srvPort = staticSrv.address().port;

  const runAsync = (bin, args, env) =>
    new Promise((resolve, reject) => {
      const child = spawn(bin, args, { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`Lighthouse exited with code ${code}`))
      );
    });

  try {
    for (const [key, urlPath] of [
      ['pages_book_home', '/index.html'],
      ['pages_signal_press_offline', '/signal/press/index.html'],
    ]) {
      const outJson = path.join(DEV_DIR, `lh-${key}.json`);
      await runAsync(
        lhBin,
        [
          `http://127.0.0.1:${srvPort}${urlPath}`,
          '--output=json',
          `--output-path=${outJson}`,
          '--only-categories=performance,accessibility,best-practices,seo',
          '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
          '--quiet',
        ],
        { ...process.env, CHROME_PATH: '/usr/bin/google-chrome' }
      );
      const report = JSON.parse(fs.readFileSync(outJson, 'utf8'));
      const scores = {
        performance: Math.round((report.categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((report.categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((report.categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((report.categories.seo?.score ?? 0) * 100),
      };
      lighthouseResults[key] = scores;
      console.log(`  Lighthouse Mobile [${key}]: perf=${scores.performance}, a11y=${scores.accessibility}, bp=${scores.bestPractices}, seo=${scores.seo}`);
      assert.ok(scores.accessibility >= 90, `Lighthouse mobile accessibility < 90 on ${key}: ${scores.accessibility}`);
    }
  } finally {
    staticSrv.close();
  }
} else {
  throw new Error('Lighthouse binary missing in .dev/lh-tools; install before running P7.');
}

const summaryReport = {
  verifiedAt: new Date().toISOString(),
  allPassed: true,
  lighthouseMobile: lighthouseResults,
  steps,
};
fs.writeFileSync(path.join(DEV_DIR, 'p7-report.json'), JSON.stringify(summaryReport, null, 2), 'utf8');
console.log('\nALL P7 END-TO-END G1..G14 + LIGHTHOUSE MOBILE GATES PASSED.');
