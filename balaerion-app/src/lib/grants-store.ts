import crypto from 'crypto';
import { getSupabaseServer } from './supabase-server';
import {
  computeGrantCodeHmac,
  constantTimeHexEquals,
  hashEmailForCooldown,
  hashIpForRateLimit,
  mintGrantCodeMaterial,
  parseGrantCode,
} from './grants-crypto';

export type CooldownMode = 'off' | 'hmac';

export interface GrantRecordSummary {
  grantId: string;
  status: 'issued' | 'redeemed' | 'revoked' | 'expired';
  tokenBudgetWeighted: number;
  tokensUsedWeighted: number;
  callsBudget: number;
  callsUsed: number;
  expiresAt: string;
  circuitOpen: boolean;
}

interface EphemeralGrantRow {
  id: string;
  kid: string;
  salt: Buffer;
  codeHmac: string;
  status: 'issued' | 'redeemed' | 'revoked' | 'expired';
  sessionJti: string | null;
  tokenBudgetWeighted: number;
  tokensUsedWeighted: number;
  callsBudget: number;
  callsUsed: number;
  expiresAtMs: number;
}

interface EphemeralState {
  grantsByKid: Map<string, EphemeralGrantRow>;
  grantsById: Map<string, EphemeralGrantRow>;
  cooldowns: Map<string, number>;
  altchaNonces: Map<string, number>;
  rateLimits: Map<string, { hits: number; expiresAtMs: number }>;
  dailyCircuit: Map<
    string,
    { emailsSent: number; emailsCap: number; usedWeighted: number; capWeighted: number; circuitOpen: boolean }
  >;
}

const globalForEphemeral = globalThis as unknown as { __balaerionP4State?: EphemeralState };

function getEphemeralState(): EphemeralState {
  if (!globalForEphemeral.__balaerionP4State) {
    globalForEphemeral.__balaerionP4State = {
      grantsByKid: new Map(),
      grantsById: new Map(),
      cooldowns: new Map(),
      altchaNonces: new Map(),
      rateLimits: new Map(),
      dailyCircuit: new Map(),
    };
  }
  return globalForEphemeral.__balaerionP4State;
}

function isEphemeralEnabled(): boolean {
  return !process.env.VERCEL && process.env.ALLOW_LOCAL_EPHEMERAL_STORE === '1';
}

export function getCooldownMode(): CooldownMode {
  return process.env.COOLDOWN_MODE === 'hmac' ? 'hmac' : 'off';
}

export function getDailyEmailCap(): number {
  const raw = Number(process.env.GRANT_DAILY_EMAIL_CAP ?? '40');
  if (!Number.isFinite(raw) || raw < 1) return 40;
  // Never exceed 90/day so we stay strictly inside Resend's 100/UTC-day free tier (V8)
  return Math.min(Math.floor(raw), 90);
}

export function getDailyWeightedTokenCap(): number {
  const raw = Number(process.env.GLOBAL_DAILY_TOKEN_CAP_WEIGHTED ?? '250000');
  if (!Number.isFinite(raw) || raw < 1000) return 250000;
  return Math.floor(raw);
}

function parsePgBytea(val: string): Buffer {
  if (val.startsWith('\\x')) {
    return Buffer.from(val.slice(2), 'hex');
  }
  return Buffer.from(val, 'base64');
}

