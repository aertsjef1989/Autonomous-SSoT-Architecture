import { getSupabaseServer } from '../supabase-server';
import {
  chunkMarkdownForSsot,
  getAuthorizedSsotDocumentById,
  getEphemeralSsotDocuments,
  type SsotMarket,
} from '../ssot-ingestion';
import { generateFreeEmbeddings1024 } from './embeddings';
import type { RetrievedChunk } from './retrieval-slot';

export interface GroundedCitation {
  docId: string;
  title: string;
  market: string;
  status: string;
  isStale: boolean;
  snippet: string;
  score: number;
}

const SYNTHETIC_FALLBACK_SSOT: Array<{
  doc_id: string;
  title: string;
  market: SsotMarket;
  category: string;
  status: 'VERIFIED' | 'REVIEW_DUE' | 'DRAFT';
  content_md: string;
}> = [
  {
    doc_id: 'FMT_GLB_011',
    title: 'Commerce Pixel & Server Events Integration',
    market: 'GLOBAL',
    category: 'Formats_and_Tools',
    status: 'VERIFIED',
    content_md:
      'Browser pixel and Server-Side Conversions API (CAPI) events must share an identical deterministic event_id string so the ad router deduplicates duplicate fire events within a 48-hour attribution window. Advisory rule: client engineering deploys tags on staging first.',
  },
  {
    doc_id: 'FMT_GLB_004',
    title: 'Server-Side Conversions API Setup Guide',
    market: 'GLOBAL',
    category: 'Formats_and_Tools',
    status: 'VERIFIED',
    content_md:
      'Hash customer identifiers with SHA-256 after lowercase and whitespace normalization prior to transmission. Verify event match quality >= 6.5/10 before enabling optimization events.',
  },
  {
    doc_id: 'VRT_NL_006',
    title: 'NL Retail & Service Advisory Playbook (Province Scope)',
    market: 'NL',
    category: 'Verticals',
    status: 'VERIFIED',
    content_md:
      'Dutch market (nl-NL) campaigns use province-level geographic targeting only (for example Noord-Holland, Zuid-Holland, Noord-Brabant, Utrecht). City-level pin drops and custom radius targeting are disabled. All guidance stays strictly advisory so the advertiser team retains direct account execution.',
  },
  {
    doc_id: 'POL_BE_001',
    title: 'Belgian Bilingual Attribution & Consent Checklist',
    market: 'BE',
    category: 'Policies',
    status: 'VERIFIED',
    content_md:
      'Belgian accounts (nl-BE Vlaanderen / fr-BE Wallonie) require explicit CMP consent signal propagation before firing browser pixels. Separate Flemish formal "uw" creative sets from French-language ad groups.',
  },
  {
    doc_id: 'TPL_FR_003',
    title: 'Synthetic Prospect Brief & Readiness Rubric',
    market: 'FR',
    category: 'Templates',
    status: 'REVIEW_DUE',
    content_md:
      'Readiness rubric evaluates commerce stack, server-side event hygiene, creative velocity, and province/regional compliance on a 0 to 10 scale. Discovery calls are strictly 30 minutes; never quote daily budget minimums in initial outreach.',
  },
];

function scoreLexicalMatch(query: string, text: string, title: string, docId: string): number {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return 0.1;
  const hay = `${docId} ${title} ${text}`.toLowerCase();
  const titleHay = `${docId} ${title}`.toLowerCase();
  let hits = 0;
  for (const tok of tokens) {
    if (titleHay.includes(tok)) hits += 2.2;
    else if (hay.includes(tok)) hits += 1.0;
  }
  return hits / (tokens.length * 1.5);
}

