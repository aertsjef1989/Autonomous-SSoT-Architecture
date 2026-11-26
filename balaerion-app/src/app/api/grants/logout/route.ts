import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME } from '@/lib/grants-crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const res = NextResponse.json(
    { ok: true, mode: 'replay', message: 'Grant session cleared. Workspace returned to Replay Mode.' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
  const isSecure = process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:';
  res.cookies.set({
    name: GRANT_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