export async function checkEndpointRateLimit(
  endpoint: string,
  rawIp: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; storeUnavailable?: boolean; resetAtIso: string }> {
  const ipPepper = process.env.IP_RATE_PEPPER || process.env.GRANT_SESSION_SECRET || '';
  if (!ipPepper || ipPepper.length < 16) {
    return { allowed: false, storeUnavailable: true, resetAtIso: new Date(Date.now() + windowSeconds * 1000).toISOString() };
  }
  const bucketKey = `${endpoint}:${hashIpForRateLimit(ipPepper, rawIp).slice(0, 48)}`;
  const sb = getSupabaseServer();
  if (sb) {
    const { data, error } = await sb.rpc('check_rate_limit', {
      p_bucket_key: bucketKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || !Array.isArray(data) || data.length === 0) {
      return { allowed: false, storeUnavailable: true, resetAtIso: new Date(Date.now() + windowSeconds * 1000).toISOString() };
    }
    const row = data[0] as { allowed: boolean; reset_at: string };
    return { allowed: Boolean(row.allowed), resetAtIso: row.reset_at };
  }

  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const now = Date.now();
    const existing = st.rateLimits.get(bucketKey);
    if (!existing || existing.expiresAtMs <= now) {
      const expiresAtMs = now + windowSeconds * 1000;
      st.rateLimits.set(bucketKey, { hits: 1, expiresAtMs });
      return { allowed: 1 <= limit, resetAtIso: new Date(expiresAtMs).toISOString() };
    }
    existing.hits += 1;
    return { allowed: existing.hits <= limit, resetAtIso: new Date(existing.expiresAtMs).toISOString() };
  }

  return { allowed: false, storeUnavailable: true, resetAtIso: new Date(Date.now() + windowSeconds * 1000).toISOString() };
}

export async function consumeAltchaNonceOnce(challengeHash: string, expiresAtIso: string): Promise<boolean> {
  const sb = getSupabaseServer();
  if (sb) {
    const { error } = await sb.from('altcha_replay_nonces').insert({
      challenge_hash: challengeHash,
      expires_at: expiresAtIso,
    });
    return !error;
  }
  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const now = Date.now();
    const existingExp = st.altchaNonces.get(challengeHash);
    if (existingExp && existingExp > now) return false;
    st.altchaNonces.set(challengeHash, new Date(expiresAtIso).getTime());
    return true;
  }
  return false;
}

export async function checkAndRecordEmailCooldown(rawEmail: string, ttlHours = 24): Promise<boolean> {
  const mode = getCooldownMode();
  if (mode === 'off') {
    return true;
  }
  const emailPepper = process.env.EMAIL_COOLDOWN_PEPPER ?? '';
  if (!emailPepper || emailPepper.length < 16) {
    return false;
  }
  const emailHmac = hashEmailForCooldown(emailPepper, rawEmail);
  const expiresAtMs = Date.now() + ttlHours * 3600 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  const sb = getSupabaseServer();
  if (sb) {
    await sb.from('cooldown_hashes').delete().lte('expires_at', new Date().toISOString());
    const { error } = await sb.from('cooldown_hashes').insert({
      email_hmac: emailHmac,
      expires_at: expiresAtIso,
    });
    return !error;
  }
  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const now = Date.now();
    const existing = st.cooldowns.get(emailHmac);
    if (existing && existing > now) return false;
    st.cooldowns.set(emailHmac, expiresAtMs);
    return true;
  }
  return false;
}

export async function reserveDailyEmailSlot(): Promise<boolean> {
  const cap = getDailyEmailCap();
  const sb = getSupabaseServer();
  if (sb) {
    const { data, error } = await sb.rpc('reserve_daily_email_slot', { p_cap: cap });
    if (error) return false;
    return Boolean(data);
  }
  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const today = new Date().toISOString().slice(0, 10);
    let row = st.dailyCircuit.get(today);
    if (!row) {
      row = { emailsSent: 0, emailsCap: cap, usedWeighted: 0, capWeighted: getDailyWeightedTokenCap(), circuitOpen: false };
      st.dailyCircuit.set(today, row);
    }
    row.emailsCap = Math.min(cap, 90);
    if (row.circuitOpen || row.emailsSent + 1 > row.emailsCap) return false;
    row.emailsSent += 1;
    return true;
  }
  return false;
}

export interface IssueGrantOptions {
  tokenBudgetWeighted?: number;
  callsBudget?: number;
  ttlHours?: number;
}

