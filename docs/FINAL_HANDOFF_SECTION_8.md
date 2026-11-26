# Final Engineering Handoff & Deployment Runbook (Section 8 · P0 through P7)

> **Status:** All phases **P0 through P7** (with P8 dropped per Decision `X5`) and the **Addendum SSoT Zero-Commit Pipeline** are implemented, verified end-to-end, and checkpoint-committed.

---

## 1. Architecture & Surface Boundary Summary

1. **Public GitHub Pages (`_book/` -> `gh-pages`):**
   * Sanitized HonKit systems design book (26 chapters, Chapters I to XVI) + Signal Studio (`signal/02_studio/signal-studio.html`) + standalone offline **Signal Press** (`signal/press/index.html`, `70.5 KB` gzipped entry + lazy `docx` chunk).
   * Zero references to Vercel, `/api/`, grants, or AI Assist (`D5`, `D10`). Guarded pre-build and post-build by `scripts/leak_gate.py`.
2. **Unlisted Workspace (`balaerion-app/`, Next.js 14.2.15 on Vercel + Supabase EU):**
   * Readable by URL in **Replay Mode** with zero login and zero cookies (`V11`).
   * **Anti-discovery stealth (`D1`-`D9`):** `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, strict self-only CSP, `/robots.txt` `Disallow: /`, `/sitemap.xml` `404`, and `git.deploymentEnabled: false` in `balaerion-app/vercel.json`.
   * **Live SSoT Corpus (`/ssot`, `/api/ssot`, `/api/admin/sync-drive`):** Zero-commit pipeline (`Google Drive / RAM -> Supabase ssot_documents -> Vercel`), scoped strictly to `NL`, `BE`, `FR`, and `GLOBAL` with automatic `GLOBAL + selected market` inheritance.
   * **Single-Use Live AI Grants (`/redeem`, `/api/grants/*`, `/api/auth/unlock`):** Salted HMAC (`16-byte` CSPRNG salt + `HMAC-SHA256`), `#code=` URL fragment scrubbing, atomic SQL `FOR UPDATE` weighted-token & call reservation, self-hosted ALTCHA, and removable Signal Press AI Assist (`I12`/`I18`/`F5`).

---

## 2. Measured End-to-End Verification Results (`G1` to `G14`)

| Gate | Measured Result | Runner |
| :--- | :--- | :--- |
| **G1 (Two-Way Leak Gate)** | Clean repo = `0` hits; planted forbidden token blocked (`exit=1`) | `scripts/leak_gate.py` |
| **G2 (Pages Stealth Isolation)** | `0` Vercel refs, `0` `/api/` refs, `0` AI-Assist bytes in `_book/` | `scripts/verify_p1_pages.py`, `scripts/verify_p6_assist.mjs` |
| **G3 (Unlisted Anti-Indexing)** | `10/10` routes send `X-Robots-Tag`, `no-referrer`, `DENY`, CSP; `/sitemap.xml` = `404` | `scripts/verify_p2_stealth.py` |
| **G4 (Mobile Viewports 320/375/414px)** | `0` horizontal overflows across 26 chapters, demos, and all Next.js routes; `0` controls `< 44px` | `verify_p1_pages.py`, `verify_p2_stealth.py`, `verify_p3_press.mjs`, `verify_p4_grants.mjs`, `verify_p6_assist.mjs` |
| **G5 (Lighthouse Mobile, Chromium Headless)** | Book Home: **Perf `98`, A11y `93`, Best Practices `100`, SEO `100`** · Offline Signal Press: **Perf `89`, A11y `93`, Best Practices `96`, SEO `100`** | `node scripts/verify_p7_all.mjs --lh-only` |
| **G6 (Zero Third-Party Load Requests)** | `0` external requests on passive load across Pages & Next.js | `verify_p1_pages.py`, `verify_p2_stealth.py` |
| **G7 (Zero Passive Cookies, V11)** | `0` `Set-Cookie` headers on `/`, `/privacy`, `/redeem`, `/press`, `/ssot`, `/api/grants/status` | `scripts/verify_p4_grants.mjs` |
| **G8 (`#code=` Fragment Isolation)** | `0` secret occurrences in network GET URLs; `window.location.hash` scrubbed to `""` | `scripts/verify_p4_grants.mjs` |
| **G9 (50x Concurrent Budget Stress)** | `50` simultaneous `/api/chat` calls against `2000`-token / `5`-call grant -> **`5` allowed (`200`), `45` Replay (`429`), `0` overspend** | `scripts/verify_p4_grants.mjs` |
| **G10 (Pre-Dispatch PII & Cross-Lane Gate)** | VAT, IBAN, email, and `safe -> general` violations blocked (`403`); throttled `eu` lane falls back to Replay with `0` `general` leaks | `scripts/verify_p5_router.mjs` |
| **G11 (Excluded APIs & Pinned Models)** | `7/7` forbidden/unpinned/non-free configs hard-blocked (`1.1`, `H7`); `15/15` synthetic benchmark tasks passed; `H6` JSON repair capped at `1` attempt | `scripts/verify_p5_router.mjs` |
| **G12 (DOCX / LibreOffice / A4 PDF Parity)** | `tpl-one-pager` = `1` page in Dark PDF, Light PDF & LibreOffice DOCX->PDF; `tpl-executive-report` = `2` pages; `0` Word floating textboxes; embedded Carlito; `16/16` WCAG AA pairs `>= 4.5:1` | `scripts/verify_p3_press.mjs` |
| **G13 (Two-Way Pre-Export Lint & I12)** | `6/6` clean templates pass; `17/17` planted defects + `LINT_UNACCEPTED_AI_DRAFT` + `LINT_UNSOURCED_FIGURE` block export; `0` em/en dashes | `verify_p3_press.mjs`, `verify_p6_assist.mjs` |
| **G14 (Strict Offline Network Log)** | Browser `context.set_offline(True)`: editing, lint, dash auto-fix, Markdown & Email HTML downloads = **`0` network requests** | `scripts/verify_p3_press.mjs` |
| **Addendum SSoT Zero-Commit Sync** | Bearer Apps Script push -> `4` upserted (`NL`/`BE`/`FR`/`GLOBAL`), `2` out-of-scope (`DE`/`Archive`) skipped, 2nd push idempotently skipped (`4`), `GLOBAL + market` inheritance verified, `0` `.md` files written to Git | `scripts/verify_ssot_ingestion.mjs` |

---

## 3. End-of-Project Setup & Billing-Off Runbook (5 Steps)

### Step 1: Provision Supabase EU Database (`Manual Check d`)
1. Create a Free Supabase project in an explicit EU member-state AWS region (`eu-central-1` Frankfurt or `eu-west-1` Ireland; do not pick the general "Europe" grouping). Keep card detached (Free projects pause after 7 days of inactivity and never auto-bill).
2. Open **SQL Editor -> New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.
3. If `pg_cron` is not yet enabled, toggle **Database -> Extensions -> `pg_cron`**, then re-run the final `DO $$ ... $$` block of `supabase/schema.sql` so hourly privacy purges and daily `cron.job_run_details` cleanup run automatically.

### Step 2: Populate `balaerion-app/.env.local` & Vercel Environment Variables
Copy `balaerion-app/.env.example` to `balaerion-app/.env.local` (gitignored) and populate the same variable names in your Vercel Project Settings -> Environment Variables:
* Generate four independent 32-byte hex secrets (`openssl rand -hex 32`) for:
  * `OWNER_ACCESS_SECRET`
  * `ALTCHA_HMAC_KEY`
  * `GRANT_CODE_PEPPER`
  * `GRANT_SESSION_SECRET`
  * `IP_RATE_PEPPER`
* Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
* Add whichever card-free LLM keys you choose from `docs/PROVIDER_ADMISSION_TABLE_P5.md` (`OVH_ENABLE_LIVE=1` / `OVH_AI_ENDPOINTS_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_API_TOKEN`, `OPENROUTER_API_KEY`).
* Optional self-serve grant email: add `RESEND_API_KEY` + `GRANT_FROM_EMAIL` (Resend Free hard-stops at 100/UTC day; app SQL caps at `40/UTC day`).

### Step 3: Deploy Unlisted Vercel Project Safely (`Manual Check i`)
1. Create a Vercel **Hobby** project (no credit card attached) with a **random 16+ character project name** and a neutral team slug, setting **Root Directory** to `balaerion-app`.
2. Leave GitHub auto-deployments off (`balaerion-app/vercel.json` sets `git.deploymentEnabled: false`) and deploy via CLI (`npx vercel --prod` inside `balaerion-app/`) so GitHub commit statuses never publish your unlisted URL.
3. In Vercel **Settings -> Deployment Protection**, enable **Vercel Authentication** for **Preview** deployments only (leaving your unlisted Production URL open for Replay visitors without a Vercel account).

### Step 4: Sync Google Drive SSoT Docs Without Google Cloud Console (`Zero-GCP`)
Choose either zero-GCP path:
* **Path A (Automated Google Apps Script Push):**
  1. Open `https://script.google.com` -> **New Project** -> paste `docs/google-apps-script-sync.gs`.
  2. In **Project Settings -> Script Properties**, set:
     * `VERCEL_SYNC_URL` = `https://<your-unlisted-domain>/api/admin/sync-drive`
     * `OWNER_ACCESS_SECRET` = `<your OWNER_ACCESS_SECRET>`
     * `SSOT_ROOT_FOLDER_ID` = `<your SSoT Files Drive Folder ID>`
     * `MASTER_SPEC_FOLDER_ID` = `<your Master Spec Drive Folder ID>`
  3. Click **Run** on `syncDriveSsotToVercel()`. All `NL`, `BE`, `FR`, and `GLOBAL` Google Docs export natively as `text/markdown` in memory and upsert into Supabase `ssot_documents`.
* **Path B (Browser Memory Upload in `/admin`):**
  1. Open `/admin` on your unlisted workspace, unlock with `OWNER_ACCESS_SECRET`, and click **Upload Markdown Files (RAM -> Supabase)**.

### Step 5: Mint Reviewer Grants & Final Manual Device Checks (`a` - `g`)
* Open `/admin` -> **Mint Single-Use Reviewer Grant** -> share the `#code=BLR-...` fragment link by hand with reviewers.
* Complete remaining human-only checks: `(a)` iPhone Safari & Android Chrome real-device check, `(b)` employer-derived content sign-off, `(c)` confirm `$0` spend caps on GitHub Actions/Codespaces (`Settings -> Billing`), and `(f)`/`(g)` visual spot-check of a generated `.docx` in Google Docs / target wiki.

---

## 4. Reference Index of Supporting Deliverables
* **F1 Data Inventory & V7-V11 Sources:** `docs/PRIVACY_DATA_INVENTORY_F1.md` and `/privacy`
* **X7 Free-Provider Admission Matrix (V12-V15):** `docs/PROVIDER_ADMISSION_TABLE_P5.md`
* **One-Page Private-Production Design Note (V17):** `docs/PRIVATE_PRODUCTION_DESIGN_NOTE.md`
* **A1-M1 & V1-V20 Traceability Matrix:** `docs/TRACEABILITY_MATRIX_A1_M1.md`
* **Zero-GCP Drive Sync Apps Script:** `docs/google-apps-script-sync.gs`
