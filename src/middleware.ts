import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_COOKIE = 'balaerion_access_granted';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth endpoint
  if (pathname === '/login' || pathname === '/api/auth/unlock') {
    return NextResponse.next();
  }

  const requiredPassword = process.env.BALAERION_ACCESS_PASSWORD;
  const cookieVal = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!requiredPassword || cookieVal !== requiredPassword) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Edge Password Gate locked.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
