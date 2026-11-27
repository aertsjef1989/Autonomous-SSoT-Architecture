# Balaerion III. Security & GDPR Routing Lane

**Focus:** Pre-Dispatch Lane Enforcement, Invite-Only Reviewer Grant Cryptography, Zero-Cookie ePrivacy Posture & GDPR Controls · **Status:** `Prototype` + `Designed`

---

## 1. Two-Lane Routing (`lane: eu` vs. `lane: general`)

Balaerion enforces a deterministic cryptographic and regex boundary between EU-scoped synthesis and general prompting **before** any request leaves the server proxy or reserves grant budget:

| Lane | Permitted Workloads | Admitted Providers | Hard Security Invariant |
| :--- | :--- | :--- | :--- |
| **`lane: eu`** (`safe`, `lane_locked: true`) | ProspectHub account briefs, post-discovery activation plans, meeting deltas, and unclassified prompts (default) | `mistral`, `codestral`, `ovhcloud-eu` (+ conditional `scaleway-paris`) | **Zero cross-lane fallback** to `general` providers; degrades to local Replay if all EU endpoints throttle. |
| **`lane: general`** | Mode A coding, SQL/TypeScript debugging, quantitative Syndicate analysis, and non-PII commercial templates | `nvidia-nim`, `groq`, `cerebras`, `gemini`, `openrouter-free`, `cloudflare-workers-ai`, `cohere`, `fireworks`, `together` | **Hard-blocked (`HTTP 403`)** if pre-dispatch PII gate detects personal/tax/banking identifiers. |

### 1.1 Deterministic Pre-Dispatch Gate (`enforcePreDispatchGate`)

Rather than trusting an LLM to redact sensitive strings after ingestion, `lane-guard.ts` executes synchronous deterministic checks across both the current prompt and conversation history:
1. **Identifier Pattern Rejection:** Blocks EU VAT numbers (`BE0...`, `NL...B01`, `FR...`), IBANs, email addresses, and phone numbers before upstream dispatch (`HTTP 403`, `0` tokens charged).
2. **Provider-to-Lane Binding:** Rejects any payload attempting to pair `lane: eu` with a `general` provider ID (`groq`, `nvidia-nim`, `gemini`, etc.), preventing modified client requests from bypassing UI dropdowns.
3. **Output Schema & Markdown Sanitization:** Responses rendered into Signal Studio or Signal Press pass through deterministic JSON/block validators (`H6` single-pass repair ceiling) with zero raw HTML `dangerouslySetInnerHTML` execution.

---

## 2. Database Isolation, Leak Gate & Hard Refusals

* **Server-Only Database Access:** PostgreSQL runs in an EU region (`eu-central-1` or `eu-west-1`) with `ENABLE ROW LEVEL SECURITY` on every table and **zero public `CREATE POLICY` grants**. Browser clients hold zero database credentials for sensitive tables.
* **Automated Pre- & Post-Build Leak Gate (`scripts/leak_gate.py`):** Scans all tracked Markdown, TypeScript, JSON, SVG, and compiled `_book/` HTML artifacts for internal employer nomenclature, secret prefixes (`nvapi-`, `gsk_`, `sk-or-`), unlisted deployment origins, and typographical regressions.
* **Architectural Hard Refusals:**
  1. Never reuse personal consumer chat subscriptions (`ChatGPT Plus`, `Claude Pro` session cookies) via reverse proxies.
  2. Never log raw prompts, raw IP addresses, raw grant codes, or visitor emails in PostgreSQL tables.
  3. Never auto-mint live LLM access to unverified public traffic.

---

## 3. GDPR & Deterministic Fact Boundary (`[Status: Prototype + Designed]`)

