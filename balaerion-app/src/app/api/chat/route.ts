import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforcePreDispatchGate, normalizeLane, type LaneInput } from '@/lib/lane-guard';
import { GRANT_COOKIE_NAME, verifyGrantSessionCookie } from '@/lib/grants-crypto';
import { reconcileGrantTokens, reserveGrantTokensAtomic } from '@/lib/grants-store';
import { retrieveWorkspaceContext, type GroundedCitation } from '@/lib/llm/hybrid-retrieval';
import { dispatchLlmRequest, type LlmMessage } from '@/lib/llm/router';
import { isOwnerAuthenticated } from '@/lib/session-access';

export const dynamic = 'force-dynamic';

function buildGroundedReplayReply(
  mode: string,
  lane: string,
  prompt: string,
  citations: GroundedCitation[],
  unauthedNote?: string
): string {
  const prefix = `[REPLAY | mode=${mode} | lane=${lane}]`;
  if (citations.length > 0) {
    const citeSummary = citations
      .slice(0, 3)
      .map(
        (c) =>
          `[${c.docId}${c.isStale ? ' · REVIEW_DUE' : ''}] ${c.title} (${c.market}): ${c.snippet.replace(/\s+/g, ' ').slice(0, 190)}...`
      )
      .join('\n- ');
    return `${prefix} Grounded context matched for "${prompt.slice(0, 80)}":\n- ${citeSummary}${unauthedNote ? `\n\n${unauthedNote}` : ''}`;
  }
  return `${prefix} Pre-dispatch PII gate passed.${unauthedNote ? ` ${unauthedNote}` : ''}`;
}

