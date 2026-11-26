'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FloatingChat } from '@/components/FloatingChat';
import {
  buildPressDocumentFromContent,
  buildStudioDeckFromContent,
  saveHandoffToLocalStorage,
  savePressDocHandoffToLocalStorage,
} from '@/lib/signal-handoff';

interface ReplayDocRow {
  doc_id: string;
  market: 'GLOBAL' | 'NL' | 'BE' | 'FR';
  category: string;
  title: string;
  status: 'VERIFIED' | 'REVIEW_DUE' | 'DRAFT';
  updated_at: string;
}

interface FullSsotDoc extends ReplayDocRow {
  drive_file_id: string;
  content_md: string;
}

interface CitationItem {
  docId: string;
  title: string;
  market: string;
  status: string;
  isStale: boolean;
  snippet: string;
}

interface SsotChatTurn {
  role: 'user' | 'assistant';
  text: string;
  provider?: string | null;
  model?: string | null;
  replay?: boolean;
  blocked?: boolean;
  staleWarning?: boolean;
  citations?: CitationItem[];
}

const REPLAY_DOCS: ReplayDocRow[] = [
  { doc_id: 'FMT_GLB_011', market: 'GLOBAL', category: 'Formats_and_Tools', title: 'Commerce Pixel & Server Events Integration', status: 'VERIFIED', updated_at: '2026-11-20' },
  { doc_id: 'FMT_GLB_004', market: 'GLOBAL', category: 'Formats_and_Tools', title: 'Server-Side Conversions API Setup Guide', status: 'VERIFIED', updated_at: '2026-11-18' },
  { doc_id: 'VRT_NL_006', market: 'NL', category: 'Verticals', title: 'NL Retail & Service Advisory Playbook (Province Scope)', status: 'VERIFIED', updated_at: '2026-11-22' },
  { doc_id: 'POL_BE_001', market: 'BE', category: 'Policies', title: 'Belgian Bilingual Attribution & Consent Checklist', status: 'VERIFIED', updated_at: '2026-11-19' },
  { doc_id: 'TPL_FR_003', market: 'FR', category: 'Templates', title: 'Synthetic Prospect Brief & Readiness Rubric', status: 'REVIEW_DUE', updated_at: '2026-10-15' },
];

const DETECTORS = [
  { code: 'SC-001', kind: 'Scheduled (07:00)', name: 'Metadata & Ownership Scanner', state: 'PASS (0 unowned)' },
  { code: 'SC-002', kind: 'Scheduled (07:30)', name: 'Expected Run Meta-Auditor', state: 'PASS (10/10 controls)' },
  { code: 'SC-003', kind: 'Scheduled (02:00)', name: 'Forward/Reverse State Reconciliation', state: 'PASS (0 divergent)' },
  { code: 'DT-001', kind: 'Event Trigger', name: 'Audit Log Write-Failure Halt (P1)', state: 'ARMED' },
  { code: 'DT-002', kind: 'Event Trigger', name: 'Mover Scope-Change Ownership Guard', state: 'ARMED' },
];

const MARKETS = ['ALL', 'GLOBAL', 'NL', 'BE', 'FR'] as const;
const CATEGORIES = [
  'ALL',
  'Formats_and_Tools',
  'Verticals',
  'Policies',
  'Templates',
  'Campaigns',
  'Lifecycle',
  'Markets',
] as const;

const SSOT_CHAT_PROVIDERS: Array<{ id: string; label: string; lane: 'safe' | 'general' }> = [
  { id: 'mistral', label: 'Mistral EU (Safe Lane)', lane: 'safe' },
  { id: 'codestral', label: 'Codestral EU (Safe Lane)', lane: 'safe' },
  { id: 'ovhcloud-eu', label: 'OVHcloud EU (Safe Lane)', lane: 'safe' },
  { id: 'nvidia-nim', label: 'NVIDIA NIM (General)', lane: 'general' },
  { id: 'groq', label: 'Groq Llama 3.3 70B (General)', lane: 'general' },
  { id: 'cerebras', label: 'Cerebras Qwen 3 32B (General)', lane: 'general' },
  { id: 'gemini', label: 'Gemini 2.5 Flash (General)', lane: 'general' },
  { id: 'openrouter-free', label: 'OpenRouter :free (General)', lane: 'general' },
  { id: 'cohere', label: 'Cohere Command A (General)', lane: 'general' },
];

