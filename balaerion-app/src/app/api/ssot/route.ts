import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyOwnerOrGrantSession } from '@/lib/session-access';
import { queryAuthorizedSsotDocuments } from '@/lib/ssot-ingestion';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyOwnerOrGrantSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        replay: true,
        authorized: false,
        error: 'Live Drive-backed SSoT corpus requires an Owner session or redeemed Visitor Grant (/redeem). Showing synthetic Replay catalog.',
        docs: [],
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const sp = request.nextUrl.searchParams;
  const market = sp.get('market') || 'ALL';
  const category = sp.get('category') || 'ALL';
  const q = sp.get('q') || '';

  const res = await queryAuthorizedSsotDocuments({ market, category, q });
  if (!res.ok) {
    return NextResponse.json(
      { replay: true, authorized: true, role: auth.role, docs: [], error: res.error },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      replay: false,
      authorized: true,
      role: auth.role,
      market,
      category,
      docs: res.docs,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
