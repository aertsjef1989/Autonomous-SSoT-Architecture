import crypto from 'crypto';
import { generateFreeEmbeddings1024 } from './llm/embeddings';
import { getSupabaseServer } from './supabase-server';

export type SsotMarket = 'NL' | 'BE' | 'FR' | 'GLOBAL';
export type SsotStatus = 'VERIFIED' | 'REVIEW_DUE' | 'DRAFT';

export interface RawDriveDocInput {
  driveFileId: string;
  title: string;
  parentFolderName?: string;
  contentMd: string;
  driveModifiedAt?: string | null;
}

export interface SsotDocumentRecord {
  doc_id: string;
  drive_file_id: string;
  title: string;
  market: SsotMarket;
  category: string;
  content_md: string;
  status: SsotStatus;
  drive_modified_at: string | null;
  updated_at: string;
}

const ALLOWED_MARKETS = new Set<SsotMarket>(['NL', 'BE', 'FR', 'GLOBAL']);

const globalSsotMem = globalThis as unknown as {
  __balaerionEphemeralSsotByDriveId?: Map<string, SsotDocumentRecord>;
};

function getEphemeralSsotMap(): Map<string, SsotDocumentRecord> {
  if (!globalSsotMem.__balaerionEphemeralSsotByDriveId) {
    globalSsotMem.__balaerionEphemeralSsotByDriveId = new Map();
  }
  return globalSsotMem.__balaerionEphemeralSsotByDriveId;
}

export function getEphemeralSsotDocuments(): SsotDocumentRecord[] {
  return isEphemeralEnabled() ? Array.from(getEphemeralSsotMap().values()) : [];
}

function isEphemeralEnabled(): boolean {
  return !process.env.VERCEL && process.env.ALLOW_LOCAL_EPHEMERAL_STORE === '1';
}

export function chunkMarkdownForSsot(contentMd: string, maxChars = 950): string[] {
  const normalized = (contentMd || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    if (current && current.length + trimmed.length + 2 > maxChars) {
      chunks.push(current);
      current = trimmed.slice(0, maxChars);
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed.slice(0, maxChars);
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 40);
}

function parseSimpleFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md.trim());
  if (!m) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.+)$/.exec(line.trim());
    if (kv) {
      meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body: m[2] };
}

export function normalizeCategory(rawFolder?: string): string {
  const cleaned = (rawFolder || 'General').trim().replace(/^\d+[_-\s]+/, '');
  const lower = cleaned.toLowerCase();
  if (lower.includes('format') || lower.includes('tool')) return 'Formats_and_Tools';
  if (lower.includes('vertical')) return 'Verticals';
  if (lower.includes('polic')) return 'Policies';
  if (lower.includes('template')) return 'Templates';
  if (lower.includes('campaign')) return 'Campaigns';
  if (lower.includes('lifecycle')) return 'Lifecycle';
  if (lower.includes('market')) return 'Markets';
  return cleaned.replace(/\s+/g, '_') || 'General';
}

export function normalizeMarketToken(raw?: string): SsotMarket | null {
  if (!raw) return null;
  const u = raw.trim().toUpperCase();
  if (u === 'GLB' || u === 'GLOBAL') return 'GLOBAL';
  if (u === 'NL' || u === 'BE' || u === 'FR') return u;
  return null;
}

function normalizeStatusToken(raw?: string): SsotStatus {
  const u = (raw || '').trim().toUpperCase();
  if (u === 'REVIEW_DUE') return 'REVIEW_DUE';
  if (u === 'DRAFT') return 'DRAFT';
  return 'VERIFIED';
}

/**
 * Parses a single exported Google Doc Markdown payload in memory.
 * Returns `{ skipped: true, reason }` if the document belongs to an Archive folder or an out-of-scope market.
 */