export async function POST(request: NextRequest) {
  let body: {
    prompt?: unknown;
    lane?: unknown;
    provider?: unknown;
    model?: unknown;
    mode?: unknown;
    pillar?: unknown;
    market?: unknown;
    activeDocId?: unknown;
    syndicateContext?: unknown;
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
  const pillar =
    body.pillar === 'ssot' || body.pillar === 'prospecthub' || body.pillar === 'syndicate'
      ? body.pillar
      : undefined;
  const market = typeof body.market === 'string' ? body.market : 'ALL';
  const activeDocId = typeof body.activeDocId === 'string' && body.activeDocId.trim() ? body.activeDocId.trim() : undefined;
  const syndicateContext =
    typeof body.syndicateContext === 'string' && body.syndicateContext.trim()
      ? body.syndicateContext.trim().slice(0, 4000)
      : undefined;
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
            Boolean(
              m &&
                typeof m === 'object' &&
                ((m as { role?: string }).role === 'user' || (m as { role?: string }).role === 'assistant') &&
                typeof (m as { content?: unknown }).content === 'string'
            )
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];

  const combinedInputForPii = [customSystemPrompt, ...priorTurns.map((t) => t.content), prompt].filter(Boolean).join('\n');

  // 1. Pre-dispatch deterministic lane and PII gate on user-supplied text (blocks loudly before any provider or grant spend)
  const gate = enforcePreDispatchGate(laneInput, preferredProvider, combinedInputForPii);
  if (!gate.allowed) {
    return NextResponse.json({ blocked: true, error: gate.reason }, { status: 403 });
  }

  const ownerAuth = isOwnerAuthenticated(request);
  const sessionSecret = process.env.GRANT_SESSION_SECRET ?? '';
  const grantToken = request.cookies.get(GRANT_COOKIE_NAME)?.value ?? null;
  const claims = ownerAuth ? null : verifyGrantSessionCookie(sessionSecret, grantToken);
  const authorizedForLive = ownerAuth || Boolean(claims);

  // 2. Hybrid Retrieval Slot when pillar is specified (SSoT / ProspectHub / Syndicate)
  const retrieved = pillar
    ? await retrieveWorkspaceContext({
        query: prompt,
        pillar,
        market,
        activeDocId,
        syndicateContext,
        topK: 5,
        authorizedForLiveCorpus: authorizedForLive,
      })
    : { chunks: [], citations: [] as GroundedCitation[] };

  const staleWarning = retrieved.citations.some((c) => c.isStale);

  const slashInstruction = prompt.startsWith('/check')
    ? 'Command /check: audit the user scenario against the grounded SSoT rules, list PASS vs FAIL items, and cite [DOC_ID].'
    : prompt.startsWith('/policy')
      ? 'Command /policy: extract exact market and consent/targeting policy obligations from grounded SSoT chunks and cite [DOC_ID].'
      : prompt.startsWith('/gap')
        ? 'Command /gap: identify missing coverage, unverified assumptions, or REVIEW_DUE staleness gaps across the retrieved SSoT chunks.'
        : prompt.startsWith('/ask')
          ? 'Command /ask: answer directly from grounded SSoT chunks with inline [DOC_ID] citations.'
          : '';

  const contextBlock =
    retrieved.citations.length > 0
      ? `\n\n[GROUNDED WORKSPACE CONTEXT]\n${retrieved.citations
          .map(
            (c) =>
              `Source [${c.docId}] (${c.market} | status=${c.status}${c.isStale ? ' | STALE_WARNING' : ''}) - ${c.title}:\n${c.snippet}`
          )
          .join('\n\n')}\n[END GROUNDED WORKSPACE CONTEXT]\nCite sources inline as [DOC_ID]. If any cited source has STALE_WARNING, explicitly note that human verification is due.`
      : '';

  // Scrub any accidental emails/VAT inside retrieved context before passing through router's pre-dispatch gate
  const safeContextBlock = contextBlock
    .replace(/\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, '$1@redacted.example')
    .replace(/\b(BE|NL|DE|FR|ES|IT|PT)\s?0?\d{3}[.\s]?\d{3}[.\s]?\d{3}\b/gi, '$1-REDACTED-VAT');

  const baseSystemContent = `${
    customSystemPrompt ||
    'You are a concise systems engineering and commercial architecture assistant. Ground answers in provided context, cite [DOC_ID] when available, and keep guidance clear and actionable.'
  } ${slashInstruction} Never use em dashes or en dashes.${safeContextBlock}`;

  const messages: LlmMessage[] = [
    { role: 'system', content: baseSystemContent },
    ...priorTurns,
    { role: 'user', content: prompt },
  ];

  // 3A. Unlimited Live Mode for authenticated Owner session (Decision A1)
  if (ownerAuth) {
    const dispatched = await dispatchLlmRequest({
      lane: laneInput,
      preferredProviderId: preferredProvider,
      modelOverride,
      mode,
      messages,
      maxOutputTokens: 950,
      temperature: 0.2,
    });

    const replyText =
      dispatched.replay && retrieved.citations.length > 0
        ? buildGroundedReplayReply(mode, dispatched.lane, prompt, retrieved.citations)
        : dispatched.content;

    return NextResponse.json(
      {
        replay: dispatched.replay,
        grantAuthorized: true,
        ownerUnlimited: true,
        lane: dispatched.lane,
        provider: dispatched.providerId,
        model: dispatched.pinnedModelId,
        fallbackReason: dispatched.fallbackReason ?? null,
        citations: retrieved.citations,
        staleWarning,
        chargedTokensWeighted: 0,
        remainingTokensWeighted: null,
        remainingCalls: null,
        reply: replyText,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 3B. External visitors without grant: fail closed with grounded synthetic Replay preview
  if (!claims) {
    return NextResponse.json(
      {
        replay: true,
        citations: retrieved.citations,
        staleWarning,
        error: 'Live AI calls require a redeemed single-use grant (/redeem) or Owner session (/admin). Serving Replay response.',
        reply: buildGroundedReplayReply(
          mode,
          lane,
          prompt,
          retrieved.citations,
          'Redeem a single-use grant on /redeem or unlock Owner Console on /admin to enable Live AI calls.'
        ),
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 4. Atomic pre-call weighted token & call-count reservation for external grant holders
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
        citations: retrieved.citations,
        staleWarning,
        remainingTokensWeighted: reservation.remainingTokens,
        remainingCalls: reservation.remainingCalls,
        error: `Live call blocked (${reservation.reason}). Serving deterministic Replay response.`,
        reply: buildGroundedReplayReply(
          mode,
          lane,
          prompt,
          retrieved.citations,
          `Grant budget or global circuit limit reached (${reservation.reason}).`
        ),
      },
      { status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 5. Route through two-lane free-tier LLM router (strict same-lane failover, zero cross-lane leak)
  const holdReservationForTest = !process.env.VERCEL && process.env.P4_RESERVATION_HOLD_TEST === '1';
  const dispatched = await dispatchLlmRequest({
    lane: laneInput,
    preferredProviderId: preferredProvider,
    modelOverride,
    mode,
    messages,
    maxOutputTokens: 800,
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

  const replyText =
    dispatched.replay && retrieved.citations.length > 0
      ? buildGroundedReplayReply(mode, dispatched.lane, prompt, retrieved.citations)
      : dispatched.content;

  return NextResponse.json(
    {
      replay: dispatched.replay,
      grantAuthorized: true,
      ownerUnlimited: false,
      lane: dispatched.lane,
      provider: dispatched.providerId,
      model: dispatched.pinnedModelId,
      fallbackReason: dispatched.fallbackReason ?? null,
      citations: retrieved.citations,
      staleWarning,
      chargedTokensWeighted: actualCharged,
      remainingTokensWeighted: reservation.remainingTokens + (reserveWeighted - actualCharged),
      remainingCalls: reservation.remainingCalls,
      reply: replyText,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
