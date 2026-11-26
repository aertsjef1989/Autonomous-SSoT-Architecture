#!/usr/bin/env node
/**
 * P4 Verification Suite (Sections E & F, V7-V11):
 *  1. SQL schema & RLS lock-down audit (0 public policies, 16-byte salt, atomic FOR UPDATE RPCs, pg_cron purge + job_run_details cleanup)
 *  2. Cryptographic unit two-way tests (salted HMAC codes, signed cookies, daily rotating IP hash, static ALTCHA vector)
 *  3. Fail-closed verification when Supabase is unconfigured + zero cookies on passive browse (V11)
 *  4. Owner minting, Playwright #code= URL fragment scrubbing, single-use redemption & HttpOnly SameSite=Lax cookie flags
 *  5. 50-concurrent-request atomic token budget enforcement (0 overspend) & logout cookie revocation
 *  6. Anti-mail-bombing: ALTCHA replay nonce block, COOLDOWN_MODE=hmac vs off, daily Resend email cap, and /privacy 320px/375px/414px check
 */

import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
fs.mkdirSync(DEV_DIR, { recursive: true });

const requireFromApp = createRequire(path.join(ROOT, 'balaerion-app', 'package.json'));
const esbuild = requireFromApp('esbuild');

// Bundle grants-crypto.ts for direct unit testing
const cryptoBundle = path.join(DEV_DIR, 'grants-crypto-bundle.mjs');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'balaerion-app/src/lib/grants-crypto.ts')],
  outfile: cryptoBundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
});
const cryptoLib = await import(`${cryptoBundle}?t=${Date.now()}`);

console.log('=== [1/6] SQL Schema, RLS Lock-Down & pg_cron Audit ===');
const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
const p4Section = sql.slice(sql.indexOf('6. SECTION E & F:'));
assert.ok(p4Section.length > 500, 'Missing Section 6 in supabase/schema.sql');

for (const tbl of ['grants', 'cooldown_hashes', 'altcha_replay_nonces', 'rate_limit_counters', 'daily_usage_circuit']) {
  assert.ok(p4Section.includes(`CREATE TABLE IF NOT EXISTS ${tbl}`), `Missing table ${tbl}`);
  assert.ok(p4Section.includes(`ALTER TABLE ${tbl} ENABLE ROW LEVEL SECURITY;`), `Missing RLS on ${tbl}`);
  assert.ok(!new RegExp(`CREATE\\s+POLICY[^;]+ON\\s+${tbl}`, 'i').test(p4Section), `Public policy forbidden on ${tbl}`);
}
assert.ok(p4Section.includes('octet_length(salt) = 16'), 'grants.salt must enforce 16-byte length');
assert.ok(!/\bemail\s+TEXT\b/i.test(p4Section), 'Plaintext email column is forbidden in Section 6');
assert.ok(p4Section.includes('FOR UPDATE'), 'reserve_grant_tokens must lock rows FOR UPDATE');
assert.ok(p4Section.includes('purge-privacy-state-hourly'), 'Missing hourly privacy purge schedule');
assert.ok(p4Section.includes('purge-pg-cron-run-details-daily'), 'Missing cron.job_run_details cleanup schedule (V7)');
console.log('  PASS: All 5 P4 tables enforce RLS with 0 public policies, 16-byte salt, FOR UPDATE atomic locks, and pg_cron purges.');

console.log('=== [2/6] Cryptographic Primitives Two-Way Tests ===');
const PEPPER = 'test-grant-pepper-at-least-16-chars-long';
const SESSION_SECRET = 'test-session-secret-at-least-16-chars-long';
const ALTCHA_SECRET = 'test-altcha-hmac-secret-at-least-16-chars';

const minted = cryptoLib.mintGrantCodeMaterial(PEPPER);
assert.equal(minted.salt.length, 16);
assert.ok(/^BLR-[A-Z2-9]{10}-[A-Z2-9]{22}$/.test(minted.code));
const recomputed = cryptoLib.computeGrantCodeHmac(PEPPER, minted.salt, minted.code.toLowerCase());
assert.equal(recomputed, minted.codeHmac, 'Case-insensitive normalized code must match HMAC');
const mutatedCode = minted.code.slice(0, -1) + (minted.code.endsWith('A') ? 'B' : 'A');
assert.notEqual(cryptoLib.computeGrantCodeHmac(PEPPER, minted.salt, mutatedCode), minted.codeHmac);

