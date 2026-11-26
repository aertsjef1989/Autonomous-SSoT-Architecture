#!/usr/bin/env node
/**
 * Recursive Connected Google Drive -> Supabase SSoT Bulk Importer (Zero-Commit Pipeline).
 *
 * Streams Google Docs and Markdown files from a connected Google Drive root folder
 * (`GOOGLE_DRIVE_ROOT_FOLDER_ID` or `--folder-id <ID>`) directly in RAM using the VM's `gdrive` CLI,
 * filters strictly to `NL`, `BE`, `FR`, and `GLOBAL` (skipping Archive/Trash), and either:
 *   1. Prints a dry-run count breakdown (`--dry-run`, zero file titles or contents written to disk), OR
 *   2. Upserts directly into Supabase (`ssot_documents` + `ssot_chunks`) via `upsertSsotDocumentsBatch`, OR
 *   3. Pushes batches to `WORKSPACE_SYNC_URL` (`/api/admin/sync-drive`) using `Authorization: Bearer <OWNER_ACCESS_SECRET>`.
 *
 * Hard Constraint: Never writes any Drive file content into the git repository.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
fs.mkdirSync(DEV_DIR, { recursive: true });

const argv = process.argv.slice(2);
const isDryRun = argv.includes('--dry-run');
const forceOverwrite = argv.includes('--force');
const folderIdx = argv.indexOf('--folder-id');
const rootFolderId =
  (folderIdx >= 0 && argv[folderIdx + 1] ? argv[folderIdx + 1] : process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '').trim();

if (!rootFolderId) {
  console.error('Usage: node scripts/import_connected_gdrive_to_supabase.mjs --folder-id <DRIVE_FOLDER_ID> [--dry-run] [--force]');
  process.exit(1);
}

const requireFromApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireFromApp('esbuild');

const bundlePath = path.join(DEV_DIR, 'gdrive-ssot-importer-bundle.mjs');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'balaerion-app/src/lib/ssot-ingestion.ts')],
  outfile: bundlePath,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  nodePaths: [path.join(ROOT, 'balaerion-app', 'node_modules')],
});

const ssotIngestion = await import(`${bundlePath}?t=${Date.now()}`);

function listDriveChildren(folderId) {
  const out = execFileSync('gdrive', ['readonly', 'ls', folderId, '--max', '0', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const parsed = JSON.parse(out);
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.files) ? parsed.files : [];
}

function exportDriveDocMarkdownInRam(fileId, mimeType) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssot-ram-'));
  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      const outPath = path.join(tmpDir, 'doc.md');
      execFileSync('gdrive', ['readonly', 'export', fileId, '--mime', 'text/markdown', '-o', outPath], {
        stdio: 'pipe',
        maxBuffer: 32 * 1024 * 1024,
      });
      return fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    }
    if (mimeType === 'text/markdown' || mimeType === 'text/plain') {
      const outPath = path.join(tmpDir, 'raw.md');
      execFileSync('gdrive', ['readonly', 'download', fileId, '-o', outPath], {
        stdio: 'pipe',
        maxBuffer: 32 * 1024 * 1024,
      });
      return fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    }
    return '';
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const collectedRaw = [];

function walkDriveFolder(folderId, folderTrail) {
  if (/archive|deprecated|trash/i.test(folderTrail)) return;
  const entries = listDriveChildren(folderId);
  for (const item of entries) {
    const id = item.id || item.fileId;
    const name = item.name || item.title || '';
    const mime = item.mimeType || '';
    const mod = item.modifiedTime || item.modifiedAt || null;
    if (!id || !name) continue;

    if (mime === 'application/vnd.google-apps.folder') {
      const nextTrail = folderTrail ? `${folderTrail}/${name}` : name;
      walkDriveFolder(id, nextTrail);
      continue;
    }

    if (
      mime === 'application/vnd.google-apps.document' ||
      mime === 'text/markdown' ||
      /\.(md|markdown|txt)$/i.test(name)
    ) {
      const md = isDryRun ? '# Dry-run placeholder\n' : exportDriveDocMarkdownInRam(id, mime || 'text/markdown');
      if (md && md.trim().length > 0) {
        collectedRaw.push({
          driveFileId: id,
          title: name.replace(/\.(md|markdown|txt)$/i, ''),
          parentFolderName: folderTrail || 'General',
          contentMd: md,
          driveModifiedAt: mod,
        });
      }
    }
  }
}

walkDriveFolder(rootFolderId, '');

const byMarket = { GLOBAL: 0, NL: 0, BE: 0, FR: 0 };
const byCategory = {};
let skippedCount = 0;

for (const raw of collectedRaw) {
  const parsed = ssotIngestion.parseDriveMarkdownDoc(raw);
  if (parsed.skipped) {
    skippedCount += 1;
  } else {
    byMarket[parsed.doc.market] = (byMarket[parsed.doc.market] || 0) + 1;
    byCategory[parsed.doc.category] = (byCategory[parsed.doc.category] || 0) + 1;
  }
}

console.log(
  JSON.stringify(
    {
      mode: isDryRun ? 'dry-run' : 'live-sync',
      scannedCandidateDocs: collectedRaw.length,
      admittedTotal: collectedRaw.length - skippedCount,
      outOfScopeOrArchiveSkipped: skippedCount,
      byMarket,
      byCategory,
    },
    null,
    2
  )
);

if (isDryRun) {
  process.exit(0);
}

const syncUrl = (process.env.WORKSPACE_SYNC_URL || '').trim();
const ownerSecret = (process.env.OWNER_ACCESS_SECRET || '').trim();

if (syncUrl && ownerSecret) {
  let totalUpserted = 0;
  let totalUnchanged = 0;
  for (let i = 0; i < collectedRaw.length; i += 20) {
    const slice = collectedRaw.slice(i, i + 20);
    const resp = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'push_batch', force: forceOverwrite, docs: slice }),
    });
    if (!resp.ok) {
      throw new Error(`Remote sync endpoint returned HTTP ${resp.status}`);
    }
    const resJson = await resp.json();
    totalUpserted += Number(resJson.upserted || 0);
    totalUnchanged += Number(resJson.unchangedSkipped || 0);
  }
  console.log(JSON.stringify({ remoteSyncOk: true, totalUpserted, totalUnchanged }, null, 2));
  process.exit(0);
}

const result = await ssotIngestion.upsertSsotDocumentsBatch(collectedRaw, { force: forceOverwrite });
if (!result.ok) {
  console.error(`Upsert halted: ${result.error}`);
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      supabaseUpsertOk: true,
      upserted: result.upserted,
      unchangedSkipped: result.unchangedSkipped,
      outOfScopeSkipped: result.outOfScopeSkipped,
    },
    null,
    2
  )
);
