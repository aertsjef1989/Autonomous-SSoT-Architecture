# Balaerion V. ProspectHub OSINT & Deterministic Readiness Engine

**Focus:** Hybrid 8-Collector Card-Free OSINT Architecture, SSRF & PII Scrubbing, 4-Dimension Readiness Scoring & Regional GTM Guardrails (`NL`, `BE`, `FR`) · **Status:** `Implemented` (Private Workspace) + `Prototype` (Public Replay)

---

## 1. Why Deterministic OSINT Precedes Every LLM Call

When commercial teams ask a standalone LLM to "analyze `example-merchant.nl` and write a pitch," two failures occur simultaneously:
1. **Parametric Fabrication:** Without live DNS, HTML `<head>`, and business registry inspection, the model guesses whether the merchant runs Shopify or Lightspeed, guesses whether Consent Mode v2 is active, and invents plausible-sounding registration numbers.
2. **Unbounded Scraper Liability:** Conversely, wiring an unconstrained headless browser or raw search dump directly into an LLM risks Server-Side Request Forgery (`SSRF` against internal `127.0.0.1` / metadata IPs) and ingests personal employee emails/phone numbers into third-party model contexts.

**ProspectHub (`src/lib/osint/engine.ts` + `/api/osint/inspect`)** solves both problems with a **Hybrid Card-Free OSINT Layer** sandwiched between an SSRF input firewall and a regex PII scrubber.

```text
[Operator Enters Domain + Market (e.g., merchant.fr · FR)]
   |
   v
1. SSRF & Hostname Firewall: normalizeSafePublicDomain()
   |-- IP literal / localhost / .internal -------> [HTTP 400 Blocked]
   |-- .example or Unauthenticated Visitor ------> [Deterministic Synthetic Fixture (0 Sockets)]
   |
   v (Owner or Active Reviewer Grant)
2. Parallel Bounded Collectors (<= 4.5s AbortController Timeout)
   |-- Zero-Key: Cloudflare DoH (MX · SPF · DMARC · Klaviyo/HubSpot/Salesforce/Brevo)
   |-- Zero-Key: Safe HTML Head Scan (Shopify/Woo/Lightspeed · GTM/GA4 · Pixels · CMP)
   |-- Zero-Key: FR DINUM Open API (Official SIREN · NAF/APE · Registered City)
   |-- Optional Card-Free Keys: Tavily · Serper · urlscan.io · Exa · CBEAPI (BE KBO)
   |
   v
3. PII Scrubber & Readiness Scorer: scrubPersonalIdentifiers() + 0..10 Rubric
   |
   v
[Structured Corporate Snapshot + Actionable Gaps -> Grounded EU Safe-Lane Persona]
```

---

## 2. The 8 Card-Free OSINT Collectors (`3` Zero-Key + `5` Optional Free-Tier)

ProspectHub separates collectors into **three built-in keyless public endpoints** (which run `LIVE` immediately on deployment with zero external accounts) and **five optional card-free enrichment APIs** (which report `LIVE` when configured in `.env.local` or serverless environment variables and degrade cleanly to `FALLBACK` when omitted):

| Collector ID | Tier | Env Variable | Signals Extracted | Card-Free Quota & Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **`dns-doh`** | **Zero-Key Built-In** | *(None required)* | Mail host (`Google Workspace`, `Microsoft 365`), ESP/CRM (`Klaviyo`, `HubSpot`, `Salesforce`, `Mailchimp`, `SendGrid`, `Brevo`), `DMARC` policy (`p=none/quarantine/reject`), Google/Meta domain verification tokens | Unlimited JSON DoH (`cloudflare-dns.com/dns-query`) |
| **`web-tech-scanner`** | **Zero-Key Built-In** | *(None required)* | Storefront CMS (`Shopify`, `WooCommerce`, `Lightspeed`, `Magento`, `PrestaShop`, `Next.js`), tags (`GTM`, `GA4`, `Meta Pixel`, `Short-Form Video Pixel`, `LinkedIn`, `Pinterest`), EU CMP (`Cookiebot`, `OneTrust`, `Didomi`, `Axeptio`, `Consent Mode v2`) | Direct bounded `GET` (`4.2s` abort, first `140 KB` markup only) |
| **`fr-siren-open`** | **Zero-Key Built-In** | *(None required)* | Official French `SIREN`, legal denomination, `NAF/APE` sector code, and registered municipality | French State DINUM Open API (`7 req/s`, zero key) |
| **`tavily`** | Optional Free Key | `TAVILY_API_KEY` | Recent commercial launches, retail expansion, and category positioning snippets | `1,000` free searches/month (no credit card) |
| **`serper`** | Optional Free Key | `SERPER_API_KEY` | Indexed `site:` storefront footprint and category/catalog breadth | `2,500` free starter queries (no credit card) |
| **`urlscan`** | Optional Free Key | `URLSCAN_API_KEY` | Edge CDN/server header (`Cloudflare`, `Fastly`, `Akamai`) and autonomous system (`ASN`) telemetry | Free community API tier (no credit card) |
| **`exa`** | Optional Free Key | `EXA_API_KEY` | Neural company overview and press/news discovery | Free starter neural search pool (no credit card) |
| **`cbeapi-be`** | Optional Free Key | `CBEAPI_KEY` | Official Belgian Crossroads Bank (`KBO/BCE`) enterprise number and legal form (`BV`/`NV`/`SRL`) | `2,500` free Belgian lookups/day (no credit card) |

