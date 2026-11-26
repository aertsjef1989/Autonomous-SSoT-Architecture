# Balaerion Unified Workspace (`balaerion-app`)

Unified Next.js 14 application hosting the unlisted interactive portfolio workspace:
- `/` (Hub)
- `/ssot` (SSoT Wiki DMADV & 14-detector Replay console, BI CSV/JSON export)
- `/balaerion` (Balaerion Two-Lane router, interactive PII gate tester, and ProspectHub 7-state synthetic workspace)
- `/syndicate` (Syndicate Poisson/xG probability simulator and Unit-Share NAV ledger prototype, simulation only)
- `/studio` (Signal Studio slide handoff composer and legacy `DECK` JSON adapter)
- `/press` (Signal Press offline-first A4 document designer, wired in P3/P6)
- `/redeem`, `/privacy`, `/admin`

## Deployment & Stealth Rules (Section D, V1 to V6)
1. **Default Wildcard Hostname (`V1`, `D3`):** Deploy on the platform's default wildcard subdomain (no custom domain, preventing Certificate Transparency enumeration). Use a random 16+ character lowercase alphanumeric project name and a neutral team slug (`V2`) containing no personal name, repo name, or `ssot`.
2. **CLI Deploys Only (`V3`, `D5`):** Do not attach the GitHub integration to the public repository (`vercel.json` sets `"git": { "deploymentEnabled": false }`). Deploy from `balaerion-app/` via CLI (`npx vercel deploy --prod`) so zero deployment URLs appear in GitHub Deployments, PR comments, or commit statuses. Never paste the live deployment URL into repository files, commit messages, issues, or `.dev/STATE.md`.
3. **Preview Protection (`V4`, `D4`):** On the Hobby plan, enable **Vercel Authentication -> Standard Protection** and add the single production alias under **Deployment Protection Exceptions** so production stays readable by link while preview URLs require login.
4. **Indexing & Third-Party Isolation (`D6`, `D7`, `D8`):** No sitemap is generated. `public/robots.txt` disallows all crawlers, `layout.tsx` sets `noindex, nofollow, noarchive, nosnippet`, and `next.config.mjs` + `src/middleware.ts` emit `X-Robots-Tag`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, and a strict self-only `Content-Security-Policy` (`connect-src 'self'; font-src 'self' data:`). Keep Vercel Web Analytics and Speed Insights disabled.
5. **Security Boundary (`D9`):** An unlisted URL is obscurity, not access control. Every dataset bundled here is synthetic, and live AI calls fail closed without a redeemed cryptographic grant, atomic weighted-token reservation, and daily global circuit breaker.
