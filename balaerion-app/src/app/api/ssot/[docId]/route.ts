import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyOwnerOrGrantSession } from '@/lib/session-access';
import { getAuthorizedSsotDocumentById } from '@/lib/ssot-ingestion';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { docId: string } }
) {
  const auth = await verifyOwnerOrGrantSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Authorized Owner or Visitor Grant session required to read live SSoT Markdown.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const docId = decodeURIComponent(context.params.docId || '');
  if (!docId) {
    return NextResponse.json({ error: 'Missing docId.' }, { status: 400 });
  }

  const doc = await getAuthorizedSsotDocumentById(docId);
  if (!doc) {
    return NextResponse.json({ error: `SSoT document "${docId}" not found.` }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, role: auth.role, doc },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
