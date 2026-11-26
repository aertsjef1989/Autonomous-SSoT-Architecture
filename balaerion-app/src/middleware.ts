import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OWNER_COOKIE = 'balaerion_owner_session';

function constantTimeEquals(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length || aBytes.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/admin')) {
    const ownerSecret = process.env.OWNER_ACCESS_SECRET ?? '';
    const cookieVal = request.cookies.get(OWNER_COOKIE)?.value ?? '';
    const authHeader = request.headers.get('authorization') ?? '';
    const bearerVal = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const okCookie = Boolean(ownerSecret && constantTimeEquals(cookieVal, ownerSecret));
    const okBearer = Boolean(ownerSecret && constantTimeEquals(bearerVal, ownerSecret));
    if (!okCookie && !okBearer) {
      return NextResponse.json(
        { error: 'Unauthorized: Owner session required.' },
        {
          status: 401,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
            'Referrer-Policy': 'no-referrer',
          },
        }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  return response;
}

export const config = {
  matcher: ['/:path*'],
};
