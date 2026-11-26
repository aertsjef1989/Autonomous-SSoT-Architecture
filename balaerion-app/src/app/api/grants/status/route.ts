import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { getCooldownMode, getDailyEmailCap, getGrantStatusBySession } from '@/lib/grants-store';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const policyMeta = {
    cooldownMode: getCooldownMode(),
    dailyEmailCap: getDailyEmailCap(),
    cookiePolicy: 'strictly-necessary-on-redeem-only',
  };

  if (isOwnerAuthenticated(request)) {
    return NextResponse.json(
      {
        active: true,
        mode: 'live',
        role: 'owner',
        unlimited: true,
        summary: {
          status: 'redeemed',
          remainingTokensWeighted: 999999999,
          remainingCalls: 999999,
        },
        policy: policyMeta,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const cookieVal = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, cookieVal);

  if (!claims) {
    return NextResponse.json(
      {
        active: false,
        mode: 'replay',
        role: 'visitor',
        summary: null,
        policy: policyMeta,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const summary = await getGrantStatusBySession(claims.gid, claims.jti);
  if (!summary || summary.status !== 'redeemed') {
    return NextResponse.json(
      {
        active: false,
        mode: 'replay',
        role: 'visitor',
        summary,
        policy: policyMeta,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      active: !summary.circuitOpen,
      mode: summary.circuitOpen ? 'replay_circuit_open' : 'live',
      role: 'grant',
      summary: {
        ...summary,
        remainingTokensWeighted: Math.max(0, summary.tokenBudgetWeighted - summary.tokensUsedWeighted),
        remainingCalls: Math.max(0, summary.callsBudget - summary.callsUsed),
      },
      policy: policyMeta,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
