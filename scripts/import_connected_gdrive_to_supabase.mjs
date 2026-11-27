#!/usr/bin/env node
/**
 * Recursive Connected Google Drive -> Local Staged Corpus & Supabase SSoT Bulk Importer.
 *
 * Modes:
 *   1. `--dry-run`: Audits Drive folder structure, market/category breakdown, and skip counts (0 writes).
 *   2. `--stage-local`: Exports all admitted Google Docs / Markdown files via `gdrive` CLI (8 parallel workers)
 *      into git-ignored `.dev/ssot-corpus/markdown/` + compiles `.dev/ssot-corpus/ssot_corpus_bundle.json`
 *      for immediate local VM hydration and 1-click `/admin` or `--from-bundle` Supabase upload.
 *   3. `--from-bundle <path>` (or live Drive export without `--stage-local`): Upserts directly into Supabase
 *      (`ssot_documents` + `ssot_chunks`) or pushes 20-doc batches to `WORKSPACE_SYNC_URL`.
 *
 * Hard Constraint: Never writes any Drive file content into Git-tracked paths; `.dev/` is git-ignored.
 */

import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
const CORPUS_DIR = path.join(DEV_DIR, 'ssot-corpus');
fs.mkdirSync(DEV_DIR, { recursive: true });

const argv = process.argv.slice(2);
const isDryRun = argv.includes('--dry-run');
const isStageLocal = argv.includes('--stage-local');
const forceOverwrite = argv.includes('--force');
const folderIdx = argv.indexOf('--folder-id');
const bundleIdx = argv.indexOf('--from-bundle');

const fromBundlePath =
  bundleIdx >= 0 && argv[bundleIdx + 1] ? path.resolve(process.cwd(), argv[bundleIdx + 1]) : '';
const rootFolderId = (
  folderIdx >= 0 && argv[folderIdx + 1] ? argv[folderIdx + 1] : process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || ''
).trim();

if (!fromBundlePath && !rootFolderId) {
  console.error(
    'Usage:\n' +
      '  node scripts/import_connected_gdrive_to_supabase.mjs --folder-id <DRIVE_FOLDER_ID> [--dry-run | --stage-local | --force]\n' +
      '  node scripts/import_connected_gdrive_to_supabase.mjs --from-bundle .dev/ssot-corpus/ssot_corpus_bundle.json [--force]'
  );
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

async function exportDriveDocMarkdownAsync(fileId, mimeType) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssot-ram-'));
  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      const outPath = path.join(tmpDir, 'doc.md');
      await execFileAsync('gdrive', ['readonly', 'export', fileId, outPath, '--format', 'md'], {
        maxBuffer: 32 * 1024 * 1024,
      });
      return fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    }
    if (mimeType === 'text/markdown' || mimeType === 'text/plain') {
      const outPath = path.join(tmpDir, 'raw.md');
      await execFileAsync('gdrive', ['readonly', 'download', fileId, '--out', outPath], {
        maxBuffer: 32 * 1024 * 1024,
      });
      return fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    }
    return '';
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

let collectedRaw = [];

if (fromBundlePath) {
  const rawBundle = JSON.parse(fs.readFileSync(fromBundlePath, 'utf8'));
  collectedRaw = Array.isArray(rawBundle.docs) ? rawBundle.docs : [];
} else {
  const manifestEntries = [];

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
        manifestEntries.push({
          driveFileId: id,
          rawName: name,
          title: name.replace(/\.(md|markdown|txt)$/i, ''),
          mimeType: mime || 'text/markdown',
          parentFolderName: folderTrail || 'General',
          driveModifiedAt: mod,
        });
      }
    }
  }

  walkDriveFolder(rootFolderId, '');

  if (isDryRun) {
    collectedRaw = manifestEntries.map((m) => ({
      driveFileId: m.driveFileId,
      title: m.title,
      parentFolderName: m.parentFolderName,
      contentMd: '# Dry-run placeholder\n',
      driveModifiedAt: m.driveModifiedAt,
    }));
  } else {
    // Pre-filter skipped entries (e.g., _DELETE_ or Archive/out-of-scope) before network export
    const eligibleEntries = manifestEntries.filter((m) => {
      const probe = ssotIngestion.parseDriveMarkdownDoc({
        driveFileId: m.driveFileId,
        title: m.title,
        parentFolderName: m.parentFolderName,
        contentMd: '# Probe\n',
        driveModifiedAt: m.driveModifiedAt,
      });
      return !probe.skipped;
    });

    const skippedPreCount = manifestEntries.length - eligibleEntries.length;
    console.error(
      `[Drive Export] Exporting ${eligibleEntries.length} active SSoT docs (${skippedPreCount} _DELETE_/out-of-scope skipped) with 8 parallel workers...`
    );

    const results = new Array(eligibleEntries.length);
    let cursor = 0;
    let completed = 0;

    async function worker() {
      while (true) {
        const idx = cursor++;
        if (idx >= eligibleEntries.length) break;
        const entry = eligibleEntries[idx];
        const md = await exportDriveDocMarkdownAsync(entry.driveFileId, entry.mimeType);
        results[idx] = {
          driveFileId: entry.driveFileId,
          rawName: entry.rawName,
          title: entry.title,
          parentFolderName: entry.parentFolderName,
          contentMd: md,
          driveModifiedAt: entry.driveModifiedAt,
        };
        completed++;
        if (completed % 40 === 0 || completed === eligibleEntries.length) {
          console.error(`  -> Exported ${completed} / ${eligibleEntries.length} documents...`);
        }
      }
    }

    await Promise.all(Array.from({ length: 8 }, () => worker()));
    collectedRaw = results.filter((r) => r && r.contentMd && r.contentMd.trim().length > 0);
  }
}