* **Deterministic Fact Boundary:** Legal entity names, registration numbers (`KBO`, `KvK`, `SIREN`), DNS/ESP records, CMS platforms, and advertising pixels originate exclusively from structured OSINT collectors (`src/lib/osint/engine.ts`) or synthetic calibration fixtures. Where a signal cannot be verified deterministically, personas must output `unconfirmable` rather than guessing.
* **PII Scrubbing on OSINT Snippets:** Before any external search snippet (`Tavily`, `Serper`, `FR SIREN`) enters server RAM or a prompt context, `scrubPersonalIdentifiers()` strips personal email and telephone patterns so corporate tech-stack enrichment never ingests personal contact data.
* **Data Minimization & Retention (`GDPR Art. 5(1)(c)` & `Art. 5(1)(e)`):**
  * **Zero Passive Cookies (`ePrivacy Directive Art. 5(3) Criterion B`):** Passive browsing, Replay Mode, and Offline Signal Press set **zero cookies** and load **zero analytics scripts**. The `balaerion_grant` cookie (`HttpOnly; Secure; SameSite=Lax`) is set strictly after an explicit user click redeeming a grant code on `/redeem`.
  * **Automated Hourly Purge (`pg_cron`):** Expired rate-limit counters (`1h` window, keyed by daily-rotating salted IP hash `HMAC-SHA256(pepper || UTC_DATE, ip)`), single-use ALTCHA nonces (`5m` TTL), and expired grants (`+7d` post-expiry) are purged hourly, alongside a daily cleanup of `cron.job_run_details`.
* **Human-in-the-Loop Governance:** AI personas propose briefs, diagnostic questions, and slide/document drafts; every lifecycle transition and external outreach action requires explicit human review and execution.

---

## 4. Abuse Prevention, Invite-Only Approval Queue & Budget Ceilings

Because a public portfolio linked on GitHub and resumes can attract automated scrapers or curious visitors, protecting free-tier LLM and transactional email quotas requires layered defense-in-depth:

```text
Reviewer            Public GitHub Pages          Private Workspace (/redeem)       Owner Telegram / (/admin)
   |--- Browse Docs & Demos (0 Login, 0 Cookies) --->|                                       |
   |--- Request 48h Reviewer Grant (Issue / Form) ------------------------------>|           |
   |                                                 |-- Verify ALTCHA PoW Nonce |           |
   |                                                 |-- Check 3/hr Salted IP    |           |
   |                                                 |-- Alert Owner (0 Auto-Mint!) -------->|
   |                                                 |                                       |-- Unlock /admin
   |<-- Share Private #code=BLR-... Fragment Link (25 Calls / 48h TTL) ----------------------|
   |--- Open /redeem#code=... (JS Scrubs URL Hash) ->|                                       |
   |--- Click Explicit Redeem (Blocks Bot Pre-Burn) ->|-- Set HttpOnly; SameSite=Lax Cookie  |
```

### 4.1 Five Quota-Protection Layers (`[Status: Implemented & Verified]`)
1. **Invite-Only Default + Manual Owner Approval (`GRANT_APPROVAL_MODE=owner_approval`):** Submitting the request form on `/redeem` **never auto-mints** a `BLR-...` grant. After passing self-hosted SHA-256 `ALTCHA` proof-of-work, nonce replay burn, and a `3 requests / hour` daily-rotating salted IP limit, the server sends a private approval alert to `TELEGRAM_OWNER_ID`. Only the owner can mint grants on `/admin`.
2. **Salted HMAC Grant Storage:** Raw `BLR-XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXX` codes are displayed once at mint time and never stored in PostgreSQL; only a public `kid`, `16-byte` random `salt`, and `HMAC-SHA256(pepper, salt || normalized_code)` are persisted.
3. **URL Fragment Delivery & Scanner-Safe Explicit Click:** Share links place the secret inside `#code=BLR-...` (which browsers never transmit in HTTP `GET` request lines or server logs). Client JS scrubs `window.location.hash` via `history.replaceState` on load and waits for an explicit button click so enterprise email/Slack link-preview bots cannot burn single-use codes.
4. **Per-Grant Atomic Ceilings:** Default reviewer grants cap exposure at **`25` live calls**, **`12,000` weighted tokens**, and a **`48-hour` issue TTL** (`24 hours` post-redemption), enforced atomically via `SELECT ... FOR UPDATE`.
5. **Global Daily Circuit Breaker:** Even if multiple approved reviewers test simultaneously, `daily_usage_circuit` enforces a hard daily workspace ceiling across all grants, failing closed to Replay Mode until `00:00 UTC`.
