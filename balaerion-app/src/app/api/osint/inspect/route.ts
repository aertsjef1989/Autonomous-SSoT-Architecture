import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { getGrantStatusBySession } from '@/lib/grants-store';
import { getOsintCollectorStatuses, normalizeSafePublicDomain, runHybridOsintInspection } from '@/lib/osint/engine';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

async function hasActiveGrantSession(request: NextRequest): Promise<boolean> {
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const cookieVal = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, cookieVal);
  if (!claims) return false;
  const summary = await getGrantStatusBySession(claims.gid, claims.jti);
  return Boolean(summary && summary.status === 'redeemed' && !summary.circuitOpen);
}

export async function GET() {
  const collectors = getOsintCollectorStatuses(process.env);
  const liveCount = collectors.filter((c) => c.status === 'LIVE').length;
  return NextResponse.json(
    {
      collectors,
      liveCount,
      totalCount: collectors.length,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  let body: { domain?: unknown; entity?: unknown; country?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const rawDomain = typeof body.domain === 'string' ? body.domain.trim() : '';
  const entity = typeof body.entity === 'string' ? body.entity.trim().slice(0, 120) : '';
  const rawCountry = typeof body.country === 'string' ? body.country.trim().toUpperCase() : 'NL';
  const country: 'BE' | 'NL' | 'FR' | 'GLOBAL' =
    rawCountry === 'BE' || rawCountry === 'NL' || rawCountry === 'FR' || rawCountry === 'GLOBAL'
      ? rawCountry
      : 'NL';

  const normalized = normalizeSafePublicDomain(rawDomain || 'vuurtoren-atelier.example');
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  // Live outbound OSINT network lookups are gated behind Owner authentication or an active Reviewer Grant.
  // Passive unauthenticated visitors (or .example calibration domains) receive deterministic Replay OSINT.
  const ownerSession = isOwnerAuthenticated(request);
  const activeGrant = ownerSession ? false : await hasActiveGrantSession(request);
  const allowLiveNetwork = Boolean(ownerSession || activeGrant);

  const inspection = await runHybridOsintInspection({
    domain: normalized.domain,
    entity,
    country,
    allowLiveNetwork,
  });

  return NextResponse.json(
    {
      ok: true,
      authorizedLive: allowLiveNetwork,
      inspection,
      collectors: getOsintCollectorStatuses(process.env),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
