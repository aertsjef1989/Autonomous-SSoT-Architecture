import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAltchaChallenge } from '@/lib/grants-crypto';
import { checkEndpointRateLimit } from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  const rl = await checkEndpointRateLimit('altcha_challenge', ip, 30, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit reached for challenge generation. Replay Mode remains available without a grant.' },
      { status: rl.storeUnavailable ? 503 : 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const secret = process.env.ALTCHA_HMAC_SECRET || process.env.ALTCHA_HMAC_KEY || '';
  if (!secret || secret.length < 16) {
    return NextResponse.json(
      { error: 'Self-serve grant challenge is currently disabled. Replay Mode remains open.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const challenge = createAltchaChallenge(secret, { maxnumber: 35000, ttlSeconds: 300 });
  return NextResponse.json(challenge, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