export function parseDriveMarkdownDoc(
  raw: RawDriveDocInput
): { skipped: false; doc: SsotDocumentRecord } | { skipped: true; reason: string } {
  const folderRaw = (raw.parentFolderName || '').trim();
  if (/archive|deprecated|trash/i.test(folderRaw) || /\[archive\]/i.test(raw.title)) {
    return { skipped: true, reason: 'OUT_OF_SCOPE_ARCHIVE_FOLDER' };
  }

  const { meta } = parseSimpleFrontmatter(raw.contentMd || '');
  const cleanTitleInput = (meta.title || raw.title || '').trim();
  if (!cleanTitleInput || !raw.driveFileId?.trim()) {
    return { skipped: true, reason: 'MISSING_REQUIRED_IDENTIFIERS' };
  }

  // Extract doc_id from frontmatter or leading ID pattern (e.g., DOC_FMT_GLB_011, FMT_GLB_011, VRT_NL_006, POL_BE_001)
  let docId = (meta.doc_id || meta.id || '').trim().toUpperCase();
  let inferredMarketFromId: string | undefined;

  const idMatch = /^(?:DOC_)?([A-Z]{2,5})_([A-Z]{2,6})_(\d{2,4})\b/i.exec(docId || cleanTitleInput);
  if (idMatch) {
    if (!docId) {
      docId = `${idMatch[1].toUpperCase()}_${idMatch[2].toUpperCase()}_${idMatch[3]}`;
    }
    inferredMarketFromId = idMatch[2].toUpperCase();
  }

  // Explicit market resolution: frontmatter -> ID token -> folder token -> title bracket/prefix
  const explicitCandidate =
    meta.market ||
    meta.market_code ||
    inferredMarketFromId ||
    (/\b(GLOBAL|GLB|NL|BE|FR|DE|UK|ES|IT|US)\b/.exec(cleanTitleInput)?.[1] ?? undefined) ||
    (/\b(GLOBAL|GLB|NL|BE|FR|DE|UK|ES|IT|US)\b/.exec(folderRaw)?.[1] ?? undefined);

  let market: SsotMarket | null = null;
  if (explicitCandidate) {
    market = normalizeMarketToken(explicitCandidate);
    if (!market) {
      return { skipped: true, reason: `OUT_OF_SCOPE_MARKET(${explicitCandidate})` };
    }
  } else {
    // Root-level shared docs without a country tag default to GLOBAL
    market = 'GLOBAL';
  }

  if (!ALLOWED_MARKETS.has(market)) {
    return { skipped: true, reason: `OUT_OF_SCOPE_MARKET(${market})` };
  }

  if (!docId) {
    const slug = cleanTitleInput
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 28);
    docId = `DOC_${market}_${slug || raw.driveFileId.slice(0, 8).toUpperCase()}`;
  }

  const category = meta.category ? normalizeCategory(meta.category) : normalizeCategory(folderRaw);
  const status = normalizeStatusToken(meta.status);
  const humanTitle = cleanTitleInput
    .replace(/^(?:DOC_)?[A-Z]{2,5}_[A-Z]{2,6}_\d{2,4}[\s:_-]*/i, '')
    .trim() || cleanTitleInput;

  const isoMod =
    raw.driveModifiedAt && !Number.isNaN(new Date(raw.driveModifiedAt).getTime())
      ? new Date(raw.driveModifiedAt).toISOString()
      : null;

  return {
    skipped: false,
    doc: {
      doc_id: docId,
      drive_file_id: raw.driveFileId.trim(),
      title: humanTitle,
      market,
      category,
      content_md: raw.contentMd,
      status,
      drive_modified_at: isoMod,
      updated_at: new Date().toISOString(),
    },
  };
}

export interface UpsertBatchSummary {
  ok: boolean;
  upserted: number;
  unchangedSkipped: number;
  outOfScopeSkipped: number;
  docIds: string[];
  error?: string;
}

/**
 * Idempotently upserts parsed SSoT documents into Supabase `ssot_documents` keyed on `drive_file_id`.
 * Skips unchanged documents whose `drive_modified_at` matches unless `force === true`.
 */
