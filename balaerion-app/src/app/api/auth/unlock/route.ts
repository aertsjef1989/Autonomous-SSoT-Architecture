import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const required = process.env.BALAERION_ACCESS_PASSWORD;

  if (!required || password !== required) {
    return NextResponse.json({ error: 'Invalid access password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('balaerion_access_granted', required, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
