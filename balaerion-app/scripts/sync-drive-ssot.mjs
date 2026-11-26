#!/usr/bin/env node
/**
 * On-Demand SSoT Ingestion CLI (`balaerion-app/scripts/sync-drive-ssot.mjs`)
 *
 * Modes:
 *   1. Service Account Drive Sync (if GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_DRIVE_ROOT_FOLDER_ID set):
 *        node balaerion-app/scripts/sync-drive-ssot.mjs [--force]
 *   2. Stdin JSON Memory Batch (zero files written to disk or Git):
 *        cat batch.json | node balaerion-app/scripts/sync-drive-ssot.mjs --stdin [--force]
 *
 * Zero-Commit Invariant: Never writes exported Markdown files into tracked Git paths or `_book/`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(SCRIPT_DIR, '..');
const ROOT_DIR = path.resolve(APP_DIR, '..');
const DEV_DIR = path.join(ROOT_DIR, '.dev');
fs.mkdirSync(DEV_DIR, { recursive: true });

// Load balaerion-app/.env.local into process.env if present (never prints values)
const envLocalPath = path.join(APP_DIR, '.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const requireFromApp = createRequire(path.join(APP_DIR, 'package.json'));
const esbuild = requireFromApp('esbuild');

const bundleOut = path.join(DEV_DIR, 'ssot-sync-cli-bundle.mjs');
await esbuild.build({
  entryPoints: [path.join(APP_DIR, 'src/lib/ssot-ingestion.ts')],
  outfile: bundleOut,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  nodePaths: [path.join(APP_DIR, 'node_modules')],
});

const { syncDriveFolderViaServiceAccount, upsertSsotDocumentsBatch } = await import(
  `${bundleOut}?t=${Date.now()}`
);

const args = new Set(process.argv.slice(2));
const force = args.has('--force');

if (args.has('--stdin')) {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const docs = Array.isArray(parsed) ? parsed : parsed.docs ?? [];
  const res = await upsertSsotDocumentsBatch(docs, { force });
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
} else {
  const res = await syncDriveFolderViaServiceAccount({ force });
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
}