---

## 3. Security Boundaries: SSRF Firewall & Corporate-Only Scrubbing

1. **Strict Hostname Normalization (`normalizeSafePublicDomain`):**
   * Strips schemes, paths, query strings, and fragments; rejects ports (`:8080`), userinfo (`@`), whitespace, raw IPv4 literals (`127.0.0.1`, `169.254.169.254`), bracketed IPv6 literals, and internal TLDs (`localhost`, `.local`, `.internal`, `.arpa`).
   * Reserved documentation domains (`.example`, `.test`, `.invalid`) are intercepted before DNS resolution and routed to deterministic calibration fixtures.
2. **Bounded Read & Timeout Isolation:**
   * Every collector executes inside an independent `AbortController` (`3,500 ms` to `4,500 ms`) and caps HTML body reads at `140 KB` so tarpit servers or multi-megabyte media pages cannot exhaust serverless memory.
3. **Corporate-Only PII Scrubber (`scrubPersonalIdentifiers`):**
   * All external text snippets pass through email and international phone redaction regexes in server RAM before returning to the UI or entering any LLM prompt. ProspectHub inspects **corporate infrastructure (`Shopify + Cookiebot + Klaviyo`)**, never personal employee records.

---

## 4. Deterministic 4-Dimension Readiness Rubric (`0.0` to `10.0`)

Rather than letting an LLM invent an arbitrary "lead score," `computeReadinessAndGaps()` calculates a reproducible `0.0` to `10.0` score from four observable technical pillars:

`Readiness = min(9.9, S_commerce + S_tags + S_consent + S_crm)`

| Dimension | Weight Ceiling | Deterministic Scoring Rule |
| :--- | :---: | :--- |
| **1. Commerce Foundation (`S_commerce`)** | `2.6 pts` | `2.6` when structured e-commerce storefront (`Shopify`, `Lightspeed`, `WooCommerce`, `Magento`, `PrestaShop`) is detected; `1.5` for custom/static web stack. |
| **2. Tag & Pixel Maturity (`S_tags`)** | `2.8 pts` | `1.5` for `GTM` / `GA4` container (`0.6` without) + `1.3` when active paid-social pixel (`Meta`, `Short-Form Video`, `LinkedIn`, `Pinterest`) is present (`0.4` without). |
| **3. EU Consent & Privacy Posture (`S_consent`)** | `2.4 pts` | `2.4` when recognized EU CMP or `Consent Mode v2` signal (`Cookiebot`, `OneTrust`, `Didomi`, `Axeptio`, `Complianz`) is present; `0.9` when missing (flagged as urgent compliance blocker). |
| **4. First-Party CRM & Deliverability (`S_crm`)** | `2.2 pts` | `1.4` when dedicated lifecycle ESP/CRM (`Klaviyo`, `HubSpot`, `Salesforce`, `Brevo`, `Mailchimp`) is verified in `SPF`/`TXT` (`0.7` without) + `0.8` when `DMARC` enforces `p=quarantine` or `p=reject` (`0.3` for `p=none`/absent). |

---

## 5. Regional Benelux & France Commercial Rules (`NL`, `BE`, `FR`)

Deterministic gap detection automatically appends market-specific SSoT commercial rules before persona synthesis:
* **Netherlands (`NL`):** Enforces **Dutch province-level geographic scoping** (`Noord-Holland`, `Zuid-Holland`, `Noord-Brabant`, etc.) rather than hyper-local municipal radius rings that starve algorithmic delivery.
* **Belgium (`BE`):** Enforces strict **bilingual campaign and consent separation** between `Vlaanderen (nl-BE)` and `Wallonie (fr-BE)` (plus Brussels bilingual split), preventing mixed-language creative or single-language CMP banners.
* **France (`FR`):** Enforces **CNIL symmetrical consent verification** (refusal must be as simple as acceptance on CMP banners) alongside `SIREN`/`NAF` vertical catalog alignment prior to paid feed activation.
