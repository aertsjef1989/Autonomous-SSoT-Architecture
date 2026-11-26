import crypto from 'crypto';

export const GRANT_COOKIE_NAME = 'balaerion_grant';

const CROCKFORD = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function randomAlphabet(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CROCKFORD[bytes[i] % CROCKFORD.length];
  }
  return out;
}

export function constantTimeHexEquals(aHex: string, bHex: string): boolean {
  if (typeof aHex !== 'string' || typeof bHex !== 'string') return false;
  if (aHex.length !== bHex.length || aHex.length === 0 || aHex.length % 2 !== 0) return false;
  if (!/^[0-9a-f]+$/i.test(aHex) || !/^[0-9a-f]+$/i.test(bHex)) return false;
  const a = Buffer.from(aHex.toLowerCase(), 'hex');
  const b = Buffer.from(bHex.toLowerCase(), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function normalizeGrantCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function parseGrantCode(raw: string): { kid: string; normalized: string } | null {
  if (typeof raw !== 'string') return null;
  const normalized = normalizeGrantCode(raw);
  const m = /^BLR-([A-Z2-9]{8,20})-([A-Z2-9]{16,36})$/.exec(normalized);
  if (!m) return null;
  return { kid: m[1], normalized };
}

export function computeGrantCodeHmac(pepper: string, salt: Buffer, rawCode: string): string {
  if (!pepper || pepper.length < 16) {
    throw new Error('GRANT_CODE_PEPPER must be configured (>= 16 chars).');
  }
  if (!Buffer.isBuffer(salt) || salt.length !== 16) {
    throw new Error('Grant salt must be exactly 16 bytes.');
  }
  const normalized = normalizeGrantCode(rawCode);
  return crypto
    .createHmac('sha256', Buffer.from(pepper, 'utf8'))
    .update(salt)
    .update(Buffer.from(normalized, 'utf8'))
    .digest('hex');
}

export interface MintedGrantMaterial {
  code: string;
  kid: string;
  salt: Buffer;
  saltHex: string;
  codeHmac: string;
}

export function mintGrantCodeMaterial(pepper: string): MintedGrantMaterial {
  const kid = randomAlphabet(10);
  const secret = randomAlphabet(22);
  const code = `BLR-${kid}-${secret}`;
  const salt = crypto.randomBytes(16);
  const codeHmac = computeGrantCodeHmac(pepper, salt, code);
  return {
    code,
    kid,
    salt,
    saltHex: `\\x${salt.toString('hex')}`,
    codeHmac,
  };
}

export interface GrantSessionClaims {
  gid: string;
  jti: string;
  exp: number;
}

export function signGrantSessionCookie(secret: string, claims: GrantSessionClaims): string {
  if (!secret || secret.length < 16) {
    throw new Error('GRANT_SESSION_SECRET must be configured (>= 16 chars).');
  }
  const payloadB64 = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(payloadB64, 'utf8')
    .digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

export function verifyGrantSessionCookie(
  secret: string,
  cookieValue: string | undefined | null,
  nowSec = Math.floor(Date.now() / 1000)
): GrantSessionClaims | null {
  if (!secret || secret.length < 16 || !cookieValue || typeof cookieValue !== 'string') {
    return null;
  }
  const parts = cookieValue.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(payloadB64, 'utf8')
    .digest();
  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }
  if (providedSig.length !== expectedSig.length || !crypto.timingSafeEqual(providedSig, expectedSig)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Partial<GrantSessionClaims>;
    if (
      typeof parsed.gid !== 'string' ||
      typeof parsed.jti !== 'string' ||
      typeof parsed.exp !== 'number' ||
      !Number.isFinite(parsed.exp)
    ) {
      return null;
    }
    if (parsed.exp <= nowSec) return null;
    return { gid: parsed.gid, jti: parsed.jti, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function hashIpForRateLimit(
  ipPepper: string,
  rawIp: string,
  utcDate = new Date().toISOString().slice(0, 10)
): string {
  const key = `${ipPepper}:${utcDate}`;
  const normalizedIp = (rawIp || 'unknown').trim().toLowerCase();
  return crypto.createHmac('sha256', Buffer.from(key, 'utf8')).update(normalizedIp, 'utf8').digest('hex');
}

export function hashEmailForCooldown(emailPepper: string, rawEmail: string): string {
  if (!emailPepper || emailPepper.length < 16) {
    throw new Error('EMAIL_COOLDOWN_PEPPER must be configured (>= 16 chars) when COOLDOWN_MODE=hmac.');
  }
  const canonical = rawEmail.trim().toLowerCase();
  return crypto.createHmac('sha256', Buffer.from(emailPepper, 'utf8')).update(canonical, 'utf8').digest('hex');
}

export interface AltchaChallenge {
  algorithm: 'SHA-256';
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

export function createAltchaChallenge(
  hmacSecret: string,
  opts?: { maxnumber?: number; ttlSeconds?: number; nowSec?: number; fixedNumberForVector?: number; fixedSaltHex?: string }
): AltchaChallenge {
  if (!hmacSecret || hmacSecret.length < 16) {
    throw new Error('ALTCHA_HMAC_SECRET must be configured (>= 16 chars).');
  }
  const maxnumber = opts?.maxnumber ?? 35000;
  const ttlSeconds = opts?.ttlSeconds ?? 300;
  const nowSec = opts?.nowSec ?? Math.floor(Date.now() / 1000);
  const expires = nowSec + ttlSeconds;
  const saltHex = opts?.fixedSaltHex ?? crypto.randomBytes(12).toString('hex');
  const salt = `${saltHex}?expires=${expires}`;
  const secretNumber =
    typeof opts?.fixedNumberForVector === 'number'
      ? opts.fixedNumberForVector
      : crypto.randomInt(0, maxnumber + 1);
  const challenge = crypto.createHash('sha256').update(`${salt}${secretNumber}`, 'utf8').digest('hex');
  const signature = crypto
    .createHmac('sha256', Buffer.from(hmacSecret, 'utf8'))
    .update(challenge, 'utf8')
    .digest('hex');

  return {
    algorithm: 'SHA-256',
    challenge,
    maxnumber,
    salt,
    signature,
  };
}

export interface AltchaVerificationResult {
  ok: boolean;
  reason?: string;
  challengeHash?: string;
  expiresAtIso?: string;
}

export function verifyAltchaSolution(
  hmacSecret: string,
  rawPayload: unknown,
  nowSec = Math.floor(Date.now() / 1000)
): AltchaVerificationResult {
  if (!hmacSecret || hmacSecret.length < 16) {
    return { ok: false, reason: 'ALTCHA_SECRET_UNCONFIGURED' };
  }
  let obj: Record<string, unknown> | null = null;
  if (typeof rawPayload === 'string' && rawPayload.trim().length > 0) {
    const trimmed = rawPayload.trim();
    try {
      obj = JSON.parse(trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8'));
    } catch {
      return { ok: false, reason: 'MALFORMED_ALTCHA_PAYLOAD' };
    }
  } else if (rawPayload && typeof rawPayload === 'object') {
    obj = rawPayload as Record<string, unknown>;
  }
  if (!obj) return { ok: false, reason: 'MISSING_ALTCHA_PAYLOAD' };

  const algorithm = obj.algorithm;
  const challenge = obj.challenge;
  const numberVal = obj.number;
  const salt = obj.salt;
  const signature = obj.signature;

  if (
    algorithm !== 'SHA-256' ||
    typeof challenge !== 'string' ||
    typeof salt !== 'string' ||
    typeof signature !== 'string' ||
    typeof numberVal !== 'number' ||
    !Number.isInteger(numberVal) ||
    numberVal < 0 ||
    numberVal > 5_000_000
  ) {
    return { ok: false, reason: 'INVALID_ALTCHA_FIELDS' };
  }

  const expMatch = /[?&]expires=(\d+)/.exec(salt);
  if (!expMatch) return { ok: false, reason: 'MISSING_ALTCHA_EXPIRY' };
  const expires = Number(expMatch[1]);
  if (!Number.isFinite(expires) || expires <= nowSec) {
    return { ok: false, reason: 'ALTCHA_CHALLENGE_EXPIRED' };
  }

  const expectedSig = crypto
    .createHmac('sha256', Buffer.from(hmacSecret, 'utf8'))
    .update(challenge, 'utf8')
    .digest('hex');
  if (!constantTimeHexEquals(signature, expectedSig)) {
    return { ok: false, reason: 'INVALID_ALTCHA_SIGNATURE' };
  }

  const computedChallenge = crypto.createHash('sha256').update(`${salt}${numberVal}`, 'utf8').digest('hex');
  if (!constantTimeHexEquals(challenge, computedChallenge)) {
    return { ok: false, reason: 'INVALID_ALTCHA_SOLUTION' };
  }

  const challengeHash = crypto.createHash('sha256').update(`${salt}:${challenge}`, 'utf8').digest('hex');
  return {
    ok: true,
    challengeHash,
    expiresAtIso: new Date(expires * 1000).toISOString(),
  };
}