export async function issueSingleUseGrant(
  opts?: IssueGrantOptions
): Promise<{ ok: true; code: string; kid: string; expiresAt: string } | { ok: false; error: string }> {
  const pepper = process.env.GRANT_CODE_PEPPER ?? '';
  if (!pepper || pepper.length < 16) {
    return { ok: false, error: 'Grant subsystem unconfigured (missing GRANT_CODE_PEPPER).' };
  }
  const tokenBudgetWeighted = Math.max(500, Math.min(opts?.tokenBudgetWeighted ?? 12000, 100000));
  const callsBudget = Math.max(1, Math.min(opts?.callsBudget ?? 25, 200));
  const ttlHours = Math.max(1, Math.min(opts?.ttlHours ?? 48, 168));
  const expiresAtMs = Date.now() + ttlHours * 3600 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const minted = mintGrantCodeMaterial(pepper);

  const sb = getSupabaseServer();
  if (sb) {
    const { error } = await sb.from('grants').insert({
      kid: minted.kid,
      salt: minted.saltHex,
      code_hmac: minted.codeHmac,
      status: 'issued',
      token_budget_weighted: tokenBudgetWeighted,
      tokens_used_weighted: 0,
      calls_budget: callsBudget,
      calls_used: 0,
      expires_at: expiresAtIso,
    });
    if (error) {
      return { ok: false, error: 'Database unavailable while issuing grant.' };
    }
    return { ok: true, code: minted.code, kid: minted.kid, expiresAt: expiresAtIso };
  }

  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const row: EphemeralGrantRow = {
      id: crypto.randomUUID(),
      kid: minted.kid,
      salt: minted.salt,
      codeHmac: minted.codeHmac,
      status: 'issued',
      sessionJti: null,
      tokenBudgetWeighted,
      tokensUsedWeighted: 0,
      callsBudget,
      callsUsed: 0,
      expiresAtMs,
    };
    st.grantsByKid.set(row.kid, row);
    st.grantsById.set(row.id, row);
    return { ok: true, code: minted.code, kid: minted.kid, expiresAt: expiresAtIso };
  }

  return { ok: false, error: 'Grant store unavailable (Supabase unconfigured or paused).' };
}

export async function redeemSingleUseGrant(
  rawCode: string,
  sessionTtlHours = 24
): Promise<
  | {
      ok: true;
      grantId: string;
      sessionJti: string;
      expiresAtSec: number;
      summary: GrantRecordSummary;
    }
  | { ok: false; status: number; error: string }
> {
  const pepper = process.env.GRANT_CODE_PEPPER ?? '';
  if (!pepper || pepper.length < 16) {
    return { ok: false, status: 503, error: 'Grant subsystem unconfigured. Replay Mode remains open.' };
  }
  const parsed = parseGrantCode(rawCode);
  if (!parsed) {
    return { ok: false, status: 400, error: 'Invalid grant code format.' };
  }

  const sessionJti = crypto.randomUUID();
  const sb = getSupabaseServer();
  if (sb) {
    const { data: lookup, error: lookupErr } = await sb
      .from('grants')
      .select('salt, code_hmac, status, expires_at')
      .eq('kid', parsed.kid)
      .maybeSingle();

    if (lookupErr) {
      return { ok: false, status: 503, error: 'Grant store temporarily unavailable. Replay Mode remains open.' };
    }
    if (!lookup || typeof lookup.salt !== 'string' || typeof lookup.code_hmac !== 'string') {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }

    const saltBuf = parsePgBytea(lookup.salt);
    if (saltBuf.length !== 16) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }
    const computedHmac = computeGrantCodeHmac(pepper, saltBuf, parsed.normalized);
    if (!constantTimeHexEquals(computedHmac, lookup.code_hmac)) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }

    const { data: redeemedRows, error: redeemErr } = await sb.rpc('redeem_grant_atomic', {
      p_kid: parsed.kid,
      p_expected_hmac: computedHmac,
      p_session_jti: sessionJti,
      p_session_ttl_hours: sessionTtlHours,
    });

    if (redeemErr || !Array.isArray(redeemedRows) || redeemedRows.length === 0) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }

    const r = redeemedRows[0] as {
      grant_id: string;
      token_budget_weighted: number;
      tokens_used_weighted: number;
      calls_budget: number;
      calls_used: number;
      expires_at: string;
    };
    const expiresAtSec = Math.floor(new Date(r.expires_at).getTime() / 1000);
    return {
      ok: true,
      grantId: r.grant_id,
      sessionJti,
      expiresAtSec,
      summary: {
        grantId: r.grant_id,
        status: 'redeemed',
        tokenBudgetWeighted: r.token_budget_weighted,
        tokensUsedWeighted: r.tokens_used_weighted,
        callsBudget: r.calls_budget,
        callsUsed: r.calls_used,
        expiresAt: r.expires_at,
        circuitOpen: false,
      },
    };
  }

  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const row = st.grantsByKid.get(parsed.kid);
    const now = Date.now();
    if (!row) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }
    const computedHmac = computeGrantCodeHmac(pepper, row.salt, parsed.normalized);
    if (!constantTimeHexEquals(computedHmac, row.codeHmac)) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }
    if (row.status !== 'issued' || row.expiresAtMs <= now) {
      return { ok: false, status: 401, error: 'Grant code invalid, expired, or already redeemed.' };
    }
    row.status = 'redeemed';
    row.sessionJti = sessionJti;
    row.expiresAtMs = Math.min(row.expiresAtMs, now + sessionTtlHours * 3600 * 1000);
    const expiresIso = new Date(row.expiresAtMs).toISOString();
    return {
      ok: true,
      grantId: row.id,
      sessionJti,
      expiresAtSec: Math.floor(row.expiresAtMs / 1000),
      summary: {
        grantId: row.id,
        status: 'redeemed',
        tokenBudgetWeighted: row.tokenBudgetWeighted,
        tokensUsedWeighted: row.tokensUsedWeighted,
        callsBudget: row.callsBudget,
        callsUsed: row.callsUsed,
        expiresAt: expiresIso,
        circuitOpen: false,
      },
    };
  }

  return { ok: false, status: 503, error: 'Grant store unavailable. Replay Mode remains open.' };
}

