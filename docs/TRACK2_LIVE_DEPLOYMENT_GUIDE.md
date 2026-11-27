# Track 2 Live Deployment, OSINT Keys & Bulk Drive Sync Runbook

> **Scope:** Unlisted Next.js 14 operational workspace (`balaerion-app/`) backed by EU Supabase (`eu-central-1` or `eu-west-1`), 12 card-free LLM providers, Hybrid 8-Collector OSINT layer, connected Google Drive SSoT ingestion (`GLOBAL`, `NL`, `BE`, `FR`), and live `football-data.org` / `the-odds-api.com` matchday feeds.
> **Hard Constraint:** Never commit `.env.local`, secret keys, Drive document contents, or the unlisted Vercel URL to Git.

---

## 1. Initialize Supabase EU Schema (`supabase/schema.sql`)

1. Open your EU Supabase project (`eu-central-1` Frankfurt or `eu-west-1` Ireland).
2. Navigate to **SQL Editor -> New Query**.
3. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   * Creates `ssot_documents` (with `tsvector` GIN index and zero-anon RLS), `ssot_chunks` (with `tsvector` + 1024-dim `pgvector` HNSW index + `search_ssot_hybrid()` RPC), `grants`, `rate_limit_counters`, `daily_usage_circuit`, `syndicate_fixtures`, and `syndicate_pool_ledger`.

---

## 2. Configure Environment Variables (Vercel & Local `.env.local`)

In Vercel, set **Root Directory** to `balaerion-app` and add the variables from `balaerion-app/.env.example` under **Project Settings -> Environment Variables** (select `Production`, `Preview`, and `Development`):

* **Supabase EU:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
* **Owner & Invite-Only Approval Security (each >= 16 random chars):** `OWNER_ACCESS_SECRET`, `ALTCHA_HMAC_KEY`, `GRANT_CODE_PEPPER`, `GRANT_SESSION_SECRET`, `IP_RATE_PEPPER`, `EMAIL_COOLDOWN_PEPPER`, and `GRANT_APPROVAL_MODE=owner_approval` (default: visitors cannot auto-mint grants; requests ping your Telegram so only you mint `BLR-...` grants on `/admin`).
* **Telegram Owner Approval Channel & Optional Approved Grant Mailer:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_ID`, plus optional `RESEND_API_KEY` + `GRANT_FROM_EMAIL` for 1-click approved grant email dispatch from `/admin`.
* **12-Provider Card-Free LLM Pool (any subset; unset keys stay in `FALLBACK` automatically):**
  * Core 6: `NVIDIA_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`
  * Extended 6: `OVH_AI_ENDPOINTS_KEY` (+ `OVH_ENABLE_LIVE=1`), `CODESTRAL_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_API_TOKEN` (also powers 1024-dim `@cf/baai/bge-m3` embeddings), `COHERE_API_KEY` (also powers 1024-dim `embed-multilingual-v3.0` embeddings), `FIREWORKS_API_KEY`, `TOGETHER_API_KEY`
* **Hybrid Card-Free OSINT Enrichment Layer (`ProspectHub`):**
  * **3 Zero-Key Collectors Active Immediately (`0` keys required):**
    1. Cloudflare DNS-over-HTTPS (`MX`, `SPF`, `DMARC`, Klaviyo/HubSpot/Salesforce/Brevo detection)
    2. SSRF-Guarded HTML `<head>` Scanner (Shopify/Woo/Lightspeed, GTM/GA4, Social & Video Commerce Pixels, Cookiebot/OneTrust/Didomi/Axeptio CMP)
    3. French Official Business Registry (`recherche-entreprises.api.gouv.fr` -> SIREN, NAF/APE, city)
  * **5 Optional Card-Free OSINT Keys (No credit card required; `FALLBACK` when unset):**
    4. `TAVILY_API_KEY` (`https://app.tavily.com` -> 1,000 free AI/OSINT web searches/month)
    5. `SERPER_API_KEY` (`https://serper.dev` -> 2,500 free Google SERP queries)
    6. `URLSCAN_API_KEY` (`https://urlscan.io/user/signup` -> free DOM/CDN/tracker intelligence)
    7. `EXA_API_KEY` (`https://dashboard.exa.ai` -> free neural company discovery credits)
    8. `CBEAPI_KEY` (`https://cbeapi.be` -> 2,500 free Belgian KBO/BCE lookups/day)
* **Syndicate Live Matchday Feeds (optional; falls back to simulation when unset):**
  * `FOOTBALL_DATA_API_KEY` (`https://www.football-data.org/client/register` -> free UCL standings & matchday feed)
  * `THE_ODDS_API_KEY` (`https://the-odds-api.com` -> 500 free monthly market odds requests)

---

## 3. Bulk Stage & Import Connected Google Drive SSoT Corpus (Zero Public Git Leaks)

All `265` unique active SSoT playbooks (`01_Campaigns` through `08_Onboarding` across `GLOBAL: 55`, `NL: 70`, `BE: 70`, `FR: 70`, automatically excluding `*_DELETE_*` and `Archive` entries, deduplicating duplicate Drive uploads, and preserving full platform/ad-product terminology inside private storage) are staged locally under git-ignored `.dev/ssot-corpus/`:

1. **Stage All Active Google Docs Locally (`.dev/ssot-corpus/markdown/` + `ssot_corpus_bundle.json`):**
   ```bash
   node scripts/import_connected_gdrive_to_supabase.mjs --folder-id <DRIVE_ROOT_FOLDER_ID> --stage-local
   ```
   * Local `next dev` (or `LOAD_LOCAL_SSOT_BUNDLE=1`) automatically hydrates `/ssot` and `/balaerion` (`ProspectHub`) from `.dev/ssot-corpus/ssot_corpus_bundle.json` even before Supabase is wired.
2. **Push Pre-Staged Bundle Straight to Supabase EU (CLI, ~5s):**
   ```bash
   set -a && source balaerion-app/.env.local && set +a
   node scripts/import_connected_gdrive_to_supabase.mjs --from-bundle .dev/ssot-corpus/ssot_corpus_bundle.json
   ```
3. **Or 1-Click Browser Upload on `/admin` (Zero CLI Required):**
   * Unlock `/admin` -> **Section 2** -> click **Upload Corpus Bundle (.json) or Markdown (.md)** and select `.dev/ssot-corpus/ssot_corpus_bundle.json`. The UI automatically chunks all `265` documents into `20`-doc batches (`14` batches total) so serverless payload limits are never exceeded.

---

## 4. Owner Unlimited Live Workflow & Studio/Press Handoff

1. Open `/admin` on your unlisted deployment and enter `OWNER_ACCESS_SECRET`.
   * Header badge switches to **`Mode: Owner Live (Unlimited)`** across `/`, `/ssot`, `/balaerion`, `/syndicate`, and `/press` without needing or consuming single-use reviewer grants.
2. Check the **`CONFIGURED LLM PROVIDERS`** and **`HYBRID OSINT ENRICHMENT LAYER`** strips on `/` to confirm configured keys show **`LIVE`**.
3. Query your synced files in `/ssot` (`/ask`, `/check`, `/policy`, `/gap`), run live OSINT + 16 grounded personas in `/balaerion`, or run Dixon-Coles / Shin De-Vigging / Monte Carlo analysis in `/syndicate`, and click **`-> Signal Studio (16:9)`** or **`-> Signal Press (A4)`** on any output to design and export `.docx`, Google Docs `.docx`, A4 Dark/Light PDF, inline Email HTML, or `.json`/`.md` decks.
