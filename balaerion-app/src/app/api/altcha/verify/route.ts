import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAltchaSolution } from '@/lib/grants-crypto';
import { checkEndpointRateLimit, consumeAltchaNonceOnce } from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  const rl = await checkEndpointRateLimit('altcha_verify', ip, 30, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit reached or challenge store unavailable.' },
      { status: rl.storeUnavailable ? 503 : 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let body: { payload?: unknown; altcha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const secret = process.env.ALTCHA_HMAC_SECRET || process.env.ALTCHA_HMAC_KEY || '';
  const result = verifyAltchaSolution(secret, body.payload ?? body.altcha);
  if (!result.ok || !result.challengeHash || !result.expiresAtIso) {
    return NextResponse.json(
      { ok: false, error: result.reason || 'Invalid or expired ALTCHA solution.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const fresh = await consumeAltchaNonceOnce(result.challengeHash, result.expiresAtIso);
  if (!fresh) {
    return NextResponse.json(
      { ok: false, error: 'ALTCHA challenge nonce already consumed.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
