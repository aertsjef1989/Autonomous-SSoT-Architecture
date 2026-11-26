import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkEndpointRateLimit } from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

const OWNER_COOKIE = 'balaerion_owner_session';

function timingSafeMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  const rl = await checkEndpointRateLimit('owner_unlock', ip, 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many owner unlock attempts.' }, { status: rl.storeUnavailable ? 503 : 429 });
  }

  const ownerSecret = process.env.OWNER_ACCESS_SECRET ?? '';
  if (!ownerSecret || ownerSecret.length < 16) {
    return NextResponse.json({ error: 'Owner console disabled (OWNER_ACCESS_SECRET unset).' }, { status: 503 });
  }

  let body: { secret?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const candidate = typeof body.secret === 'string' ? body.secret : '';
  if (!timingSafeMatch(candidate, ownerSecret)) {
    return NextResponse.json({ error: 'Invalid owner secret.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  const isSecure = process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:';
  res.cookies.set({
    name: OWNER_COOKIE,
    value: ownerSecret,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 3600,
  });
  return res;
}