const rawByDriveId = new Map();
const rawParsedList = [];
let skippedCount = 0;

for (const raw of collectedRaw) {
  const parsed = ssotIngestion.parseDriveMarkdownDoc(raw);
  if (parsed.skipped) {
    skippedCount += 1;
  } else {
    rawByDriveId.set(parsed.doc.drive_file_id, raw);
    rawParsedList.push(parsed.doc);
  }
}

const cleanDocs = ssotIngestion.dedupeAndDisambiguateParsedDocs(rawParsedList);
const duplicateUploadsRemoved = rawParsedList.length - cleanDocs.length;

const byMarket = { GLOBAL: 0, NL: 0, BE: 0, FR: 0 };
const byCategory = {};
const admittedRaw = [];
const docIdSet = new Set();
let duplicateDocIds = 0;
let totalBytes = 0;

for (const doc of cleanDocs) {
  if (docIdSet.has(doc.doc_id)) {
    duplicateDocIds += 1;
  }
  docIdSet.add(doc.doc_id);
  byMarket[doc.market] = (byMarket[doc.market] || 0) + 1;
  byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
  totalBytes += Buffer.byteLength(doc.content_md || '', 'utf8');
  const orig = rawByDriveId.get(doc.drive_file_id) || {};
  admittedRaw.push({
    docId: doc.doc_id,
    driveFileId: doc.drive_file_id,
    title: orig.title || doc.title,
    parentFolderName: orig.parentFolderName || doc.category,
    contentMd: doc.content_md,
    driveModifiedAt: doc.drive_modified_at,
  });
}

if (isStageLocal) {
  const mdRoot = path.join(CORPUS_DIR, 'markdown');
  fs.rmSync(mdRoot, { recursive: true, force: true });
  fs.mkdirSync(mdRoot, { recursive: true });

  for (const item of admittedRaw) {
    const safeTrail = (item.parentFolderName || 'General')
      .split('/')
      .map((seg) => seg.replace(/[^a-zA-Z0-9._-]+/g, '_'))
      .join(path.sep);
    const dir = path.join(mdRoot, safeTrail);
    fs.mkdirSync(dir, { recursive: true });
    const safeBase = `${item.docId}__${item.title}`.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const filePath = path.join(dir, `${safeBase}.md`);
    fs.writeFileSync(filePath, item.contentMd, 'utf8');
  }

  const bundleOutPath = path.join(CORPUS_DIR, 'ssot_corpus_bundle.json');
  const summaryOutPath = path.join(CORPUS_DIR, 'manifest_summary.json');
  const summaryObj = {
    stagedAt: new Date().toISOString(),
    scannedActiveDocs: rawParsedList.length,
    duplicateUploadsRemoved,
    admittedTotal: admittedRaw.length,
    uniqueDocIds: docIdSet.size,
    duplicateDocIds,
    totalMarkdownBytes: totalBytes,
    byMarket,
    byCategory,
    bundlePath: '.dev/ssot-corpus/ssot_corpus_bundle.json',
    markdownTreePath: '.dev/ssot-corpus/markdown/',
  };

  fs.writeFileSync(
    bundleOutPath,
    JSON.stringify({ schemaVersion: 'ssot-corpus-bundle-v1', ...summaryObj, docs: admittedRaw }, null, 2),
    'utf8'
  );
  fs.writeFileSync(summaryOutPath, JSON.stringify(summaryObj, null, 2), 'utf8');

  console.log(JSON.stringify({ mode: 'stage-local', ...summaryObj }, null, 2));
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      mode: isDryRun ? 'dry-run' : fromBundlePath ? 'from-bundle-sync' : 'live-sync',
      scannedCandidateDocs: collectedRaw.length,
      duplicateUploadsRemoved,
      admittedTotal: admittedRaw.length,
      uniqueDocIds: docIdSet.size,
      duplicateDocIds,
      outOfScopeOrDeleteSkipped: skippedCount,
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
  for (let i = 0; i < admittedRaw.length; i += 20) {
    const slice = admittedRaw.slice(i, i + 20);
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

const result = await ssotIngestion.upsertSsotDocumentsBatch(admittedRaw, { force: forceOverwrite });
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
