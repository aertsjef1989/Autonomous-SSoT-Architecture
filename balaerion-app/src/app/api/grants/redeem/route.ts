import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, signGrantSessionCookie } from '@/lib/grants-crypto';
import { checkEndpointRateLimit, redeemSingleUseGrant } from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  const rl = await checkEndpointRateLimit('grant_redeem', ip, 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many redemption attempts from this network window. Try again later or continue in Replay Mode.' },
      { status: rl.storeUnavailable ? 503 : 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  if (!sessionSecret || sessionSecret.length < 16) {
    return NextResponse.json(
      { error: 'Grant session signing is unconfigured. Replay Mode remains open.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  const redeemed = await redeemSingleUseGrant(code, 24);
  if (!redeemed.ok) {
    return NextResponse.json(
      { error: redeemed.error },
      { status: redeemed.status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(60, redeemed.expiresAtSec - nowSec);
  const signedCookie = signGrantSessionCookie(sessionSecret, {
    gid: redeemed.grantId,
    jti: redeemed.sessionJti,
    exp: redeemed.expiresAtSec,
  });

  const res = NextResponse.json(
    {
      ok: true,
      mode: 'live',
      summary: redeemed.summary,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );

  // Strictly necessary session authentication cookie set ONLY after explicit user grant redemption (V11: ePrivacy Art. 5(3) / WP29 04/2012 Criterion B)
  const isSecure = process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:';
  res.cookies.set({
    name: GRANT_COOKIE_NAME,
    value: signedCookie,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return res;
}
