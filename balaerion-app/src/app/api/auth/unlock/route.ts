import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, parseGrantCode, signGrantSessionCookie } from '@/lib/grants-crypto';
import { checkEndpointRateLimit, redeemSingleUseGrant } from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';
import { constantTimeSecretMatch, OWNER_COOKIE_NAME } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/unlock (Addendum Section 3.B):
 * Unlocks either Tier 3 Owner access (`OWNER_ACCESS_SECRET` -> `balaerion_owner_session`)
 * OR redeems a single-use Visitor Grant (`BLR-...` -> `balaerion_grant`).
 * Replay Mode never calls or needs this endpoint.
 */
export async function POST(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  const rl = await checkEndpointRateLimit('auth_unlock', ip, 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Unlock rate limit reached or session store unavailable. Replay Mode remains open.' },
      { status: rl.storeUnavailable ? 503 : 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let body: { token?: unknown; secret?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
  }

  const candidate =
    typeof body.token === 'string'
      ? body.token.trim()
      : typeof body.secret === 'string'
        ? body.secret.trim()
        : typeof body.code === 'string'
          ? body.code.trim()
          : '';

  if (!candidate) {
    return NextResponse.json({ error: 'Provide an Owner secret or single-use BLR-... grant code.' }, { status: 400 });
  }

  const isSecure = process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:';

  // Path 1: Single-use Visitor Grant (`BLR-...`)
  if (parseGrantCode(candidate)) {
    const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
    if (!sessionSecret || sessionSecret.length < 16) {
      return NextResponse.json({ error: 'Grant session signing unconfigured.' }, { status: 503 });
    }
    const redeemed = await redeemSingleUseGrant(candidate, 24);
    if (!redeemed.ok) {
      return NextResponse.json({ error: redeemed.error }, { status: redeemed.status });
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const signedCookie = signGrantSessionCookie(sessionSecret, {
      gid: redeemed.grantId,
      jti: redeemed.sessionJti,
      exp: redeemed.expiresAtSec,
    });
    const res = NextResponse.json(
      { ok: true, role: 'grant', summary: redeemed.summary },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
    res.cookies.set({
      name: GRANT_COOKIE_NAME,
      value: signedCookie,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.max(60, redeemed.expiresAtSec - nowSec),
    });
    return res;
  }

  // Path 2: Owner Access Secret (`OWNER_ACCESS_SECRET`)
  const ownerSecret = process.env.OWNER_ACCESS_SECRET ?? '';
  if (!ownerSecret || ownerSecret.length < 16) {
    return NextResponse.json({ error: 'Owner secret unconfigured.' }, { status: 503 });
  }
  if (!constantTimeSecretMatch(candidate, ownerSecret)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const res = NextResponse.json(
    { ok: true, role: 'owner' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
  res.cookies.set({
    name: OWNER_COOKIE_NAME,
    value: ownerSecret,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 3600,
  });
  return res;
}
