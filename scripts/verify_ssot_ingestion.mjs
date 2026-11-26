#!/usr/bin/env node
/**
 * Addendum SSoT Drive-to-Supabase Pipeline Verification Suite:
 *  1. SQL RLS lock-down audit on `ssot_documents` (0 public policies, NL/BE/FR/GLOBAL check constraint)
 *  2. In-memory parser & market/archive scope filter two-way tests
 *  3. Live HTTP end-to-end test: Bearer Apps Script push -> idempotent skip -> /api/auth/unlock -> /api/ssot GLOBAL+market inheritance -> /api/altcha/* -> 0 files written to Git
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

const requireFromApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireFromApp('esbuild');

console.log('=== [1/3] SQL Schema & RLS Zero-Anon Audit on ssot_documents ===');
const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
assert.ok(sql.includes('doc_id TEXT PRIMARY KEY'), 'ssot_documents must use doc_id TEXT PRIMARY KEY');
assert.ok(sql.includes('drive_file_id TEXT UNIQUE NOT NULL'), 'ssot_documents must enforce unique drive_file_id');
assert.ok(sql.includes("market IN ('NL', 'BE', 'FR', 'GLOBAL')"), 'ssot_documents must constrain market to NL/BE/FR/GLOBAL');
assert.ok(sql.includes('ALTER TABLE ssot_documents ENABLE ROW LEVEL SECURITY;'), 'ssot_documents must enable RLS');
assert.ok(!/CREATE\s+POLICY[^;]+ON\s+ssot_documents\b/i.test(sql), 'ssot_documents must have ZERO public/anon policies');
console.log('  PASS: ssot_documents schema and zero-anon RLS lock-down verified.');

console.log('=== [2/3] In-Memory Markdown Parser & Strict NL/BE/FR/GLOBAL Scope Filter ===');
const ssotBundle = path.join(DEV_DIR, 'ssot-test-bundle.mjs');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'balaerion-app/src/lib/ssot-ingestion.ts')],
  outfile: ssotBundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  nodePaths: [path.join(ROOT, 'balaerion-app', 'node_modules')],
});
const ssotLib = await import(`${ssotBundle}?t=${Date.now()}`);

const cryptoBundle = path.join(DEV_DIR, 'grants-crypto-ssot-test.mjs');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'balaerion-app/src/lib/grants-crypto.ts')],
  outfile: cryptoBundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
});
const cryptoLib = await import(`${cryptoBundle}?t=${Date.now()}`);

const pGlobal = ssotLib.parseDriveMarkdownDoc({
  driveFileId: 'drv-001',
  title: 'FMT_GLB_011 - Attribution Baseline',
  parentFolderName: '05_Formats_and_Tools',
  contentMd: '# Global Baseline\nShared tracking specification.',
  driveModifiedAt: '2026-11-25T10:00:00Z',
});
assert.equal(pGlobal.skipped, false);
assert.equal(pGlobal.doc.doc_id, 'FMT_GLB_011');
assert.equal(pGlobal.doc.market, 'GLOBAL');
assert.equal(pGlobal.doc.category, 'Formats_and_Tools');

const pOutDe = ssotLib.parseDriveMarkdownDoc({
  driveFileId: 'drv-de-99',
  title: 'POL_DE_002 - Out of Scope Market',
  parentFolderName: 'Policies',
  contentMd: '# DE Only',
});
assert.equal(pOutDe.skipped, true, 'Out-of-scope DE market must be skipped');

const pArchive = ssotLib.parseDriveMarkdownDoc({
  driveFileId: 'drv-arch-01',
  title: 'VRT_NL_001 - Old Doc',
  parentFolderName: '99_Archive',
  contentMd: '# Archived',
});
assert.equal(pArchive.skipped, true, 'Archive folder must be skipped');
console.log('  PASS: Frontmatter/folder parser accepted NL/BE/FR/GLOBAL and blocked DE + Archive.');

console.log('=== [3/3] Live HTTP Sync (Bearer Apps Script Mode), Idempotent Upsert & GLOBAL+Market Inheritance ===');
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
const OWNER_SECRET = 'owner-secret-ssot-test-at-least-16-chars';
const ALTCHA_KEY = 'altcha-hmac-key-ssot-test-at-least-16-chars';
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
      ALTCHA_HMAC_KEY: ALTCHA_KEY,
      GRANT_CODE_PEPPER: 'grant-pepper-ssot-test-at-least-16-chars',
      GRANT_SESSION_SECRET: 'grant-session-secret-ssot-test-16-chars',
      IP_RATE_PEPPER: 'ip-rate-pepper-ssot-test-at-least-16-chars',
    },
    stdio: 'ignore',
  }
);

try {
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/ssot`);
      if (r.status === 200) break;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // Unauthenticated /api/admin/sync-drive & /api/ssot must fail closed (401) with 0 cookies
  const rUnauthSync = await fetch(`${base}/api/admin/sync-drive`, { method: 'POST' });
  assert.equal(rUnauthSync.status, 401);
  const rUnauthSsot = await fetch(`${base}/api/ssot?market=NL`);
  assert.equal(rUnauthSsot.status, 401);
  assert.equal(rUnauthSsot.headers.get('set-cookie'), null);

  // Zero-GCP Apps Script push using Authorization: Bearer <OWNER_ACCESS_SECRET>
  const sampleBatch = [
    {
      driveFileId: 'gdoc-glb-11',
      title: 'FMT_GLB_011 Pixel Architecture',
      parentFolderName: 'Formats_and_Tools',
      contentMd: '---\ndoc_id: FMT_GLB_011\nmarket: GLOBAL\nstatus: VERIFIED\n---\n# Pixel Architecture\nGlobal synthetic baseline.',
      driveModifiedAt: '2026-11-25T12:00:00.000Z',
    },
    {
      driveFileId: 'gdoc-nl-06',
      title: 'VRT_NL_006 Dutch Retail Playbook',
      parentFolderName: 'Verticals',
      contentMd: '# NL Playbook\nProvince-level targeting for Noord-Holland.',
      driveModifiedAt: '2026-11-25T12:05:00.000Z',
    },
    {
      driveFileId: 'gdoc-be-01',
      title: 'POL_BE_001 Belgian Consent Policy',
      parentFolderName: 'Policies',
      contentMd: '# BE Policy\nBilingual Vlaanderen / Wallonie guidance.',
      driveModifiedAt: '2026-11-25T12:10:00.000Z',
    },
    {
      driveFileId: 'gdoc-fr-03',
      title: 'TPL_FR_003 French Readiness Template',
      parentFolderName: 'Templates',
      contentMd: '---\nstatus: REVIEW_DUE\n---\n# FR Template\nSynthetic rubric.',
      driveModifiedAt: '2026-11-25T12:15:00.000Z',
    },
    {
      driveFileId: 'gdoc-de-skip',
      title: 'POL_DE_009 Out of Scope',
      parentFolderName: 'Policies',
      contentMd: '# Excluded market',
      driveModifiedAt: '2026-11-25T12:20:00.000Z',
    },
    {
      driveFileId: 'gdoc-arch-skip',
      title: 'VRT_NL_001 Legacy',
      parentFolderName: 'Archive',
      contentMd: '# Excluded archive',
      driveModifiedAt: '2026-11-25T12:25:00.000Z',
    },
  ];

  const sync1 = await (
    await fetch(`${base}/api/admin/sync-drive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'push_batch', force: false, docs: sampleBatch }),
    })
  ).json();
  assert.equal(sync1.ok, true);
  assert.equal(sync1.upserted, 4);
  assert.equal(sync1.outOfScopeSkipped, 2);
  assert.equal(sync1.unchangedSkipped, 0);

  // Second push with identical timestamps -> idempotently skips all 4!
  const sync2 = await (
    await fetch(`${base}/api/admin/sync-drive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'push_batch', force: false, docs: sampleBatch }),
    })
  ).json();
  assert.equal(sync2.upserted, 0);
  assert.equal(sync2.unchangedSkipped, 4);

  // Mint a single-use Visitor Grant & unlock via POST /api/auth/unlock
  const mintRes = await (
    await fetch(`${base}/api/admin/grants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenBudgetWeighted: 5000, callsBudget: 10 }),
    })
  ).json();

  const unlockGrant = await fetch(`${base}/api/auth/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: mintRes.code }),
  });
  assert.equal(unlockGrant.status, 200);
  const grantCookie = (unlockGrant.headers.get('set-cookie') || '').split(';')[0];
  assert.ok(grantCookie.startsWith('balaerion_grant='));

  // Query /api/ssot?market=NL -> MUST return GLOBAL + NL (FMT_GLB_011 + VRT_NL_006)
  const nlList = await (
    await fetch(`${base}/api/ssot?market=NL`, { headers: { Cookie: grantCookie } })
  ).json();
  assert.deepEqual(
    nlList.docs.map((d) => d.doc_id).sort(),
    ['FMT_GLB_011', 'VRT_NL_006'],
    'Selecting NL must return GLOBAL + NL documents'
  );

  // Query /api/ssot?market=BE -> MUST return GLOBAL + BE
  const beList = await (
    await fetch(`${base}/api/ssot?market=BE`, { headers: { Cookie: grantCookie } })
  ).json();
  assert.deepEqual(
    beList.docs.map((d) => d.doc_id).sort(),
    ['FMT_GLB_011', 'POL_BE_001'],
    'Selecting BE must return GLOBAL + BE documents'
  );

  // Full-text search + detail fetch
  const searchRes = await (
    await fetch(`${base}/api/ssot?market=ALL&q=Noord-Holland`, { headers: { Cookie: grantCookie } })
  ).json();
  assert.equal(searchRes.docs.length, 1);
  assert.equal(searchRes.docs[0].doc_id, 'VRT_NL_006');

  const docDetail = await (
    await fetch(`${base}/api/ssot/VRT_NL_006`, { headers: { Cookie: grantCookie } })
  ).json();
  assert.ok(docDetail.doc.content_md.includes('Province-level targeting'));

  // Verify /api/altcha/challenge + /api/altcha/verify (accepts static vector once, blocks replay)
  const chalResp = await fetch(`${base}/api/altcha/challenge`);
  assert.equal(chalResp.status, 200);
  const staticVec = cryptoLib.createAltchaChallenge(ALTCHA_KEY, {
    fixedNumberForVector: 0,
    fixedSaltHex: 'ffeeddccbbaa998877665544',
    ttlSeconds: 300,
  });
  const encVec = Buffer.from(JSON.stringify({ ...staticVec, number: 0 }), 'utf8').toString('base64');
  const ver1 = await fetch(`${base}/api/altcha/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: encVec }),
  });
  assert.equal(ver1.status, 200);
  const verReplay = await fetch(`${base}/api/altcha/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: encVec }),
  });
  assert.equal(verReplay.status, 400, 'Replayed /api/altcha/verify nonce must fail (400)');

  // Zero-Commit proof: verify git status has zero untracked synced .md files
  const untrackedMd = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => /FMT_GLB|VRT_NL|POL_BE|TPL_FR/.test(f));
  assert.equal(untrackedMd.length, 0, `Zero-commit violation: ${untrackedMd}`);
  console.log('  PASS: Bearer Apps Script push, idempotent skip, /api/auth/unlock, GLOBAL+market inheritance, /api/altcha/verify, and zero-commit verified.');
} finally {
  appProc.kill('SIGTERM');
}

console.log('\nALL ADDENDUM SSoT INGESTION & API GATES PASSED.');
