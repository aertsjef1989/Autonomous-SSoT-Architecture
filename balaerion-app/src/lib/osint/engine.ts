export interface OsintCollectorMeta {
  id: string;
  shortName: string;
  displayName: string;
  requiresKey: boolean;
  envVar: string;
  freeTierSummary: string;
  signupUrl: string;
}

export interface OsintCollectorStatus extends OsintCollectorMeta {
  status: 'LIVE' | 'FALLBACK';
}

export const OSINT_COLLECTOR_REGISTRY: readonly OsintCollectorMeta[] = [
  {
    id: 'dns-doh',
    shortName: 'DNS / SPF / DMARC',
    displayName: 'Cloudflare DNS-over-HTTPS Stack Inspector',
    requiresKey: false,
    envVar: '(Zero Key · Public DoH)',
    freeTierSummary: 'Unlimited public DNS JSON queries (MX, SPF, DMARC, CRM/ESP tokens)',
    signupUrl: 'https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/',
  },
  {
    id: 'web-tech-scanner',
    shortName: 'HTML CMS & Pixel',
    displayName: 'Safe Head & Tag Tech-Stack Fingerprinter',
    requiresKey: false,
    envVar: '(Zero Key · SSRF-Guarded)',
    freeTierSummary: 'Detects Shopify/Woo/Lightspeed, GTM/GA4, Social/Video Pixels & EU CMPs',
    signupUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
  },
  {
    id: 'fr-siren-open',
    shortName: 'FR SIREN Open API',
    displayName: 'French Official Business Registry (DINUM)',
    requiresKey: false,
    envVar: '(Zero Key · Open Gov API)',
    freeTierSummary: 'Free official SIREN/SIRET, NAF/APE & workforce bracket (7 req/s)',
    signupUrl: 'https://recherche-entreprises.api.gouv.fr/docs/',
  },
  {
    id: 'tavily',
    shortName: 'Tavily OSINT',
    displayName: 'Tavily AI Company & News Search',
    requiresKey: true,
    envVar: 'TAVILY_API_KEY',
    freeTierSummary: '1,000 free searches/month, no credit card required',
    signupUrl: 'https://app.tavily.com',
  },
  {
    id: 'serper',
    shortName: 'Serper SERP',
    displayName: 'Serper.dev Google Search Enrichment',
    requiresKey: true,
    envVar: 'SERPER_API_KEY',
    freeTierSummary: '2,500 free queries on signup, no credit card required',
    signupUrl: 'https://serper.dev',
  },
  {
    id: 'urlscan',
    shortName: 'urlscan.io',
    displayName: 'urlscan.io Tech & Tracker Intelligence',
    requiresKey: true,
    envVar: 'URLSCAN_API_KEY',
    freeTierSummary: 'Free community API quota (search & unlisted scan), no credit card',
    signupUrl: 'https://urlscan.io/user/signup',
  },
  {
    id: 'exa',
    shortName: 'Exa Neural',
    displayName: 'Exa Neural Company Discovery',
    requiresKey: true,
    envVar: 'EXA_API_KEY',
    freeTierSummary: 'Free starter neural search credits, no credit card required',
    signupUrl: 'https://dashboard.exa.ai',
  },
  {
    id: 'cbeapi-be',
    shortName: 'BE KBO (CBEAPI)',
    displayName: 'Belgian Crossroads Bank for Enterprises API',
    requiresKey: true,
    envVar: 'CBEAPI_KEY',
    freeTierSummary: '2,500 free Belgian KBO/BCE lookups/day, no credit card required',
    signupUrl: 'https://cbeapi.be',
  },
];

export function getOsintCollectorStatuses(env: NodeJS.ProcessEnv = process.env): OsintCollectorStatus[] {
  return OSINT_COLLECTOR_REGISTRY.map((c) => {
    const live = !c.requiresKey || Boolean((env[c.envVar] ?? '').trim());
    return {
      ...c,
      status: live ? 'LIVE' : 'FALLBACK',
    };
  });
}