export default function SSoTPage() {
  const router = useRouter();
  const [market, setMarket] = useState<(typeof MARKETS)[number]>('ALL');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ALL');
  const [searchQ, setSearchQ] = useState('');

  const [liveAuthorized, setLiveAuthorized] = useState(false);
  const [liveRole, setLiveRole] = useState<string>('');
  const [liveDocs, setLiveDocs] = useState<ReplayDocRow[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<FullSsotDoc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Conversational SSoT RAG state
  const [chatProvider, setChatProvider] = useState('mistral');
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatTurns, setChatTurns] = useState<SsotChatTurn[]>([]);

  const fetchLiveCorpus = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ market, category, q: searchQ });
      const res = await fetch(`/api/ssot?${qs.toString()}`, { cache: 'no-store' });
      if (res.status === 200) {
        const json = await res.json();
        setLiveAuthorized(true);
        setLiveRole(json.role || 'grant');
        setLiveDocs(json.docs || []);
      } else {
        await res.text().catch(() => '');
        setLiveAuthorized(false);
        setLiveDocs([]);
      }
    } catch {
      setLiveAuthorized(false);
    }
  }, [market, category, searchQ]);

  useEffect(() => {
    fetchLiveCorpus();
  }, [fetchLiveCorpus]);

  const replayFiltered = REPLAY_DOCS.filter((d) => {
    const marketOk =
      market === 'ALL'
        ? true
        : market === 'GLOBAL'
          ? d.market === 'GLOBAL'
          : d.market === 'GLOBAL' || d.market === market;
    const catOk = category === 'ALL' ? true : d.category === category;
    const q = searchQ.trim().toLowerCase();
    const qOk = !q
      ? true
      : d.doc_id.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
    return marketOk && catOk && qOk;
  });

  const rows = liveAuthorized && liveDocs.length > 0 ? liveDocs : replayFiltered;
  const showingLive = liveAuthorized && liveDocs.length > 0;

  const openDocumentById = async (docId: string) => {
    const matched = rows.find((r) => r.doc_id === docId) || REPLAY_DOCS.find((r) => r.doc_id === docId);
    if (matched) {
      await openDocument(matched);
      return;
    }
    if (showingLive) {
      setLoadingDoc(true);
      try {
        const res = await fetch(`/api/ssot/${encodeURIComponent(docId)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setSelectedDoc(json.doc);
        }
      } finally {
        setLoadingDoc(false);
      }
    }
  };

  const openDocument = async (row: ReplayDocRow) => {
    if (!showingLive) {
      setSelectedDoc({
        ...row,
        drive_file_id: 'synthetic-replay',
        content_md: `# ${row.doc_id}: ${row.title}\n\n* **Market Scope:** ${row.market} (inherits GLOBAL baseline)\n* **Category:** ${row.category}\n* **Status:** ${row.status}\n\nSynthetic Replay preview. Unlock Owner session on /admin or redeem a single-use grant on /redeem once Supabase is populated to view live Drive-synced SSoT Markdown.`,
      });
      return;
    }
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/ssot/${encodeURIComponent(row.doc_id)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setSelectedDoc(json.doc);
      }
    } finally {
      setLoadingDoc(false);
    }
  };

  const sendSsotChat = async (overrideText?: string) => {
    const q = (overrideText ?? chatPrompt).trim();
    if (!q || chatBusy) return;
    if (!overrideText) setChatPrompt('');
    const provCfg = SSOT_CHAT_PROVIDERS.find((p) => p.id === chatProvider) ?? SSOT_CHAT_PROVIDERS[0];
    const history = chatTurns
      .filter((t) => !t.blocked)
      .slice(-6)
      .map((t) => ({ role: t.role, content: t.text }));

    setChatTurns((prev) => [...prev, { role: 'user', text: q }]);
    setChatBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lane: provCfg.lane,
          provider: provCfg.id,
          mode: 'ssot_rag',
          pillar: 'ssot',
          market,
          activeDocId: selectedDoc?.doc_id,
          history,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setChatTurns((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setChatTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || data.error || 'Grounded SSoT response served.',
            provider: data.provider || null,
            model: data.model || null,
            replay: Boolean(data.replay),
            staleWarning: Boolean(data.staleWarning),
            citations: Array.isArray(data.citations) ? data.citations : [],
          },
        ]);
      }
    } catch {
      setChatTurns((prev) => [
        ...prev,
        { role: 'assistant', text: '[Offline Replay] Network unavailable; local SSoT controls remain available.', replay: true },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const sendToStudio = (title: string, content: string) => {
    const deck = buildStudioDeckFromContent({
      title,
      content,
      market: market === 'ALL' ? 'GLOBAL' : market,
      eyebrowPrefix: 'SSOT PLAYBOOK',
      defaultHeroId: 'H04',
    });
    if (saveHandoffToLocalStorage(deck).ok) {
      router.push('/studio');
    }
  };

  const sendToPress = (title: string, content: string, refId?: string) => {
    const doc = buildPressDocumentFromContent({
      title,
      content,
      market: market === 'ALL' ? 'GLOBAL' : market,
      docType: 'playbook_page',
      sourceLabel: refId ? `SSoT Document ${refId}` : 'SSoT Hybrid Corpus',
      sourceRef: refId || `Market Scope ${market}`,
    });
    if (savePressDocHandoffToLocalStorage(doc).ok) {
      router.push('/press');
    }
  };

  const exportCsv = () => {
    const header = 'doc_id,market,category,title,status,updated_at\n';
    const body = rows
      .map((r) => `${r.doc_id},${r.market},${r.category},"${r.title.replace(/"/g, '""')}",${r.status},${r.updated_at}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ssot_bi_export.csv';
    a.click();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ssot_bi_export.json';
    a.click();
  };

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>
          Pillar I: Autonomous SSoT Corpus &amp; Conversational RAG ({showingLive ? `Live Supabase · ${liveRole}` : 'Replay Mode'})
        </h1>
        {!liveAuthorized ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/admin"
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #21E0DC',
                background: '#21E0DC',
                color: '#08090D',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Owner Unlock (/admin)
            </Link>
            <Link
              href="/redeem"
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#171B24',
                color: '#F2F5F9',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Redeem Grant (/redeem)
            </Link>
          </div>
        ) : null}
      </div>

      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 840, marginTop: 4 }}>
        Zero-commit Drive-to-Supabase knowledge corpus with hybrid <code>tsvector</code> + <code>pgvector</code> retrieval. Selecting{' '}
        <strong>NL</strong>, <strong>BE</strong>, or <strong>FR</strong> scopes both the document browser and conversational assistant to{' '}
        <strong>GLOBAL + market-specific</strong> playbooks, policies, verticals, and templates.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, margin: '18px 0' }}>
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#8B95A5', textTransform: 'uppercase' }}>Reference Model Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#21E0DC', marginTop: 4 }}>EUR 198k to 297k</div>
          <div style={{ fontSize: 12, color: '#8B95A5', marginTop: 4 }}>100 seats · 40% to 60% recovery</div>
        </div>
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#8B95A5', textTransform: 'uppercase' }}>Self-Healing Controls</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#21E0DC', marginTop: 4 }}>10 / 10 Active</div>
          <div style={{ fontSize: 12, color: '#8B95A5', marginTop: 4 }}>5 scanners + 5 event detectors</div>
        </div>
        <div style={{ background: '#11141B', border: '1px solid #F0245C', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#F0245C', textTransform: 'uppercase' }}>Active RAG Scope</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            {market === 'ALL' ? 'GLOBAL + NL/BE/FR' : market === 'GLOBAL' ? 'GLOBAL Only' : `GLOBAL + ${market}`}
          </div>
          <div style={{ fontSize: 12, color: '#B9C0CE', marginTop: 4 }}>
            {rows.length} docs {selectedDoc ? `· Pinned: ${selectedDoc.doc_id}` : ''}
          </div>
        </div>
      </div>

      {/* Market Selector + Category Filter + Search + Exports */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {MARKETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarket(m)}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 8,
              border: market === m ? '1px solid #21E0DC' : '1px solid #232836',
              backgroundColor: market === m ? '#21E0DC' : '#11141B',
              color: market === m ? '#08090D' : '#B9C0CE',
              fontWeight: market === m ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {m === 'ALL' ? 'Market: ALL' : m === 'GLOBAL' ? 'GLOBAL' : `${m} (+GLOBAL)`}
          </button>
        ))}

        <select
          aria-label="Filter by SSoT Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
          style={{
            minHeight: 44,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #232836',
            backgroundColor: '#11141B',
            color: '#F2F5F9',
            fontSize: 14,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>

        <input
          type="search"
          aria-label="Search SSoT Documents"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search ID, title, or Markdown..."
          style={{
            minHeight: 44,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #232836',
            backgroundColor: '#08090D',
            color: '#F2F5F9',
            fontSize: 14,
            flex: '1 1 200px',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="button"
          onClick={exportCsv}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid #21E0DC',
            backgroundColor: '#171B24',
            color: '#21E0DC',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export BI CSV
        </button>
        <button
          type="button"
          onClick={exportJson}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid #232836',
            backgroundColor: '#171B24',
            color: '#F2F5F9',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export JSON
        </button>
      </div>

      {/* Embedded Conversational SSoT Assistant */}
      <section
        aria-label="Conversational SSoT Assistant"
        style={{
          background: '#11141B',
          border: '1px solid #21E0DC',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#21E0DC', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              CONVERSATIONAL SSoT INTERFACE · HYBRID RAG
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 17, color: '#FFFFFF' }}>
              Chat with SSoT Files ({market === 'ALL' ? 'All Markets' : `GLOBAL + ${market}`}
              {selectedDoc ? ` · Pinned ${selectedDoc.doc_id}` : ''})
            </h2>
          </div>

          <select
            aria-label="Select SSoT LLM Provider"
            value={chatProvider}
            onChange={(e) => setChatProvider(e.target.value)}
            style={{
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #232836',
              background: '#08090D',
              color: '#F2F5F9',
              fontSize: 13.5,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            {SSOT_CHAT_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            { cmd: '/ask ', label: '/ask Grounded Q&A', sample: '/ask How do browser pixel and CAPI deduplicate events?' },
            { cmd: '/check ', label: '/check Audit Scenario', sample: '/check Can an NL retail campaign target city radius around Utrecht?' },
            { cmd: '/policy ', label: '/policy Market Obligations', sample: '/policy Summarize Belgian bilingual consent requirements' },
            { cmd: '/gap ', label: '/gap Staleness & Gaps', sample: '/gap List any REVIEW_DUE documents or missing templates in scope' },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => sendSsotChat(btn.sample)}
              style={{
                minHeight: 44,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#171B24',
                color: '#B9C0CE',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {chatTurns.length > 0 ? (
          <div
            style={{
              maxHeight: 340,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: 10,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #232836',
              marginBottom: 10,
            }}
          >
            {chatTurns.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: t.blocked ? 'rgba(240, 36, 92, 0.14)' : t.role === 'user' ? '#171B24' : '#131722',
                  borderLeft: t.blocked ? '3px solid #F0245C' : t.role === 'assistant' ? '3px solid #21E0DC' : 'none',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                <div style={{ fontSize: 11, color: '#8B95A5', marginBottom: 4 }}>
                  {t.role === 'user'
                    ? 'You'
                    : `SSoT Assistant · ${t.replay ? 'Replay' : `${t.provider || 'Live'} (${t.model || 'pinned'})`}`}
                </div>
                <div>{t.text}</div>

                {t.staleWarning ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(240, 36, 92, 0.14)',
                      border: '1px solid #F0245C',
                      color: '#FF5C86',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Staleness Warning: At least one cited SSoT document is marked REVIEW_DUE. Verify owner sign-off before external distribution.
                  </div>
                ) : null}

                {t.citations && t.citations.length > 0 ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.citations.map((c, cIdx) => (
                      <button
                        key={`${c.docId}-${cIdx}`}
                        type="button"
                        onClick={() => openDocumentById(c.docId)}
                        style={{
                          minHeight: 36,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: `1px solid ${c.isStale ? '#F0245C' : '#21E0DC'}`,
                          background: '#08090D',
                          color: c.isStale ? '#FF5C86' : '#21E0DC',
                          fontFamily: 'monospace',
                          fontSize: 11.5,
                          cursor: 'pointer',
                        }}
                      >
                        [{c.docId}] {c.market}
                        {c.isStale ? ' · REVIEW_DUE' : ''}
                      </button>
                    ))}
                  </div>
                ) : null}

                {t.role === 'assistant' && !t.blocked ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => sendToStudio(`SSoT Brief (${market})`, t.text)}
                      style={{
                        minHeight: 40,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #21E0DC',
                        background: '#171B24',
                        color: '#21E0DC',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Send to Signal Studio (16:9)
                    </button>
                    <button
                      type="button"
                      onClick={() => sendToPress(`SSoT Brief (${market})`, t.text, t.citations?.[0]?.docId)}
                      style={{
                        minHeight: 40,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #F0245C',
                        background: '#171B24',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Send to Signal Press (A4)
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            type="text"
            aria-label="Ask the SSoT corpus"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendSsotChat()}
            placeholder="Ask a question across SSoT files (/ask, /check, /policy, /gap)..."
            style={{
              flex: '1 1 240px',
              minHeight: 44,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #232836',
              background: '#08090D',
              color: '#F2F5F9',
              fontSize: 15,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            disabled={chatBusy}
            onClick={() => sendSsotChat()}
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#21E0DC',
              color: '#08090D',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {chatBusy ? 'Querying...' : 'Ask SSoT'}
          </button>
        </div>
      </section>

      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 20 }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', backgroundColor: '#11141B' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Doc ID</th>
              <th style={{ padding: 10 }}>Market</th>
              <th style={{ padding: 10 }}>Category</th>
              <th style={{ padding: 10 }}>Title</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.doc_id} style={{ borderTop: '1px solid #232836', fontSize: 13.5 }}>
                <td style={{ padding: 10, fontFamily: 'monospace', color: '#21E0DC' }}>{r.doc_id}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 700,
                      backgroundColor: r.market === 'GLOBAL' ? '#171B24' : '#26131C',
                      color: r.market === 'GLOBAL' ? '#21E0DC' : '#FF5C86',
                      border: `1px solid ${r.market === 'GLOBAL' ? '#21E0DC' : '#F0245C'}`,
                    }}
                  >
                    {r.market}
                  </span>
                </td>
                <td style={{ padding: 10, color: '#B9C0CE' }}>{r.category}</td>
                <td style={{ padding: 10, fontWeight: 600 }}>{r.title}</td>
                <td
                  style={{
                    padding: 10,
                    fontWeight: 700,
                    color: r.status === 'VERIFIED' ? '#21E0DC' : '#F0245C',
                  }}
                >
                  {r.status}
                </td>
                <td style={{ padding: 6 }}>
                  <button
                    type="button"
                    onClick={() => openDocument(r)}
                    style={{
                      minHeight: 44,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #232836',
                      background: '#171B24',
                      color: '#F2F5F9',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Read &amp; Pin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loadingDoc ? (
        <p style={{ color: '#21E0DC', fontSize: 13 }}>Loading SSoT Markdown...</p>
      ) : null}

      {selectedDoc ? (
        <section
          aria-label="SSoT Markdown Reader"
          style={{
            background: '#11141B',
            border: '1px solid #21E0DC',
            borderRadius: 10,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: 'monospace', color: '#21E0DC', fontSize: 12.5 }}>
                {selectedDoc.doc_id} · Pinned to Conversational RAG
              </span>
              <h2 style={{ margin: '4px 0 0', fontSize: 18, color: '#FFFFFF' }}>{selectedDoc.title}</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={() => sendToStudio(selectedDoc.title, selectedDoc.content_md)}
                style={{
                  minHeight: 44,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #21E0DC',
                  background: '#171B24',
                  color: '#21E0DC',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -&gt; Signal Studio (16:9)
              </button>
              <button
                type="button"
                onClick={() => sendToPress(selectedDoc.title, selectedDoc.content_md, selectedDoc.doc_id)}
                style={{
                  minHeight: 44,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #F0245C',
                  background: '#F0245C',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -&gt; Signal Press (A4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  minHeight: 44,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#171B24',
                  color: '#F2F5F9',
                  cursor: 'pointer',
                }}
              >
                Close Reader
              </button>
            </div>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #232836',
              color: '#F2F5F9',
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              maxHeight: 420,
              overflowY: 'auto',
            }}
          >
            {selectedDoc.content_md}
          </pre>
        </section>
      ) : null}

      <h2 style={{ fontSize: 17, color: '#21E0DC', marginBottom: 10 }}>Representative Scanners &amp; Event Detectors</h2>
      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8 }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', backgroundColor: '#11141B' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Code</th>
              <th style={{ padding: 10 }}>Cadence / Trigger</th>
              <th style={{ padding: 10 }}>Control Name</th>
              <th style={{ padding: 10 }}>Replay Telemetry</th>
            </tr>
          </thead>
          <tbody>
            {DETECTORS.map((d) => (
              <tr key={d.code} style={{ borderTop: '1px solid #232836', fontSize: 13 }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{d.code}</td>
                <td style={{ padding: 10, color: '#B9C0CE' }}>{d.kind}</td>
                <td style={{ padding: 10, fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: 10, color: '#21E0DC' }}>{d.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FloatingChat
        contextLabel="SSoT Wiki"
        pillar="ssot"
        market={market}
        activeDocId={selectedDoc?.doc_id}
      />
    </div>
  );
}
