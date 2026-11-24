# Balaerion Unified Vercel App (balaerion-app)

Unified Next.js 14 application hosting the unlisted interactive portfolio workspace:
- / (Hub)
- /ssot (SSoT Wiki, BI CSV/JSON export, floating Balaerion chat)
- /balaerion (Balaerion and ProspectHub workspace)
- /syndicate (Syndicate simulation and NAV ledger prototype, BI CSV export, floating chat)
- /studio (Signal Studio slide editor wrapper)
- /press (Signal Press document designer)
- /privacy, /redeem, /admin

## Stealth & Security
- src/middleware.ts sets X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, Referrer-Policy: no-referrer, and baseline security headers.
- public/robots.txt blocks crawlers.
- An unlisted URL is obscurity, not access control; live AI endpoints are gated by Tier 2 grants and Tier 3 owner auth.