export async function getGrantStatusBySession(
  grantId: string,
  sessionJti: string
): Promise<GrantRecordSummary | null> {
  const sb = getSupabaseServer();
  if (sb) {
    const [{ data: g }, { data: c }] = await Promise.all([
      sb
        .from('grants')
        .select('id, status, session_jti, token_budget_weighted, tokens_used_weighted, calls_budget, calls_used, expires_at')
        .eq('id', grantId)
        .maybeSingle(),
      sb
        .from('daily_usage_circuit')
        .select('circuit_open')
        .eq('usage_date', new Date().toISOString().slice(0, 10))
        .maybeSingle(),
    ]);
    if (!g || g.session_jti !== sessionJti) return null;
    const expired = new Date(g.expires_at).getTime() <= Date.now();
    return {
      grantId: g.id,
      status: expired ? 'expired' : g.status,
      tokenBudgetWeighted: g.token_budget_weighted,
      tokensUsedWeighted: g.tokens_used_weighted,
      callsBudget: g.calls_budget,
      callsUsed: g.calls_used,
      expiresAt: g.expires_at,
      circuitOpen: Boolean(c?.circuit_open),
    };
  }

  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const row = st.grantsById.get(grantId);
    if (!row || row.sessionJti !== sessionJti) return null;
    const today = st.dailyCircuit.get(new Date().toISOString().slice(0, 10));
    const expired = row.expiresAtMs <= Date.now();
    return {
      grantId: row.id,
      status: expired ? 'expired' : row.status,
      tokenBudgetWeighted: row.tokenBudgetWeighted,
      tokensUsedWeighted: row.tokensUsedWeighted,
      callsBudget: row.callsBudget,
      callsUsed: row.callsUsed,
      expiresAt: new Date(row.expiresAtMs).toISOString(),
      circuitOpen: Boolean(today?.circuitOpen),
    };
  }

  return null;
}

