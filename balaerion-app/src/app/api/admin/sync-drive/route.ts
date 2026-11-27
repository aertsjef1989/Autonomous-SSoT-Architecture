import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isOwnerAuthenticated } from '@/lib/session-access';
import {
  syncDriveFolderViaServiceAccount,
  upsertSsotDocumentsBatch,
  type RawDriveDocInput,
} from '@/lib/ssot-ingestion';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync-drive (Addendum Section 2.C & 3.B):
 * Protected by `balaerion_owner_session` cookie OR `Authorization: Bearer <OWNER_ACCESS_SECRET>`.
 * Supports:
 *  1. Zero-GCP Push Batch (`mode: 'push_batch'`, `docs: [...]`) from Google Apps Script or `/admin` in-memory `.md` upload.
 *  2. Service Account Recursive Fetch (`mode: 'service_account'`) if `GOOGLE_SERVICE_ACCOUNT_JSON` is configured.
 * Zero-Commit Rule: Everything stays in memory -> Supabase `ssot_documents`; zero files are ever written to disk.
 */
export async function POST(request: NextRequest) {
  if (!isOwnerAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized: Owner credentials required.' }, { status: 401 });
  }

  let body: { mode?: unknown; force?: unknown; docs?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const force = body.force === true;

  if (Array.isArray(body.docs)) {
    if (body.docs.length > 500) {
      return NextResponse.json({ error: 'Batch limit exceeded (max 500 documents per request).' }, { status: 413 });
    }
    const cleaned: RawDriveDocInput[] = [];
    for (const raw of body.docs) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      if (typeof r.driveFileId !== 'string' || typeof r.title !== 'string' || typeof r.contentMd !== 'string') {
        continue;
      }
      cleaned.push({
        docId: typeof r.docId === 'string' ? r.docId : undefined,
        driveFileId: r.driveFileId,
        title: r.title,
        parentFolderName: typeof r.parentFolderName === 'string' ? r.parentFolderName : undefined,
        contentMd: r.contentMd,
        driveModifiedAt: typeof r.driveModifiedAt === 'string' ? r.driveModifiedAt : null,
      });
    }
    const summary = await upsertSsotDocumentsBatch(cleaned, { force });
    return NextResponse.json(summary, {
      status: summary.ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const summary = await syncDriveFolderViaServiceAccount({ force });
    return NextResponse.json(summary, {
      status: summary.ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Drive sync failed.',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
