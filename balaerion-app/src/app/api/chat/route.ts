import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforcePreDispatchGate, normalizeLane, type LaneInput } from '@/lib/lane-guard';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { reconcileGrantTokens, reserveGrantTokensAtomic } from '@/lib/grants-store';
import { dispatchLlmRequest, type LlmMessage } from '@/lib/llm/router';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: {
    prompt?: unknown;
    lane?: unknown;
    provider?: unknown;
    model?: unknown;
    mode?: unknown;
    systemPrompt?: unknown;
    history?: unknown;
    reserveWeighted?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const laneInput: LaneInput =
    body.lane === 'general' ? 'general' : body.lane === 'safe' || body.lane === 'eu' ? body.lane : 'eu';
  const lane = normalizeLane(laneInput, 'safe');
  const preferredProvider =
    typeof body.provider === 'string' && body.provider.trim().length > 0
      ? body.provider.trim()
      : lane === 'safe'
        ? 'mistral'
        : 'groq';
  const modelOverride =
    typeof body.model === 'string' && body.model.trim().length > 0 ? body.model.trim() : undefined;
  const mode = typeof body.mode === 'string' ? body.mode : 'general';
  const customSystemPrompt =
    typeof body.systemPrompt === 'string' && body.systemPrompt.trim().length > 0
      ? body.systemPrompt.trim().slice(0, 4000)
      : '';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }
  if (prompt.length > 16000) {
    return NextResponse.json({ error: 'Prompt exceeds per-request input limit (16,000 chars).' }, { status: 413 });
  }

  const priorTurns: LlmMessage[] = Array.isArray(body.history)
    ? body.history
        .slice(-8)
        .filter(
          (m): m is { role: 'user' | 'assistant'; content: string } =>
            Boolean(m && typeof m === 'object' && ((m as { role?: string }).role === 'user' || (m as { role?: string }).role === 'assistant') && typeof (m as { content?: unknown }).content === 'string')
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];

  const combinedInputForPii = [customSystemPrompt, ...priorTurns.map((t) => t.content), prompt].filter(Boolean).join('\n');

  // 1. Pre-dispatch deterministic lane and PII gate (blocks loudly before any provider or grant spend)
  const gate = enforcePreDispatchGate(laneInput, preferredProvider, combinedInputForPii);
  if (!gate.allowed) {
    return NextResponse.json({ blocked: true, error: gate.reason }, { status: 403 });
  }

  const baseSystemContent = customSystemPrompt
    ? `${customSystemPrompt}\nNever use em dashes or en dashes.`
    : 'You are a concise systems engineering assistant inside an architecture workspace. Cite grounded context explicitly when provided. Never use em dashes or en dashes.';

  const messages: LlmMessage[] = [
    { role: 'system', content: baseSystemContent },
    ...priorTurns,
    { role: 'user', content: prompt },
  ];

  // 2A. Unlimited Live Mode for authenticated Owner session (Decision A1)
  if (isOwnerAuthenticated(request)) {
    const dispatched = await dispatchLlmRequest({
      lane: laneInput,
      preferredProviderId: preferredProvider,
      modelOverride,
      mode,
      messages,
      maxOutputTokens: 900,
      temperature: 0.2,
    });

    return NextResponse.json(
      {
        replay: dispatched.replay,
        grantAuthorized: true,
        ownerUnlimited: true,
        lane: dispatched.lane,
        provider: dispatched.providerId,
        model: dispatched.pinnedModelId,
        fallbackReason: dispatched.fallbackReason ?? null,
        chargedTokensWeighted: 0,
        remainingTokensWeighted: null,
        remainingCalls: null,
        reply: dispatched.content,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 2B. External visitors: fail closed on live calls without a redeemed single-use grant session cookie
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const grantToken = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = verifyGrantSessionCookie(sessionSecret, grantToken);

  if (!claims) {
    return NextResponse.json(
      {
        replay: true,
        error: 'Live AI calls require a redeemed single-use grant (/redeem) or Owner session (/admin). Serving Replay response.',
        reply: `[REPLAY | mode=${mode} | lane=${lane}] Pre-dispatch PII gate passed. Redeem a single-use grant on /redeem or unlock Owner Console on /admin to enable Live AI calls.`,
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 3. Atomic pre-call weighted token & call-count reservation for external grant holders
  const estimatedInputTokens = Math.max(50, Math.ceil(combinedInputForPii.length / 3.5));
  const requestedReserve =
    typeof body.reserveWeighted === 'number' && Number.isFinite(body.reserveWeighted)
      ? Math.floor(body.reserveWeighted)
      : estimatedInputTokens + 650;
  const reserveWeighted = Math.max(200, Math.min(requestedReserve, 6000));

  const reservation = await reserveGrantTokensAtomic(claims.gid, claims.jti, reserveWeighted);
  if (!reservation.allowed) {
    const status = reservation.reason === 'GRANT_SESSION_INVALID' || reservation.reason === 'GRANT_EXPIRED' ? 401 : 429;
    return NextResponse.json(
      {
        replay: true,
        budgetExhausted: status === 429,
        budgetReason: reservation.reason,
        circuitOpen: reservation.circuitOpen,
        remainingTokensWeighted: reservation.remainingTokens,
        remainingCalls: reservation.remainingCalls,
        error: `Live call blocked (${reservation.reason}). Serving deterministic Replay response.`,
        reply: `[REPLAY | mode=${mode} | lane=${lane}] Grant budget or global circuit limit reached (${reservation.reason}). Replay Mode stays active at zero cost.`,
      },
      { status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 4. Route through two-lane free-tier LLM router (strict same-lane failover, zero cross-lane leak)
  const holdReservationForTest = !process.env.VERCEL && process.env.P4_RESERVATION_HOLD_TEST === '1';
  const dispatched = await dispatchLlmRequest({
    lane: laneInput,
    preferredProviderId: preferredProvider,
    modelOverride,
    mode,
    messages,
    maxOutputTokens: 700,
    temperature: 0.2,
  });

  let actualCharged = reserveWeighted;
  if (!holdReservationForTest) {
    if (dispatched.replay) {
      await reconcileGrantTokens(claims.gid, reserveWeighted);
      actualCharged = 0;
    } else if (dispatched.usedTokensWeighted < reserveWeighted) {
      const refund = reserveWeighted - dispatched.usedTokensWeighted;
      await reconcileGrantTokens(claims.gid, refund);
      actualCharged = dispatched.usedTokensWeighted;
    }
  }

  return NextResponse.json(
    {
      replay: dispatched.replay,
      grantAuthorized: true,
      ownerUnlimited: false,
      lane: dispatched.lane,
      provider: dispatched.providerId,
      model: dispatched.pinnedModelId,
      fallbackReason: dispatched.fallbackReason ?? null,
      chargedTokensWeighted: actualCharged,
      remainingTokensWeighted: reservation.remainingTokens + (reserveWeighted - actualCharged),
      remainingCalls: reservation.remainingCalls,
      reply: dispatched.content,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