export async function reserveGrantTokensAtomic(
  grantId: string,
  sessionJti: string,
  reserveWeighted: number
): Promise<{
  allowed: boolean;
  reason: string;
  remainingTokens: number;
  remainingCalls: number;
  circuitOpen: boolean;
}> {
  const dailyCap = getDailyWeightedTokenCap();
  const sb = getSupabaseServer();
  if (sb) {
    const { data, error } = await sb.rpc('reserve_grant_tokens', {
      p_grant_id: grantId,
      p_session_jti: sessionJti,
      p_reserve_weighted: reserveWeighted,
      p_daily_cap_weighted: dailyCap,
    });
    if (error || !Array.isArray(data) || data.length === 0) {
      return { allowed: false, reason: 'STORE_UNAVAILABLE', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
    }
    const r = data[0] as {
      allowed: boolean;
      reason: string;
      remaining_tokens: number;
      remaining_calls: number;
      circuit_open: boolean;
    };
    return {
      allowed: Boolean(r.allowed),
      reason: r.reason,
      remainingTokens: r.remaining_tokens,
      remainingCalls: r.remaining_calls,
      circuitOpen: Boolean(r.circuit_open),
    };
  }

  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    if (reserveWeighted <= 0) {
      return { allowed: false, reason: 'INVALID_RESERVATION_AMOUNT', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    let daily = st.dailyCircuit.get(todayKey);
    if (!daily) {
      daily = { emailsSent: 0, emailsCap: getDailyEmailCap(), usedWeighted: 0, capWeighted: dailyCap, circuitOpen: false };
      st.dailyCircuit.set(todayKey, daily);
    }
    if (daily.circuitOpen || daily.usedWeighted + reserveWeighted > daily.capWeighted) {
      daily.circuitOpen = true;
      return { allowed: false, reason: 'GLOBAL_DAILY_CIRCUIT_OPEN', remainingTokens: 0, remainingCalls: 0, circuitOpen: true };
    }

    const row = st.grantsById.get(grantId);
    if (!row) {
      return { allowed: false, reason: 'GRANT_NOT_FOUND', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
    }
    if (row.status !== 'redeemed' || row.sessionJti !== sessionJti) {
      return { allowed: false, reason: 'GRANT_SESSION_INVALID', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
    }
    if (row.expiresAtMs <= Date.now()) {
      row.status = 'expired';
      return { allowed: false, reason: 'GRANT_EXPIRED', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
    }
    if (row.callsUsed + 1 > row.callsBudget) {
      return {
        allowed: false,
        reason: 'GRANT_CALL_BUDGET_EXHAUSTED',
        remainingTokens: Math.max(0, row.tokenBudgetWeighted - row.tokensUsedWeighted),
        remainingCalls: 0,
        circuitOpen: false,
      };
    }
    if (row.tokensUsedWeighted + reserveWeighted > row.tokenBudgetWeighted) {
      return {
        allowed: false,
        reason: 'GRANT_TOKEN_BUDGET_EXHAUSTED',
        remainingTokens: Math.max(0, row.tokenBudgetWeighted - row.tokensUsedWeighted),
        remainingCalls: Math.max(0, row.callsBudget - row.callsUsed),
        circuitOpen: false,
      };
    }

    row.tokensUsedWeighted += reserveWeighted;
    row.callsUsed += 1;
    daily.usedWeighted += reserveWeighted;
    return {
      allowed: true,
      reason: 'OK',
      remainingTokens: row.tokenBudgetWeighted - row.tokensUsedWeighted,
      remainingCalls: row.callsBudget - row.callsUsed,
      circuitOpen: false,
    };
  }

  return { allowed: false, reason: 'STORE_UNAVAILABLE', remainingTokens: 0, remainingCalls: 0, circuitOpen: false };
}

export async function reconcileGrantTokens(grantId: string, refundWeighted: number): Promise<void> {
  if (refundWeighted <= 0) return;
  const sb = getSupabaseServer();
  if (sb) {
    await sb.rpc('reconcile_grant_tokens', {
      p_grant_id: grantId,
      p_refund_weighted: refundWeighted,
    });
    return;
  }
  if (isEphemeralEnabled()) {
    const st = getEphemeralState();
    const row = st.grantsById.get(grantId);
    if (row) {
      row.tokensUsedWeighted = Math.max(0, row.tokensUsedWeighted - refundWeighted);
    }
    const today = st.dailyCircuit.get(new Date().toISOString().slice(0, 10));
    if (today) {
      today.usedWeighted = Math.max(0, today.usedWeighted - refundWeighted);
    }
  }
}