export async function retrieveWorkspaceContext(opts: {
  query: string;
  pillar: 'ssot' | 'prospecthub' | 'syndicate';
  market?: string;
  activeDocId?: string;
  syndicateContext?: string;
  topK?: number;
  authorizedForLiveCorpus: boolean;
}): Promise<{ chunks: RetrievedChunk[]; citations: GroundedCitation[] }> {
  const topK = Math.max(1, Math.min(opts.topK ?? 5, 8));
  const mUpper = (opts.market || 'ALL').toUpperCase();
  const targetMarkets: SsotMarket[] =
    mUpper === 'NL' || mUpper === 'BE' || mUpper === 'FR'
      ? ['GLOBAL', mUpper]
      : mUpper === 'GLOBAL' || mUpper === 'GLB'
        ? ['GLOBAL']
        : ['GLOBAL', 'NL', 'BE', 'FR'];

  if (opts.pillar === 'syndicate') {
    if (!opts.syndicateContext) return { chunks: [], citations: [] };
    const chunk: RetrievedChunk = {
      id: 'SYNDICATE_LIVE_STATE',
      sourceTitle: 'Syndicate Matchday Poisson & NAV State',
      marketCode: 'UCL',
      isStale: false,
      chunkText: opts.syndicateContext.slice(0, 3500),
      similarity: 1.0,
    };
    return {
      chunks: [chunk],
      citations: [
        {
          docId: 'SYNDICATE_LIVE_STATE',
          title: 'Active Matchday Fixtures & Unit-Share NAV Ledger',
          market: 'UCL',
          status: 'VERIFIED',
          isStale: false,
          snippet: opts.syndicateContext.slice(0, 220),
          score: 1.0,
        },
      ],
    };
  }

  const results: GroundedCitation[] = [];
  const seenKey = new Set<string>();

  // 1. Pin active open SSoT document first when authorized
  if (opts.activeDocId && opts.authorizedForLiveCorpus) {
    const pinned = await getAuthorizedSsotDocumentById(opts.activeDocId);
    if (pinned) {
      const pinnedChunks = chunkMarkdownForSsot(pinned.content_md, 1100);
      const bestChunk =
        pinnedChunks
          .map((c) => ({ c, s: scoreLexicalMatch(opts.query, c, pinned.title, pinned.doc_id) }))
          .sort((a, b) => b.s - a.s)[0]?.c ?? pinned.content_md.slice(0, 1100);
      results.push({
        docId: pinned.doc_id,
        title: pinned.title,
        market: pinned.market,
        status: pinned.status,
        isStale: pinned.status !== 'VERIFIED',
        snippet: bestChunk,
        score: 1.5,
      });
      seenKey.add(`${pinned.doc_id}:pinned`);
    }
  }

  // 2. Live Supabase Hybrid Search (search_ssot_hybrid RPC -> fallback ssot_documents scan)
  const sb = opts.authorizedForLiveCorpus ? getSupabaseServer() : null;
  if (sb) {
    try {
      const qVecs = await generateFreeEmbeddings1024([opts.query], 'search_query');
      const rpcArgs: Record<string, unknown> = {
        p_query: opts.query,
        p_markets: targetMarkets,
        p_embedding: qVecs?.[0] ?? null,
        p_limit: topK,
      };
      const { data: hybridRows, error: rpcErr } = await sb.rpc('search_ssot_hybrid', rpcArgs);
      if (!rpcErr && Array.isArray(hybridRows) && hybridRows.length > 0) {
        for (const r of hybridRows as Array<{
          doc_id: string;
          title: string;
          market: string;
          status: string;
          chunk_text: string;
          score: number;
        }>) {
          const key = `${r.doc_id}:${r.chunk_text.slice(0, 48)}`;
          if (seenKey.has(key)) continue;
          seenKey.add(key);
          results.push({
            docId: r.doc_id,
            title: r.title,
            market: r.market,
            status: r.status,
            isStale: r.status !== 'VERIFIED',
            snippet: r.chunk_text,
            score: Number(r.score ?? 0.5),
          });
        }
      }
    } catch {
      /* fall through to ssot_documents table scan */
    }

    if (results.length < topK) {
      const { data: docRows } = await sb
        .from('ssot_documents')
        .select('doc_id, title, market, category, status, content_md')
        .in('market', targetMarkets)
        .limit(350);
      if (Array.isArray(docRows) && docRows.length > 0) {
        const scored = docRows
          .flatMap((d) =>
            chunkMarkdownForSsot(d.content_md, 950).map((c) => ({
              docId: d.doc_id,
              title: d.title,
              market: d.market,
              status: d.status,
              isStale: d.status !== 'VERIFIED',
              snippet: c,
              score: scoreLexicalMatch(opts.query, c, d.title, d.doc_id),
            }))
          )
          .sort((a, b) => b.score - a.score);
        for (const item of scored) {
          if (results.length >= topK) break;
          const key = `${item.docId}:${item.snippet.slice(0, 48)}`;
          if (seenKey.has(key)) continue;
          seenKey.add(key);
          results.push(item);
        }
      }
    }
  }

  // 3. Local ephemeral SSoT store (used in local dev / verify_ssot_ingestion)
  if (results.length === 0 && opts.authorizedForLiveCorpus) {
    const eph = getEphemeralSsotDocuments().filter((d) => targetMarkets.includes(d.market));
    if (eph.length > 0) {
      const scored = eph
        .flatMap((d) =>
          chunkMarkdownForSsot(d.content_md, 950).map((c) => ({
            docId: d.doc_id,
            title: d.title,
            market: d.market,
            status: d.status,
            isStale: d.status !== 'VERIFIED',
            snippet: c,
            score: scoreLexicalMatch(opts.query, c, d.title, d.doc_id),
          }))
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      results.push(...scored);
    }
  }

  // 4. Synthetic baseline SSoT fallback when Supabase has not been populated yet
  if (results.length === 0) {
    const fallbackPool = SYNTHETIC_FALLBACK_SSOT.filter((d) => targetMarkets.includes(d.market));
    const scored = fallbackPool
      .map((d) => ({
        docId: d.doc_id,
        title: d.title,
        market: d.market,
        status: d.status,
        isStale: d.status !== 'VERIFIED',
        snippet: d.content_md,
        score: scoreLexicalMatch(opts.query, d.content_md, d.title, d.doc_id),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    results.push(...scored);
  }

  const trimmed = results.slice(0, topK);
  const chunks: RetrievedChunk[] = trimmed.map((c) => ({
    id: c.docId,
    sourceTitle: c.title,
    marketCode: c.market,
    isStale: c.isStale,
    chunkText: c.snippet,
    similarity: Number(c.score.toFixed(3)),
  }));

  return { chunks, citations: trimmed };
}