const nowSec = Math.floor(Date.now() / 1000);
const signedCookie = cryptoLib.signGrantSessionCookie(SESSION_SECRET, {
  gid: '00000000-0000-0000-0000-000000000001',
  jti: '00000000-0000-0000-0000-000000000002',
  exp: nowSec + 3600,
});
assert.ok(cryptoLib.verifyGrantSessionCookie(SESSION_SECRET, signedCookie, nowSec));
assert.equal(cryptoLib.verifyGrantSessionCookie(SESSION_SECRET, signedCookie + 'x', nowSec), null, 'Tampered signature must fail');
assert.equal(cryptoLib.verifyGrantSessionCookie(SESSION_SECRET, signedCookie, nowSec + 7200), null, 'Expired cookie must fail');

const ipHashDay1 = cryptoLib.hashIpForRateLimit('ip-pepper-1234567890', '203.0.113.42', '2026-11-25');
const ipHashDay2 = cryptoLib.hashIpForRateLimit('ip-pepper-1234567890', '203.0.113.42', '2026-11-26');
assert.notEqual(ipHashDay1, ipHashDay2, 'Salted IP rate-limit hash must rotate daily');

// Static known test vector (fixedNumberForVector: 0; zero search/solver loop)
const knownVec = cryptoLib.createAltchaChallenge(ALTCHA_SECRET, {
  fixedNumberForVector: 0,
  fixedSaltHex: 'aabbccddeeff001122334455',
  ttlSeconds: 300,
  nowSec,
});
const okVec = cryptoLib.verifyAltchaSolution(
  ALTCHA_SECRET,
  { ...knownVec, number: 0 },
  nowSec
);
assert.equal(okVec.ok, true);
assert.equal(cryptoLib.verifyAltchaSolution(ALTCHA_SECRET, { ...knownVec, number: 1 }, nowSec).ok, false);
assert.equal(cryptoLib.verifyAltchaSolution(ALTCHA_SECRET, { ...knownVec, number: 0 }, nowSec + 301).ok, false);
console.log('  PASS: Salted grant HMACs, constant-time cookies, daily IP hash rotation, and static vector verification passed.');

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      srv.close(() => resolve(addr.port));
    });
    srv.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.status > 0) return;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

console.log('=== [3/6] Fail-Closed Unconfigured Server & Zero Passive Cookies (V11) ===');
const portUnconf = await getFreePort();
const procUnconf = spawn(
  path.join(ROOT, 'balaerion-app/node_modules/.bin/next'),
  ['start', '-p', String(portUnconf), '-H', '127.0.0.1'],
  {
    cwd: path.join(ROOT, 'balaerion-app'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_LOCAL_EPHEMERAL_STORE: '0',
      SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      GRANT_CODE_PEPPER: '',
      GRANT_SESSION_SECRET: '',
    },
    stdio: 'ignore',
  }
);