export async function upsertSsotDocumentsBatch(
  rawDocs: RawDriveDocInput[],
  opts?: { force?: boolean }
): Promise<UpsertBatchSummary> {
  const force = Boolean(opts?.force);
  const parsedDocs: SsotDocumentRecord[] = [];
  let outOfScopeSkipped = 0;

  for (const item of rawDocs) {
    const res = parseDriveMarkdownDoc(item);
    if (res.skipped) {
      outOfScopeSkipped += 1;
    } else {
      parsedDocs.push(res.doc);
    }
  }

  if (parsedDocs.length === 0) {
    return { ok: true, upserted: 0, unchangedSkipped: 0, outOfScopeSkipped, docIds: [] };
  }

  const sb = getSupabaseServer();
  if (sb) {
    const driveIds = parsedDocs.map((d) => d.drive_file_id);
    const { data: existingRows, error: fetchErr } = await sb
      .from('ssot_documents')
      .select('drive_file_id, drive_modified_at')
      .in('drive_file_id', driveIds);

    if (fetchErr) {
      return {
        ok: false,
        upserted: 0,
        unchangedSkipped: 0,
        outOfScopeSkipped,
        docIds: [],
        error: 'Supabase query failed while checking existing SSoT timestamps.',
      };
    }

    const existingModByDriveId = new Map<string, string | null>();
    for (const r of existingRows ?? []) {
      existingModByDriveId.set(
        r.drive_file_id,
        r.drive_modified_at ? new Date(r.drive_modified_at).toISOString() : null
      );
    }

    const toUpsert: SsotDocumentRecord[] = [];
    let unchangedSkipped = 0;
    for (const d of parsedDocs) {
      const prevMod = existingModByDriveId.get(d.drive_file_id);
      if (!force && prevMod && d.drive_modified_at && prevMod === d.drive_modified_at) {
        unchangedSkipped += 1;
        continue;
      }
      toUpsert.push(d);
    }

    if (toUpsert.length > 0) {
      const { error: upsertErr } = await sb
        .from('ssot_documents')
        .upsert(toUpsert, { onConflict: 'drive_file_id' });
      if (upsertErr) {
        return {
          ok: false,
          upserted: 0,
          unchangedSkipped,
          outOfScopeSkipped,
          docIds: [],
          error: 'Supabase upsert into ssot_documents failed.',
        };
      }

      // Populate hybrid ssot_chunks (tsvector + optional card-free 1024-dim embeddings)
      try {
        for (const doc of toUpsert) {
          const textChunks = chunkMarkdownForSsot(doc.content_md);
          if (textChunks.length === 0) continue;
          const vectors = await generateFreeEmbeddings1024(textChunks, 'search_document');
          await sb.from('ssot_chunks').delete().eq('doc_id', doc.doc_id);
          const chunkRows = textChunks.map((chunkText, idx) => ({
            doc_id: doc.doc_id,
            chunk_index: idx,
            title: doc.title,
            market: doc.market,
            category: doc.category,
            status: doc.status,
            chunk_text: chunkText,
            embedding: vectors?.[idx] ?? null,
            updated_at: doc.updated_at,
          }));
          await sb.from('ssot_chunks').upsert(chunkRows, { onConflict: 'doc_id,chunk_index' });
        }
      } catch {
        /* non-fatal if ssot_chunks migration not yet applied */
      }
    }

    return {
      ok: true,
      upserted: toUpsert.length,
      unchangedSkipped,
      outOfScopeSkipped,
      docIds: toUpsert.map((d) => d.doc_id),
    };
  }

  if (isEphemeralEnabled()) {
    const map = getEphemeralSsotMap();
    let upserted = 0;
    let unchangedSkipped = 0;
    const ids: string[] = [];

    for (const d of parsedDocs) {
      const prev = map.get(d.drive_file_id);
      if (!force && prev && prev.drive_modified_at && d.drive_modified_at && prev.drive_modified_at === d.drive_modified_at) {
        unchangedSkipped += 1;
        continue;
      }
      map.set(d.drive_file_id, d);
      upserted += 1;
      ids.push(d.doc_id);
    }
    return { ok: true, upserted, unchangedSkipped, outOfScopeSkipped, docIds: ids };
  }

  return {
    ok: false,
    upserted: 0,
    unchangedSkipped: 0,
    outOfScopeSkipped,
    docIds: [],
    error: 'Supabase is unconfigured or paused (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset).',
  };
}

