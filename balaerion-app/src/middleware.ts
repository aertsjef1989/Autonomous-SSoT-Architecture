import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OWNER_COOKIE = 'balaerion_owner_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/admin')) {
    const ownerSecret = process.env.OWNER_ACCESS_SECRET;
    const cookieVal = request.cookies.get(OWNER_COOKIE)?.value;
    if (!ownerSecret || cookieVal !== ownerSecret) {
      return NextResponse.json({ error: 'Unauthorized: Tier 3 Owner access required.' }, { status: 401 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