export interface OsintInspectionResult {
  domain: string;
  entity: string;
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL';
  mode: 'live_osint' | 'synthetic_calibration';
  registryId: string;
  registrySource: string;
  cmsPlatform: string[];
  analyticsAndPixels: string[];
  consentManagement: string[];
  emailAndEspStack: string[];
  dmarcPolicy: string;
  combinedStackSummary: string;
  readinessScore: number;
  readinessBreakdown: {
    commerceFoundation: number;
    tagAndPixelMaturity: number;
    consentAndPrivacyPosture: number;
    crmAndFirstPartySignal: number;
  };
  detectedGaps: string[];
  enrichmentSnippets: Array<{ source: string; summary: string }>;
  collectorsUsed: string[];
}

const EMAIL_SCRUB_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_SCRUB_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g;

export function scrubPersonalIdentifiers(raw: string): string {
  return raw
    .replace(EMAIL_SCRUB_RE, '[redacted-email]')
    .replace(PHONE_SCRUB_RE, (m) => (m.replace(/\D/g, '').length >= 8 ? '[redacted-phone]' : m))
    .slice(0, 360);
}

export function normalizeSafePublicDomain(rawInput: string): {
  ok: boolean;
  domain: string;
  isSyntheticReserved: boolean;
  error?: string;
} {
  const cleaned = rawInput
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0];

  if (!cleaned || cleaned.length > 190) {
    return { ok: false, domain: '', isSyntheticReserved: false, error: 'Provide a valid domain hostname.' };
  }
  if (cleaned.includes(':') || cleaned.includes('@') || /\s/.test(cleaned)) {
    return { ok: false, domain: '', isSyntheticReserved: false, error: 'Ports, credentials, and spaces are disallowed.' };
  }
  // Reject IPv4 literals or bracketed IPv6 literals (strict SSRF boundary)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned) || cleaned.startsWith('[')) {
    return { ok: false, domain: '', isSyntheticReserved: false, error: 'Raw IP literals are blocked by SSRF policy.' };
  }
  if (
    cleaned === 'localhost' ||
    cleaned.endsWith('.localhost') ||
    cleaned.endsWith('.local') ||
    cleaned.endsWith('.internal') ||
    cleaned.endsWith('.arpa')
  ) {
    return { ok: false, domain: '', isSyntheticReserved: false, error: 'Internal/loopback hostnames are blocked.' };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(cleaned)) {
    return { ok: false, domain: '', isSyntheticReserved: false, error: 'Malformed domain name.' };
  }

  const isSyntheticReserved =
    cleaned.endsWith('.example') ||
    cleaned.endsWith('.example.com') ||
    cleaned.endsWith('.example.org') ||
    cleaned.endsWith('.test') ||
    cleaned.endsWith('.invalid');

  return { ok: true, domain: cleaned, isSyntheticReserved };
}

