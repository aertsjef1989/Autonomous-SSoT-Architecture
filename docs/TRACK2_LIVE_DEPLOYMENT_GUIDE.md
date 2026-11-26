# Track 2 Live Deployment & Bulk Drive Sync Runbook

> **Scope:** Unlisted Next.js 14 operational workspace (`balaerion-app/`) backed by EU Supabase (`eu-central-1` or `eu-west-1`), 12 card-free LLM providers, connected Google Drive SSoT ingestion (`GLOBAL`, `NL`, `BE`, `FR`), and live `football-data.org` / `the-odds-api.com` matchday feeds.
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
* **Owner & Grants Security (each >= 16 random chars):** `OWNER_ACCESS_SECRET`, `ALTCHA_HMAC_KEY`, `GRANT_CODE_PEPPER`, `GRANT_SESSION_SECRET`, `IP_RATE_PEPPER`, `EMAIL_COOLDOWN_PEPPER`
* **12-Provider Card-Free LLM Pool (any subset; unset keys stay in `FALLBACK` automatically):**
  * Core 6: `NVIDIA_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`
  * Extended 6: `OVH_AI_ENDPOINTS_KEY` (+ `OVH_ENABLE_LIVE=1`), `CODESTRAL_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_API_TOKEN` (also powers 1024-dim `@cf/baai/bge-m3` embeddings), `COHERE_API_KEY` (also powers 1024-dim `embed-multilingual-v3.0` embeddings), `FIREWORKS_API_KEY`, `TOGETHER_API_KEY`
* **Syndicate Live Matchday Feeds (optional; falls back to simulation when unset):** `FOOTBALL_DATA_API_KEY`, `THE_ODDS_API_KEY`
* **Telegram Owner Alerts (optional):** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_ID`

---

## 3. Bulk Import Connected Google Drive SSoT Corpus (Zero Git Commits)

Once `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `WORKSPACE_SYNC_URL` + `OWNER_ACCESS_SECRET`) are populated in `balaerion-app/.env.local` or shell environment:

1. **Dry-Run Verification (0 writes, 0 titles printed):**
   ```bash
   node scripts/import_connected_gdrive_to_supabase.mjs --folder-id <DRIVE_ROOT_FOLDER_ID> --dry-run
   ```
2. **Live In-Memory Sync to Supabase (`ssot_documents` + `ssot_chunks`):**
   ```bash
   set -a && source balaerion-app/.env.local && set +a
   node scripts/import_connected_gdrive_to_supabase.mjs --folder-id <DRIVE_ROOT_FOLDER_ID>
   ```
   * Streams every Google Doc and Markdown file in RAM (`GLOBAL`, `NL`, `BE`, `FR`), skips Archive folders, chunks Markdown, computes optional 1024-dim free embeddings, and upserts idempotently into Supabase with zero files written to the Git working tree.

---

## 4. Owner Unlimited Live Workflow & Studio/Press Handoff

1. Open `/admin` on your unlisted deployment and enter `OWNER_ACCESS_SECRET`.
   * Header badge switches to **`Mode: Owner Live (Unlimited)`** across `/`, `/ssot`, `/balaerion`, `/syndicate`, and `/press` without needing or consuming single-use reviewer grants.
2. Check the **`CONFIGURED LLM PROVIDERS`** bar on `/` to confirm configured keys show **`LIVE`**.
3. Query your synced files in `/ssot` (`/ask`, `/check`, `/policy`, `/gap`), analyze live fixtures in `/syndicate`, or run standalone / ProspectHub prompts in `/balaerion`, and click **`-> Signal Studio (16:9)`** or **`-> Signal Press (A4)`** on any output to design and export `.docx`, Google Docs `.docx`, A4 Dark/Light PDF, inline Email HTML, or `.json`/`.md` decks.
