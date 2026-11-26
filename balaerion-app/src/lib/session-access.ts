import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from './grants-crypto';
import { getGrantStatusBySession } from './grants-store';

export const OWNER_COOKIE_NAME = 'balaerion_owner_session';

export function constantTimeSecretMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function isOwnerAuthenticated(request: NextRequest): boolean {
  const ownerSecret = process.env.OWNER_ACCESS_SECRET ?? '';
  if (!ownerSecret || ownerSecret.length < 16) return false;
  const cookieVal = request.cookies.get(OWNER_COOKIE_NAME)?.value ?? '';
  if (cookieVal && constantTimeSecretMatch(cookieVal, ownerSecret)) return true;
  const authHeader = request.headers.get('authorization') ?? '';
  const bearerVal = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return Boolean(bearerVal && constantTimeSecretMatch(bearerVal, ownerSecret));
}

export async function verifyOwnerOrGrantSession(
  request: NextRequest
): Promise<{ authorized: true; role: 'owner' | 'grant' } | { authorized: false }> {
  if (isOwnerAuthenticated(request)) {
    return { authorized: true, role: 'owner' };
  }
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const grantCookie = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, grantCookie);
  if (!claims) return { authorized: false };
  const summary = await getGrantStatusBySession(claims.gid, claims.jti);
  if (!summary || summary.status !== 'redeemed') return { authorized: false };
  return { authorized: true, role: 'grant' };
}
