import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { reconcileGrantTokens, reserveGrantTokensAtomic } from '@/lib/grants-store';
import { enforcePreDispatchGate, normalizeLane, type LaneInput } from '@/lib/lane-guard';
import { isOwnerAuthenticated } from '@/lib/session-access';
import {
  buildReplayAssistOutput,
  runPressAssistAction,
  type PressAssistAction,
  type PressAssistInput,
} from '@/lib/ai-assist/press-assist-engine';
import type { PressLanguage } from '@/lib/press/schema';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = new Set<PressAssistAction>(['draft', 'tighten', 'translate', 'critic']);
const VALID_LOCALES = new Set<PressLanguage>(['en-GB', 'nl-BE', 'nl-NL', 'fr-BE']);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
  }

  const action = body.action as PressAssistAction;
  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid assist action.' }, { status: 400 });
  }

  // F5 mandatory explicit consent gate BEFORE any grant or LLM processing
  if (body.consentConfirmed !== true) {
    return NextResponse.json(
      {
        error:
          'F5_CONSENT_REQUIRED: Confirm synthetic-only data and provider notice before running AI Assist.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const briefOrText = typeof body.briefOrText === 'string' ? body.briefOrText.trim() : '';
  if (!briefOrText) {
    return NextResponse.json({ error: 'briefOrText is required.' }, { status: 400 });
  }
  if (briefOrText.length > 12000) {
    return NextResponse.json({ error: 'Input exceeds 12,000 character limit.' }, { status: 413 });
  }

  const laneInput: LaneInput =
    body.lane === 'general' ? 'general' : body.lane === 'safe' || body.lane === 'eu' ? body.lane : 'eu';
  const lane = normalizeLane(laneInput, 'safe');
  const defaultProv = lane === 'safe' ? 'ovhcloud-eu' : 'groq';

  const gate = enforcePreDispatchGate(laneInput, defaultProv, briefOrText);
  if (!gate.allowed) {
    return NextResponse.json({ blocked: true, error: gate.reason }, { status: 403 });
  }

  const assistInput: PressAssistInput = {
    action,
    consentConfirmed: true,
    lane: laneInput,
    targetLocale: VALID_LOCALES.has(body.targetLocale as PressLanguage)
      ? (body.targetLocale as PressLanguage)
      : 'nl-BE',
    blockType:
      body.blockType === 'bullets' || body.blockType === 'callout' ? body.blockType : 'paragraph',
    sourceId: typeof body.sourceId === 'string' ? body.sourceId : undefined,
    briefOrText,
    audience: body.audience === 'client' ? 'client' : 'internal',
  };

  if (isOwnerAuthenticated(request)) {
    const ownerResult = await runPressAssistAction(assistInput);
    return NextResponse.json(ownerResult, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  // Verify single-use grant session cookie; if ungranted, return 401 with synthetic Replay preview (still marked aiDraft: true!)
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const cookieVal = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, cookieVal);

  if (!claims) {
    const replayOut = buildReplayAssistOutput(assistInput);
    return NextResponse.json(
      {
        ...replayOut,
        error: 'No active Live AI grant redeemed (/redeem). Returned deterministic Replay draft (still requires human Accept Draft before export).',
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const reserveWeighted = Math.max(300, Math.min(Math.ceil(briefOrText.length / 3.5) + 700, 4500));
  const reservation = await reserveGrantTokensAtomic(claims.gid, claims.jti, reserveWeighted);
  if (!reservation.allowed) {
    const replayOut = buildReplayAssistOutput(assistInput);
    return NextResponse.json(
      {
        ...replayOut,
        budgetReason: reservation.reason,
        error: `Grant budget limit reached (${reservation.reason}). Returned deterministic Replay draft.`,
      },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const result = await runPressAssistAction(assistInput);
  if (result.replay) {
    await reconcileGrantTokens(claims.gid, reserveWeighted);
  } else if (result.usedTokensWeighted < reserveWeighted) {
    await reconcileGrantTokens(claims.gid, reserveWeighted - result.usedTokensWeighted);
  }

  return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
