import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { getCooldownMode, getDailyEmailCap, getGrantStatusBySession } from '@/lib/grants-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const cookieVal = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, cookieVal);

  const policyMeta = {
    cooldownMode: getCooldownMode(),
    dailyEmailCap: getDailyEmailCap(),
    cookiePolicy: 'strictly-necessary-on-redeem-only',
  };

  if (!claims) {
    return NextResponse.json(
      {
        active: false,
        mode: 'replay',
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
