import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { issueSingleUseGrant } from '@/lib/grants-store';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

function isValidEmail(val: string): boolean {
  if (val.length < 5 || val.length > 254) return false;
  if (/[\r\n\s<>]/.test(val)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
}

export async function POST(request: NextRequest) {
  if (!isOwnerAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized: Owner session required.' }, { status: 401 });
  }

  let body: {
    tokenBudgetWeighted?: unknown;
    callsBudget?: unknown;
    ttlHours?: unknown;
    sendToEmail?: unknown;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const callsBudget = typeof body.callsBudget === 'number' ? body.callsBudget : 25;
  const ttlHours = typeof body.ttlHours === 'number' ? body.ttlHours : 48;
  const tokenBudgetWeighted = typeof body.tokenBudgetWeighted === 'number' ? body.tokenBudgetWeighted : 12000;

  const issued = await issueSingleUseGrant({
    tokenBudgetWeighted,
    callsBudget,
    ttlHours,
  });

  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const origin = request.nextUrl.origin;
  const redeemFragmentPath = `/redeem#code=${encodeURIComponent(issued.code)}`;
  const redeemFragmentUrl = `${origin}${redeemFragmentPath}`;

  const recipientEmail = typeof body.sendToEmail === 'string' ? body.sendToEmail.trim() : '';
  let emailDispatched = false;
  let emailNotice = '';

  if (recipientEmail) {
    if (!isValidEmail(recipientEmail)) {
      emailNotice = 'Grant minted, but recipient email format was invalid so email dispatch was skipped.';
    } else {
      const resendKey = (process.env.RESEND_API_KEY ?? '').trim();
      const fromEmail = (process.env.GRANT_FROM_EMAIL ?? '').trim();
      if (!resendKey || !fromEmail) {
        emailNotice = 'Grant minted; RESEND_API_KEY / GRANT_FROM_EMAIL not configured, so copy and share the link manually.';
      } else {
        try {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [recipientEmail],
              subject: 'Approved Reviewer Grant: Systems Design Live Workspace',
              text: [
                'Your request for live sandbox access to the Systems Design Portfolio Workspace has been approved.',
                '',
                `1-Click Redeem Link (code stays in URL fragment): ${redeemFragmentUrl}`,
                `Manual Grant Code: ${issued.code}`,
                `Quota: ${callsBudget} live calls (${tokenBudgetWeighted} weighted tokens) · Expires: ${issued.expiresAt}`,
                '',
                'Confidentiality note: use synthetic test inputs only; never submit real client or personal data.',
              ].join('\n'),
            }),
          });
          if (resp.ok) {
            emailDispatched = true;
            emailNotice = `Approved grant link dispatched via Resend to ${recipientEmail}.`;
          } else {
            emailNotice = `Grant minted, but Resend returned HTTP ${resp.status}; share the fragment URL manually.`;
          }
        } catch {
          emailNotice = 'Grant minted, but network dispatch to Resend failed; share the fragment URL manually.';
        }
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      code: issued.code,
      kid: issued.kid,
      expiresAt: issued.expiresAt,
      redeemFragmentPath,
      redeemFragmentUrl,
      emailDispatched,
      emailNotice: emailNotice || undefined,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
