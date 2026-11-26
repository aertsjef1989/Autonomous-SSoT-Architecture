import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { issueSingleUseGrant } from '@/lib/grants-store';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isOwnerAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized: Owner session required.' }, { status: 401 });
  }

  let body: { tokenBudgetWeighted?: unknown; callsBudget?: unknown; ttlHours?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const issued = await issueSingleUseGrant({
    tokenBudgetWeighted: typeof body.tokenBudgetWeighted === 'number' ? body.tokenBudgetWeighted : 12000,
    callsBudget: typeof body.callsBudget === 'number' ? body.callsBudget : 25,
    ttlHours: typeof body.ttlHours === 'number' ? body.ttlHours : 48,
  });

  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const origin = request.nextUrl.origin;
  return NextResponse.json(
    {
      ok: true,
      code: issued.code,
      kid: issued.kid,
      expiresAt: issued.expiresAt,
      redeemFragmentPath: `/redeem#code=${encodeURIComponent(issued.code)}`,
      redeemFragmentUrl: `${origin}/redeem#code=${encodeURIComponent(issued.code)}`,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