function computeReadinessAndGaps(params: {
  cmsPlatform: string[];
  analyticsAndPixels: string[];
  consentManagement: string[];
  emailAndEspStack: string[];
  dmarcPolicy: string;
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL';
}) {
  const commerceFoundation = params.cmsPlatform.length > 0 ? 2.6 : 1.5;
  const hasGtmOrGa = params.analyticsAndPixels.some((x) => x.includes('GTM') || x.includes('GA4'));
  const hasPaidSocialPixel = params.analyticsAndPixels.some(
    (x) => x.includes('Meta') || x.includes('Short-Form Video') || x.includes('LinkedIn') || x.includes('Pinterest')
  );
  const tagAndPixelMaturity = Number(((hasGtmOrGa ? 1.5 : 0.6) + (hasPaidSocialPixel ? 1.3 : 0.4)).toFixed(1));
  const consentAndPrivacyPosture = params.consentManagement.length > 0 ? 2.4 : 0.9;
  const hasCrmEsp = params.emailAndEspStack.some((x) =>
    /Klaviyo|HubSpot|Salesforce|Mailchimp|Brevo|ActiveCampaign|SendGrid/i.test(x)
  );
  const dmarcBonus = params.dmarcPolicy.includes('reject') || params.dmarcPolicy.includes('quarantine') ? 0.8 : 0.3;
  const crmAndFirstPartySignal = Number(((hasCrmEsp ? 1.4 : 0.7) + dmarcBonus).toFixed(1));

  const rawTotal = commerceFoundation + tagAndPixelMaturity + consentAndPrivacyPosture + crmAndFirstPartySignal;
  const readinessScore = Math.min(9.9, Math.max(2.5, Number(rawTotal.toFixed(1))));

  const gaps: string[] = [];
  if (params.consentManagement.length === 0) {
    gaps.push('No EU Consent Management Platform (CMP / Consent Mode v2) detected in public head markup.');
  }
  if (!params.analyticsAndPixels.some((x) => x.includes('Server') || x.includes('GTM'))) {
    gaps.push('Browser-only tag footprint: evaluate Server-Side GTM + CAPI event_id deduplication.');
  }
  if (!params.analyticsAndPixels.some((x) => x.includes('Short-Form Video'))) {
    gaps.push('No short-form video commerce pixel detected; greenfield catalog/creative testing opportunity.');
  }
  if (!params.dmarcPolicy.includes('reject') && !params.dmarcPolicy.includes('quarantine')) {
    gaps.push(`DMARC policy (${params.dmarcPolicy}) can be hardened to p=quarantine/reject for lifecycle deliverability.`);
  }
  if (params.country === 'BE') {
    gaps.push('Enforce bilingual Vlaanderen (nl-BE) / Wallonie (fr-BE) consent banner and ad-group separation.');
  } else if (params.country === 'NL') {
    gaps.push('Scope geo-testing at Dutch province granularity rather than narrow municipal radius rings.');
  } else if (params.country === 'FR') {
    gaps.push('Verify CNIL-compliant symmetrical accept/refuse CMP controls before scaling paid catalog feeds.');
  }

  return {
    readinessScore,
    readinessBreakdown: {
      commerceFoundation,
      tagAndPixelMaturity,
      consentAndPrivacyPosture,
      crmAndFirstPartySignal,
    },
    detectedGaps: gaps,
  };
}