export async function queryAuthorizedSsotDocuments(params: {
  market?: string;
  category?: string;
  q?: string;
}): Promise<{ ok: true; docs: Omit<SsotDocumentRecord, 'content_md'>[] } | { ok: false; error: string }> {
  const mUpper = (params.market || 'ALL').toUpperCase();
  const targetMarkets: SsotMarket[] =
    mUpper === 'NL' || mUpper === 'BE' || mUpper === 'FR'
      ? ['GLOBAL', mUpper]
      : mUpper === 'GLOBAL' || mUpper === 'GLB'
        ? ['GLOBAL']
        : ['GLOBAL', 'NL', 'BE', 'FR'];

  const cat = params.category && params.category !== 'ALL' ? params.category : null;
  const search = (params.q || '').trim().toLowerCase();

  const sb = getSupabaseServer();
  if (sb) {
    let query = sb
      .from('ssot_documents')
      .select('doc_id, drive_file_id, title, market, category, status, drive_modified_at, updated_at, content_md')
      .in('market', targetMarkets)
      .order('market', { ascending: true })
      .order('doc_id', { ascending: true });

    if (cat) {
      query = query.eq('category', cat);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, error: 'Supabase query for ssot_documents failed.' };
    }

    const filtered = (data ?? [])
      .filter((row) => {
        if (!search) return true;
        return (
          row.doc_id.toLowerCase().includes(search) ||
          row.title.toLowerCase().includes(search) ||
          row.category.toLowerCase().includes(search) ||
          row.content_md.toLowerCase().includes(search)
        );
      })
      .map(({ content_md: _omit, ...summary }) => summary as Omit<SsotDocumentRecord, 'content_md'>);

    return { ok: true, docs: filtered };
  }

  if (isEphemeralEnabled()) {
    const all = Array.from(getEphemeralSsotMap().values());
    const filtered = all
      .filter((r) => targetMarkets.includes(r.market))
      .filter((r) => (!cat ? true : r.category === cat))
      .filter((r) => {
        if (!search) return true;
        return (
          r.doc_id.toLowerCase().includes(search) ||
          r.title.toLowerCase().includes(search) ||
          r.category.toLowerCase().includes(search) ||
          r.content_md.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => a.doc_id.localeCompare(b.doc_id))
      .map(({ content_md: _omit, ...summary }) => summary);
    return { ok: true, docs: filtered };
  }

  return { ok: false, error: 'Supabase store unconfigured.' };
}

export async function getAuthorizedSsotDocumentById(
  docId: string
): Promise<SsotDocumentRecord | null> {
  const cleanId = docId.trim().toUpperCase();
  const sb = getSupabaseServer();
  if (sb) {
    const { data } = await sb
      .from('ssot_documents')
      .select('*')
      .eq('doc_id', cleanId)
      .maybeSingle();
    return (data as SsotDocumentRecord) ?? null;
  }
  if (isEphemeralEnabled()) {
    for (const row of Array.from(getEphemeralSsotMap().values())) {
      if (row.doc_id.toUpperCase() === cleanId) return row;
    }
  }
  return null;
}

/**
 * Optional Google Cloud Service Account Drive v3 recursive fetcher (in-memory only).
 * Uses Node built-in RSA-SHA256 JWT signing so zero heavy third-party SDKs are needed.
 */
async function mintGoogleServiceAccountToken(saJsonRaw: string): Promise<string> {
  const sa = JSON.parse(saJsonRaw) as { client_email?: string; private_key?: string };
  if (!sa.client_email || !sa.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key.');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const sig = signer.sign(sa.private_key).toString('base64url');
  const assertion = `${header}.${claims}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Google OAuth2 token exchange failed (${resp.status}).`);
  }
  const tok = (await resp.json()) as { access_token?: string };
  if (!tok.access_token) throw new Error('Missing access_token in Google OAuth2 response.');
  return tok.access_token;
}

export async function syncDriveFolderViaServiceAccount(opts?: {
  force?: boolean;
}): Promise<UpsertBatchSummary> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '';
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? '';
  if (!saJson || !rootFolderId) {
    return {
      ok: false,
      upserted: 0,
      unchangedSkipped: 0,
      outOfScopeSkipped: 0,
      docIds: [],
      error:
        'GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_DRIVE_ROOT_FOLDER_ID not set. Use the Zero-GCP Google Apps Script push or /admin in-memory Markdown uploader instead.',
    };
  }

  const accessToken = await mintGoogleServiceAccountToken(saJson);
  const collected: RawDriveDocInput[] = [];

  async function walkFolder(folderId: string, folderName: string) {
    if (/archive|deprecated|trash/i.test(folderName)) return;
    let pageToken = '';
    do {
      const q = `'${folderId.replace(/'/g, '')}' in parents and trashed = false`;
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', q);
      url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, modifiedTime)');
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Drive files.list failed (${res.status}).`);
      }
      const data = (await res.json()) as {
        nextPageToken?: string;
        files?: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string }>;
      };

      for (const f of data.files ?? []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          await walkFolder(f.id, f.name);
        } else if (f.mimeType === 'application/vnd.google-apps.document') {
          const expUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}/export?mimeType=${encodeURIComponent('text/markdown')}`;
          const expRes = await fetch(expUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (expRes.ok) {
            const md = await expRes.text();
            collected.push({
              driveFileId: f.id,
              title: f.name,
              parentFolderName: folderName,
              contentMd: md,
              driveModifiedAt: f.modifiedTime ?? null,
            });
          }
        }
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
  }

  await walkFolder(rootFolderId, 'Root');
  return upsertSsotDocumentsBatch(collected, { force: opts?.force });
}
