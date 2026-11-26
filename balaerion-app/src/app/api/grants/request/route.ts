import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAltchaSolution } from '@/lib/grants-crypto';
import {
  checkAndRecordEmailCooldown,
  checkEndpointRateLimit,
  consumeAltchaNonceOnce,
  issueSingleUseGrant,
  reserveDailyEmailSlot,
} from '@/lib/grants-store';
import { extractTransientClientIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

const UNIFORM_ACCEPTED_MESSAGE =
  'If eligible and within daily free-tier capacity, a single-use grant link has been dispatched. Replay Mode remains open immediately without a grant.';

function isSyntacticallyValidEmail(val: string): boolean {
  if (val.length < 5 || val.length > 254) return false;
  if (/[\r\n\s<>]/.test(val)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
}

export async function POST(request: NextRequest) {
  const ip = extractTransientClientIp(request);
  // Strict mail-bombing guard: max 3 grant requests per hour per daily-rotating salted IP hash
  const rl = await checkEndpointRateLimit('grant_request', ip, 3, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Hourly grant request limit reached. Use Replay Mode without a grant or try again later.' },
      { status: rl.storeUnavailable ? 503 : 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let body: { email?: unknown; altcha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isSyntacticallyValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const altchaSecret = process.env.ALTCHA_HMAC_SECRET || process.env.ALTCHA_HMAC_KEY || '';
  const verified = verifyAltchaSolution(altchaSecret, body.altcha);
  if (!verified.ok || !verified.challengeHash || !verified.expiresAtIso) {
    return NextResponse.json(
      { error: 'Verification challenge invalid or expired. Reload challenge and retry.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const freshNonce = await consumeAltchaNonceOnce(verified.challengeHash, verified.expiresAtIso);
  if (!freshNonce) {
    return NextResponse.json(
      { error: 'Verification challenge was already used. Request a fresh challenge.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Anti-enumeration & anti-mail-bombing: from here onward, return uniform 202 response whether
  // blocked by recipient HMAC cooldown or daily quota exhaustion. Never log or store the email.
  const cooldownAllowed = await checkAndRecordEmailCooldown(email, 24);
  if (!cooldownAllowed) {
    return NextResponse.json({ ok: true, message: UNIFORM_ACCEPTED_MESSAGE }, { status: 202 });
  }

  const resendKey = process.env.RESEND_API_KEY ?? '';
  const fromEmail = process.env.GRANT_FROM_EMAIL ?? '';
  const dryRunMode = process.env.GRANT_EMAIL_DRY_RUN === '1' && process.env.ALLOW_LOCAL_EPHEMERAL_STORE === '1';

  if (!dryRunMode && (!resendKey || !fromEmail)) {
    return NextResponse.json(
      { error: 'Self-serve email dispatch is not enabled on this instance. Ask the owner for a hand-shared grant code or use Replay Mode.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const emailSlotReserved = await reserveDailyEmailSlot();
  if (!emailSlotReserved) {
    return NextResponse.json({ ok: true, message: UNIFORM_ACCEPTED_MESSAGE }, { status: 202 });
  }

  const issued = await issueSingleUseGrant({ tokenBudgetWeighted: 12000, callsBudget: 25, ttlHours: 48 });
  if (!issued.ok) {
    return NextResponse.json(
      { error: 'Grant store temporarily paused or unavailable. Replay Mode remains open.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Build redemption fragment link (#code=...) from request origin so the unlisted origin is never hardcoded in source
  const origin = request.nextUrl.origin;
  const redeemFragmentUrl = `${origin}/redeem#code=${encodeURIComponent(issued.code)}`;

  if (!dryRunMode) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Single-Use Live AI Grant Code (Portfolio POC)',
          text: [
            'You requested a single-use grant code for Live AI Assist in the Systems Design Workspace POC.',
            '',
            `Redeem link (code stays in URL fragment): ${redeemFragmentUrl}`,
            `Manual code: ${issued.code}`,
            `Expires: ${issued.expiresAt}`,
            '',
            'Synthetic data only: never paste real client, employer, or personal data into Live AI prompts.',
            'If you did not request this email, ignore it; your address was not stored in our database.',
          ].join('\n'),
        }),
      });
      if (!resp.ok) {
        return NextResponse.json(
          { error: 'Email provider throttled or unavailable. Replay Mode remains open without a grant.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Email dispatch failed cleanly. Replay Mode remains open without a grant.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  return NextResponse.json(
    { ok: true, message: UNIFORM_ACCEPTED_MESSAGE },
    { status: 202, headers: { 'Cache-Control': 'no-store' } }
  );
}