export function buildSyntheticOsintFixture(
  domain: string,
  entityHint: string,
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL'
): OsintInspectionResult {
  const cleanDomain = domain || 'vuurtoren-atelier.example';
  const preset =
    country === 'BE'
      ? {
          entity: entityHint || 'Kapsalon Vuurtoren BV',
          registryId: 'KBO 0123.456.789 (synthetic mod-97 calibration)',
          registrySource: 'Synthetic Calibration Fixture (BE)',
          cmsPlatform: ['Lightspeed eCom'],
          analyticsAndPixels: ['Google Tag Manager (GTM)', 'Meta Browser Pixel'],
          consentManagement: ['Cookiebot CMP'],
          emailAndEspStack: ['Google Workspace MX', 'Klaviyo SPF'],
          dmarcPolicy: 'v=DMARC1; p=quarantine',
        }
      : country === 'FR'
        ? {
            entity: entityHint || 'Atelier Lumiere SAS',
            registryId: 'SIREN 801234567 (synthetic calibration)',
            registrySource: 'Synthetic Calibration Fixture (FR)',
            cmsPlatform: ['WooCommerce'],
            analyticsAndPixels: ['GA4 gtag.js'],
            consentManagement: ['Axeptio Consent Mode v2'],
            emailAndEspStack: ['Microsoft 365 MX', 'Brevo (Sendinblue) SPF'],
            dmarcPolicy: 'v=DMARC1; p=none',
          }
        : {
            entity: entityHint || 'Noordzee Rijwielen BV',
            registryId: 'KvK 90012345 (synthetic calibration)',
            registrySource: 'Synthetic Calibration Fixture (NL)',
            cmsPlatform: ['Shopify Plus'],
            analyticsAndPixels: ['Google Tag Manager (Server-Side)', 'GA4', 'Meta Pixel'],
            consentManagement: ['OneTrust Consent Mode v2'],
            emailAndEspStack: ['Google Workspace MX', 'HubSpot SPF'],
            dmarcPolicy: 'v=DMARC1; p=reject',
          };

  const scored = computeReadinessAndGaps({
    cmsPlatform: preset.cmsPlatform,
    analyticsAndPixels: preset.analyticsAndPixels,
    consentManagement: preset.consentManagement,
    emailAndEspStack: preset.emailAndEspStack,
    dmarcPolicy: preset.dmarcPolicy,
    country,
  });

  const combinedStackSummary = [
    ...preset.cmsPlatform,
    ...preset.analyticsAndPixels.slice(0, 2),
    ...preset.consentManagement.slice(0, 1),
  ].join(' + ');

  return {
    domain: cleanDomain,
    entity: preset.entity,
    country,
    mode: 'synthetic_calibration',
    registryId: preset.registryId,
    registrySource: preset.registrySource,
    cmsPlatform: preset.cmsPlatform,
    analyticsAndPixels: preset.analyticsAndPixels,
    consentManagement: preset.consentManagement,
    emailAndEspStack: preset.emailAndEspStack,
    dmarcPolicy: preset.dmarcPolicy,
    combinedStackSummary,
    readinessScore: scored.readinessScore,
    readinessBreakdown: scored.readinessBreakdown,
    detectedGaps: scored.detectedGaps,
    enrichmentSnippets: [
      {
        source: 'Deterministic Replay OSINT',
        summary: `Synthetic calibration profile for ${preset.entity} (${cleanDomain}). Unlock Owner or Reviewer Grant mode with a non-.example domain to execute live DNS/HTML/Registry inspection.`,
      },
    ],
    collectorsUsed: ['synthetic-fixture'],
  };
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs = 4200): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function inspectDnsStack(domain: string): Promise<{
  emailAndEspStack: string[];
  dmarcPolicy: string;
}> {
  const stack = new Set<string>();
  let dmarcPolicy = 'not-published';

  const [mxJson, txtJson, dmarcJson] = await Promise.all([
    fetchJsonWithTimeout(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } },
      3500
    ),
    fetchJsonWithTimeout(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } },
      3500
    ),
    fetchJsonWithTimeout(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_dmarc.${domain}`)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } },
      3500
    ),
  ]);

  const extractDataStrings = (pkt: unknown): string[] => {
    if (!pkt || typeof pkt !== 'object') return [];
    const ans = (pkt as { Answer?: Array<{ data?: string }> }).Answer;
    if (!Array.isArray(ans)) return [];
    return ans.map((a) => String(a.data || '').replace(/^"|"$/g, ''));
  };

  for (const mx of extractDataStrings(mxJson)) {
    const lower = mx.toLowerCase();
    if (lower.includes('google.com') || lower.includes('googlemail.com')) stack.add('Google Workspace MX');
    else if (lower.includes('outlook.com') || lower.includes('protection.outlook.com')) stack.add('Microsoft 365 MX');
    else if (lower.includes('protonmail')) stack.add('Proton Mail MX');
    else if (lower.includes('ovh.net')) stack.add('OVH Mail MX');
  }

  for (const txt of extractDataStrings(txtJson)) {
    const lower = txt.toLowerCase();
    if (lower.includes('klaviyo')) stack.add('Klaviyo ESP');
    if (lower.includes('hubspot')) stack.add('HubSpot CRM');
    if (lower.includes('spf.mandrillapp.com') || lower.includes('mcsv.net')) stack.add('Mailchimp ESP');
    if (lower.includes('sendgrid.net')) stack.add('SendGrid ESP');
    if (lower.includes('salesforce.com')) stack.add('Salesforce CRM');
    if (lower.includes('sendinblue.com') || lower.includes('brevo.com')) stack.add('Brevo ESP');
    if (lower.includes('shopify.com')) stack.add('Shopify Mail');
    if (lower.includes('google-site-verification')) stack.add('Google Search Console Verified');
    if (lower.includes('facebook-domain-verification')) stack.add('Meta Business Domain Verified');
  }

  for (const dm of extractDataStrings(dmarcJson)) {
    if (/v=dmarc1/i.test(dm)) {
      const m = dm.match(/p=(none|quarantine|reject)/i);
      dmarcPolicy = m ? `v=DMARC1; p=${m[1].toLowerCase()}` : 'v=DMARC1';
    }
  }

  return { emailAndEspStack: Array.from(stack), dmarcPolicy };
}

async function inspectHtmlTechStack(domain: string): Promise<{
  cmsPlatform: string[];
  analyticsAndPixels: string[];
  consentManagement: string[];
}> {
  const cms = new Set<string>();
  const pixels = new Set<string>();
  const cmp = new Set<string>();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4200);
  try {
    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'BalaerionPortfolioArchitectureScanner/1.0 (+https://github.com/aertsjef1989)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (res.ok) {
      const rawHtml = (await res.text()).slice(0, 140000).toLowerCase();
      if (rawHtml.includes('cdn.shopify.com') || rawHtml.includes('shopify.theme')) cms.add('Shopify');
      if (rawHtml.includes('wp-content/plugins/woocommerce') || rawHtml.includes('woocommerce')) cms.add('WooCommerce');
      else if (rawHtml.includes('wp-content/')) cms.add('WordPress');
      if (rawHtml.includes('lightspeedhq') || rawHtml.includes('webshopapp.com')) cms.add('Lightspeed eCom');
      if (rawHtml.includes('mage/cookies') || rawHtml.includes('magento')) cms.add('Magento');
      if (rawHtml.includes('prestashop')) cms.add('PrestaShop');
      if (rawHtml.includes('/_next/static/')) cms.add('Next.js Storefront');
      if (rawHtml.includes('webflow.com')) cms.add('Webflow');

      if (rawHtml.includes('googletagmanager.com/gtm.js')) pixels.add('Google Tag Manager (GTM)');
      if (rawHtml.includes('googletagmanager.com/gtag/js') || rawHtml.includes('g-')) pixels.add('GA4');
      if (rawHtml.includes('connect.facebook.net') || rawHtml.includes('fbq(')) pixels.add('Meta Pixel');
      if (rawHtml.includes('ttq.load') || rawHtml.includes('ttq.page')) pixels.add('Short-Form Video Pixel');
      if (rawHtml.includes('snap.licdn.com')) pixels.add('LinkedIn Insight Tag');
      if (rawHtml.includes('pintrk(') || rawHtml.includes('ct.pinterest.com')) pixels.add('Pinterest Tag');

      if (rawHtml.includes('cookiebot.com')) cmp.add('Cookiebot CMP');
      if (rawHtml.includes('cookielaw.org') || rawHtml.includes('onetrust')) cmp.add('OneTrust CMP');
      if (rawHtml.includes('didomi.io')) cmp.add('Didomi CMP');
      if (rawHtml.includes('axept.io') || rawHtml.includes('axeptio')) cmp.add('Axeptio CMP');
      if (rawHtml.includes('complianz')) cmp.add('Complianz CMP');
      if (rawHtml.includes("gtag('consent'") || rawHtml.includes('consent_mode')) cmp.add('Google Consent Mode v2');
    }
  } catch {
    /* domain unreachable or blocked; return empty sets cleanly */
  } finally {
    clearTimeout(timer);
  }

  return {
    cmsPlatform: Array.from(cms),
    analyticsAndPixels: Array.from(pixels),
    consentManagement: Array.from(cmp),
  };
}

async function inspectFrenchRegistry(queryTerm: string): Promise<{
  registryId: string;
  source: string;
  summary?: string;
} | null> {
  if (!queryTerm || queryTerm.length < 2) return null;
  const data = (await fetchJsonWithTimeout(
    `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(queryTerm)}&per_page=1`,
    { headers: { Accept: 'application/json' } },
    3800
  )) as {
    results?: Array<{
      siren?: string;
      nom_complet?: string;
      activite_principale?: string;
      siege?: { libelle_commune?: string };
    }>;
  } | null;

  const top = data?.results?.[0];
  if (!top?.siren) return null;
  const city = top.siege?.libelle_commune ? ` · ${top.siege.libelle_commune}` : '';
  const naf = top.activite_principale ? ` · NAF ${top.activite_principale}` : '';
  return {
    registryId: `SIREN ${top.siren}`,
    source: 'recherche-entreprises.api.gouv.fr (Open Gov)',
    summary: scrubPersonalIdentifiers(`${top.nom_complet || queryTerm} (SIREN ${top.siren}${naf}${city})`),
  };
}

async function inspectOptionalKeyedProviders(
  domain: string,
  entity: string,
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL',
  env: NodeJS.ProcessEnv
): Promise<{
  snippets: Array<{ source: string; summary: string }>;
  collectorsUsed: string[];
  beRegistryId?: string;
}> {
  const snippets: Array<{ source: string; summary: string }> = [];
  const collectorsUsed: string[] = [];
  let beRegistryId: string | undefined;

  const cbeKey = (env.CBEAPI_KEY ?? '').trim();
  if (country === 'BE' && cbeKey && entity.length >= 2) {
    const cbeJson = (await fetchJsonWithTimeout(
      `https://cbeapi.be/api/v1/company/search?name=${encodeURIComponent(entity)}`,
      { headers: { Authorization: `Bearer ${cbeKey}`, Accept: 'application/json' } },
      3800
    )) as { data?: Array<{ cbe_number_formatted?: string; denomination?: string }> } | null;
    const hit = cbeJson?.data?.[0];
    if (hit?.cbe_number_formatted) {
      beRegistryId = `KBO ${hit.cbe_number_formatted}`;
      collectorsUsed.push('cbeapi-be');
      snippets.push({
        source: 'CBEAPI (Belgian KBO)',
        summary: scrubPersonalIdentifiers(`${hit.denomination || entity} (${beRegistryId})`),
      });
    }
  }

  const urlscanKey = (env.URLSCAN_API_KEY ?? '').trim();
  if (urlscanKey) {
    const usJson = (await fetchJsonWithTimeout(
      `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(`domain:${domain}`)}&size=1`,
      { headers: { 'API-Key': urlscanKey, Accept: 'application/json' } },
      3800
    )) as { results?: Array<{ page?: { server?: string; ip?: string; asnname?: string } }> } | null;
    const p = usJson?.results?.[0]?.page;
    if (p) {
      collectorsUsed.push('urlscan');
      snippets.push({
        source: 'urlscan.io',
        summary: scrubPersonalIdentifiers(`Edge/CDN server: ${p.server || 'n/a'} · ASN: ${p.asnname || 'n/a'}`),
      });
    }
  }

  const tavilyKey = (env.TAVILY_API_KEY ?? '').trim();
  if (tavilyKey) {
    const tvJson = (await fetchJsonWithTimeout(
      'https://api.tavily.com/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${entity || domain} ${domain} ecommerce digital marketing`,
          search_depth: 'basic',
          max_results: 2,
        }),
      },
      4500
    )) as { results?: Array<{ title?: string; content?: string }> } | null;
    const r0 = tvJson?.results?.[0];
    if (r0?.content) {
      collectorsUsed.push('tavily');
      snippets.push({
        source: 'Tavily OSINT',
        summary: scrubPersonalIdentifiers(`${r0.title ? `${r0.title}: ` : ''}${r0.content}`),
      });
    }
  }

  const serperKey = (env.SERPER_API_KEY ?? '').trim();
  if (serperKey && snippets.length < 3) {
    const spJson = (await fetchJsonWithTimeout(
      'https://google.serper.dev/search',
      {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `site:${domain}`, num: 2 }),
      },
      4000
    )) as { organic?: Array<{ title?: string; snippet?: string }> } | null;
    const o0 = spJson?.organic?.[0];
    if (o0?.snippet) {
      collectorsUsed.push('serper');
      snippets.push({
        source: 'Serper.dev SERP',
        summary: scrubPersonalIdentifiers(`${o0.title ? `${o0.title}: ` : ''}${o0.snippet}`),
      });
    }
  }

  const exaKey = (env.EXA_API_KEY ?? '').trim();
  if (exaKey && snippets.length < 4) {
    const exaJson = (await fetchJsonWithTimeout(
      'https://api.exa.ai/search',
      {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${entity || domain} company overview`, numResults: 1 }),
      },
      4200
    )) as { results?: Array<{ title?: string; url?: string }> } | null;
    const e0 = exaJson?.results?.[0];
    if (e0?.title) {
      collectorsUsed.push('exa');
      snippets.push({
        source: 'Exa Neural Discovery',
        summary: scrubPersonalIdentifiers(`${e0.title} (${e0.url || domain})`),
      });
    }
  }

  return { snippets, collectorsUsed, beRegistryId };
}

export async function runHybridOsintInspection(params: {
  domain: string;
  entity: string;
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL';
  allowLiveNetwork: boolean;
  env?: NodeJS.ProcessEnv;
}): Promise<OsintInspectionResult> {
  const env = params.env ?? process.env;
  const parsed = normalizeSafePublicDomain(params.domain || 'vuurtoren-atelier.example');
  if (!parsed.ok) {
    throw new Error(parsed.error || 'Invalid domain.');
  }

  if (!params.allowLiveNetwork || parsed.isSyntheticReserved) {
    return buildSyntheticOsintFixture(parsed.domain, params.entity, params.country);
  }

  const collectorsUsed: string[] = ['dns-doh', 'web-tech-scanner'];
  const [dnsRes, htmlRes, frRes, keyedRes] = await Promise.all([
    inspectDnsStack(parsed.domain),
    inspectHtmlTechStack(parsed.domain),
    params.country === 'FR'
      ? inspectFrenchRegistry(params.entity || parsed.domain.split('.')[0])
      : Promise.resolve(null),
    inspectOptionalKeyedProviders(parsed.domain, params.entity, params.country, env),
  ]);

  let registryId = 'PUBLIC-DOMAIN-VERIFIED';
  let registrySource = 'DNS + Storefront Head Fingerprint';
  const snippets: Array<{ source: string; summary: string }> = [];

  if (frRes) {
    registryId = frRes.registryId;
    registrySource = frRes.source;
    collectorsUsed.push('fr-siren-open');
    if (frRes.summary) {
      snippets.push({ source: 'FR Official Registry', summary: frRes.summary });
    }
  } else if (keyedRes.beRegistryId) {
    registryId = keyedRes.beRegistryId;
    registrySource = 'CBEAPI Belgian KBO';
  }

  collectorsUsed.push(...keyedRes.collectorsUsed);
  snippets.push(...keyedRes.snippets);

  const scored = computeReadinessAndGaps({
    cmsPlatform: htmlRes.cmsPlatform,
    analyticsAndPixels: htmlRes.analyticsAndPixels,
    consentManagement: htmlRes.consentManagement,
    emailAndEspStack: dnsRes.emailAndEspStack,
    dmarcPolicy: dnsRes.dmarcPolicy,
    country: params.country,
  });

  const summaryParts = [
    ...(htmlRes.cmsPlatform.length ? htmlRes.cmsPlatform : ['Custom Web Stack']),
    ...htmlRes.analyticsAndPixels.slice(0, 2),
    ...htmlRes.consentManagement.slice(0, 1),
    ...dnsRes.emailAndEspStack.slice(0, 1),
  ];

  if (snippets.length === 0) {
    snippets.push({
      source: 'Zero-Key Live OSINT (DNS + HTML)',
      summary: `Inspected ${parsed.domain}: ${summaryParts.join(' + ')} · DMARC ${dnsRes.dmarcPolicy}.`,
    });
  }

  return {
    domain: parsed.domain,
    entity: params.entity || parsed.domain,
    country: params.country,
    mode: 'live_osint',
    registryId,
    registrySource,
    cmsPlatform: htmlRes.cmsPlatform,
    analyticsAndPixels: htmlRes.analyticsAndPixels,
    consentManagement: htmlRes.consentManagement,
    emailAndEspStack: dnsRes.emailAndEspStack,
    dmarcPolicy: dnsRes.dmarcPolicy,
    combinedStackSummary: summaryParts.join(' + '),
    readinessScore: scored.readinessScore,
    readinessBreakdown: scored.readinessBreakdown,
    detectedGaps: scored.detectedGaps,
    enrichmentSnippets: snippets,
    collectorsUsed,
  };
}