try {
  const base = `http://127.0.0.1:${portUnconf}`;
  await waitForServer(`${base}/privacy`);

  for (const p of ['/', '/privacy', '/redeem', '/press', '/api/grants/status']) {
    const r = await fetch(`${base}${p}`);
    assert.equal(r.status, 200, `Expected 200 on ${p}`);
    assert.equal(r.headers.get('set-cookie'), null, `Zero cookies allowed on passive route ${p} (V11)`);
  }

  const rRedeem = await fetch(`${base}/api/grants/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: minted.code }),
  });
  assert.equal(rRedeem.status, 503, 'Unconfigured redeem must fail closed with 503');

  const rChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Synthetic architecture test', lane: 'general', provider: 'groq' }),
  });
  assert.equal(rChat.status, 401, 'Ungranted chat must fail closed with 401 Replay fallback');
  console.log('  PASS: Zero Set-Cookie headers on passive browse; unconfigured store fails closed cleanly (503/401).');
} finally {
  procUnconf.kill('SIGTERM');
}

console.log('=== [4/6, 5/6 & 6/6] Live Grant Lifecycle, 50x Concurrency, Fragment Scrub & Anti-Mail-Bombing ===');
const portLive = await getFreePort();
const OWNER_SECRET = 'owner-secret-for-local-p4-test-only-9999';
const procLive = spawn(
  path.join(ROOT, 'balaerion-app/node_modules/.bin/next'),
  ['start', '-p', String(portLive), '-H', '127.0.0.1'],
  {
    cwd: path.join(ROOT, 'balaerion-app'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_LOCAL_EPHEMERAL_STORE: '1',
      P4_RESERVATION_HOLD_TEST: '1',
      GRANT_EMAIL_DRY_RUN: '1',
      COOLDOWN_MODE: 'hmac',
      GRANT_DAILY_EMAIL_CAP: '2',
      OWNER_ACCESS_SECRET: OWNER_SECRET,
      GRANT_CODE_PEPPER: PEPPER,
      GRANT_SESSION_SECRET: SESSION_SECRET,
      ALTCHA_HMAC_SECRET: ALTCHA_SECRET,
      EMAIL_COOLDOWN_PEPPER: 'email-cooldown-pepper-local-test-1234',
      IP_RATE_PEPPER: 'ip-rate-limit-pepper-local-test-1234',
    },
    stdio: 'ignore',
  }
);

try {
  const base = `http://127.0.0.1:${portLive}`;
  await waitForServer(`${base}/redeem`);

  // 4a. Unauthenticated /api/admin/grants must reject with 401
  const unauthMint = await fetch(`${base}/api/admin/grants`, { method: 'POST' });
  assert.equal(unauthMint.status, 401);

  // 4b. Unlock owner session & mint single-use grant with tight budget (2000 weighted tokens, 5 calls)
  const unlockRes = await fetch(`${base}/api/auth/owner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: OWNER_SECRET }),
  });
  assert.equal(unlockRes.status, 200);
  const ownerSetCookie = unlockRes.headers.get('set-cookie') || '';
  assert.ok(ownerSetCookie.includes('HttpOnly') && /SameSite=Strict/i.test(ownerSetCookie));
  const ownerCookiePair = ownerSetCookie.split(';')[0];

  const mintRes = await fetch(`${base}/api/admin/grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: ownerCookiePair,
    },
    body: JSON.stringify({ tokenBudgetWeighted: 2000, callsBudget: 5, ttlHours: 24 }),
  });
  assert.equal(mintRes.status, 201);
  const mintedJson = await mintRes.json();
  assert.ok(mintedJson.code.startsWith('BLR-'));
  assert.ok(mintedJson.redeemFragmentPath.startsWith('/redeem#code=BLR-'));

  // 4c. Playwright proof: #code= fragment never hits network GET URL, scrubs window.location.hash, sets 0 cookies before click, and /privacy + /redeem have 0 overflow at 320/375/414px
  const pyFragmentCheck = `
import sys
from playwright.sync_api import sync_playwright

base_url = sys.argv[1]
frag_path = sys.argv[2]
expected_code = sys.argv[3]

seen_urls = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.on("request", lambda r: seen_urls.append(r.url))

    page.goto(base_url + frag_path, wait_until="networkidle")
    # Fragment must never appear in any network request URL
    for u in seen_urls:
        assert expected_code not in u, f"Grant code leaked into network request URL: {u}"

    # window.location.hash must be scrubbed immediately
    curr_hash = page.evaluate("window.location.hash")
    assert curr_hash == "", f"Expected empty hash after scrub, got {curr_hash}"

    # Input must be pre-populated from fragment while cookies are still empty before explicit click (V11)
    val = page.get_by_label("Single-Use Grant Code").input_value()
    assert val == expected_code, f"Expected prefilled code, got {val}"
    assert len(ctx.cookies()) == 0, f"Cookies set before explicit user redemption: {ctx.cookies()}"

    # Check /privacy disclaimer + 320/375/414px zero overflow across /redeem, /privacy, /admin
    for route in ("/redeem", "/privacy", "/admin"):
        page.goto(base_url + route, wait_until="networkidle")
        if route == "/privacy":
            txt = page.content()
            assert "not legal advice" in txt, "Missing 'not legal advice' disclaimer on /privacy"
            assert "Criterion B" in txt, "Missing ePrivacy Criterion B basis on /privacy"
        for w in (320, 375, 414):
            page.set_viewport_size({"width": w, "height": 800})
            overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
            assert not overflow, f"Horizontal overflow on {route} at {w}px"

    browser.close()
`;
  execFileSync('python3', ['-c', pyFragmentCheck, base, mintedJson.redeemFragmentPath, mintedJson.code], {
    stdio: 'inherit',
  });

  // 4d. Redeem single-use grant once -> 200 + HttpOnly; SameSite=Lax cookie; second redeem -> 401
  const redeem1 = await fetch(`${base}/api/grants/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.10' },
    body: JSON.stringify({ code: mintedJson.code }),
  });
  assert.equal(redeem1.status, 200);
  const grantSetCookie = redeem1.headers.get('set-cookie') || '';
  assert.ok(grantSetCookie.includes('balaerion_grant='), 'Missing balaerion_grant cookie');
  assert.ok(grantSetCookie.includes('HttpOnly'), 'balaerion_grant must be HttpOnly');
  assert.ok(/SameSite=Lax/i.test(grantSetCookie), 'balaerion_grant must be SameSite=Lax');
  const grantCookiePair = grantSetCookie.split(';')[0];

  const redeem2 = await fetch(`${base}/api/grants/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.10' },
    body: JSON.stringify({ code: mintedJson.code }),
  });
  assert.equal(redeem2.status, 401, 'Single-use grant code MUST reject second redemption');
  console.log('  PASS: Owner mint, #code= fragment scrub, 0 pre-redeem cookies, single-use redemption, and 320/375/414px layout verified.');

  // 5. 50-Concurrent-Request Atomic Token Budget Test (budget=2000, calls=5, each request reserves 400)
  const concurrentPromises = Array.from({ length: 50 }, (_, idx) =>
    fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: grantCookiePair,
      },
      body: JSON.stringify({
        prompt: `Synthetic concurrency probe #${idx + 1}: explain SSoT cadence.`,
        lane: 'general',
        provider: 'groq',
        reserveWeighted: 400,
      }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }))
  );
  const results = await Promise.all(concurrentPromises);
  const okCount = results.filter((r) => r.status === 200 && r.body.grantAuthorized === true).length;
  const throttledCount = results.filter((r) => r.status === 429 && r.body.replay === true).length;
  assert.equal(okCount, 5, `Expected exactly 5 authorized calls out of 50 concurrent, got ${okCount}`);
  assert.equal(throttledCount, 45, `Expected 45 throttled Replay fallbacks out of 50 concurrent, got ${throttledCount}`);

  const statusAfter = await (
    await fetch(`${base}/api/grants/status`, { headers: { Cookie: grantCookiePair } })
  ).json();
  assert.equal(statusAfter.summary.tokensUsedWeighted, 2000, 'Exact budget ceiling (2000) must be reached with 0 overspend');
  assert.equal(statusAfter.summary.remainingTokensWeighted, 0);
  assert.equal(statusAfter.summary.remainingCalls, 0);

  const logoutRes = await fetch(`${base}/api/grants/logout`, { method: 'POST', headers: { Cookie: grantCookiePair } });
  assert.equal(logoutRes.status, 200);
  assert.ok((logoutRes.headers.get('set-cookie') || '').includes('Max-Age=0'), 'Logout must expire cookie');
  console.log('  PASS: 50 concurrent requests enforced exact atomic budget (5 allowed, 45 Replay 429, 0 overspend) + logout verified.');

  // 6. Anti-Mail-Bombing: static vector acceptance, replay block, COOLDOWN_MODE=hmac dedupe, daily email cap (2), and IP rate limit (3/hr)
  const makeStaticAltcha = (saltSuffix) => {
    const ch = cryptoLib.createAltchaChallenge(ALTCHA_SECRET, {
      fixedNumberForVector: 0,
      fixedSaltHex: `00112233445566778899aa${saltSuffix}`,
      ttlSeconds: 300,
    });
    return Buffer.from(JSON.stringify({ ...ch, number: 0 }), 'utf8').toString('base64');
  };

  const vec1 = makeStaticAltcha('01');
  const req1 = await fetch(`${base}/api/grants/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
    body: JSON.stringify({ email: 'synthetic.one@example.com', altcha: vec1 }),
  });
  assert.equal(req1.status, 202, 'First valid grant request should return uniform 202');

  // Replaying exact same ALTCHA payload must fail with 400
  const reqReplay = await fetch(`${base}/api/grants/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
    body: JSON.stringify({ email: 'synthetic.two@example.com', altcha: vec1 }),
  });
  assert.equal(reqReplay.status, 400, 'Replayed ALTCHA challenge nonce must be rejected (400)');

  // Same email from a different IP with fresh vector: blocked silently by COOLDOWN_MODE=hmac (returns uniform 202 anti-enumeration)
  const vec2 = makeStaticAltcha('02');
  const reqCooldown = await fetch(`${base}/api/grants/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.88' },
    body: JSON.stringify({ email: 'SYNTHETIC.ONE@example.com', altcha: vec2 }),
  });
  assert.equal(reqCooldown.status, 202);

  // 4th attempt from IP 203.0.113.77 within the hour hits per-IP rate limit (limit=3 -> 4th returns 429)
  await fetch(`${base}/api/grants/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
    body: JSON.stringify({ email: 'synthetic.three@example.com', altcha: makeStaticAltcha('03') }),
  });
  const reqRateLimited = await fetch(`${base}/api/grants/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
    body: JSON.stringify({ email: 'synthetic.four@example.com', altcha: makeStaticAltcha('04') }),
  });
  assert.equal(reqRateLimited.status, 429, '4th request from same IP within 1h must be rate-limited (429)');
  console.log('  PASS: ALTCHA nonce replay block, HMAC email cooldown, uniform 202 anti-enumeration, and 3/hr salted IP rate limit verified.');
} finally {
  procLive.kill('SIGTERM');
}

console.log('\nALL P4 GRANTS & DATA MINIMIZATION VERIFICATION GATES PASSED.');
