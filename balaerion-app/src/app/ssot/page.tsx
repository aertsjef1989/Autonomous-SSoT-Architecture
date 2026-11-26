'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FloatingChat } from '@/components/FloatingChat';

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

const REPLAY_DOCS: ReplayDocRow[] = [
  { doc_id: 'FMT_GLB_011', market: 'GLOBAL', category: 'Formats_and_Tools', title: 'Commerce Pixel & Server Events Integration', status: 'VERIFIED', updated_at: '2026-11-20' },
  { doc_id: 'FMT_GLB_004', market: 'GLOBAL', category: 'Formats_and_Tools', title: 'Server-Side Conversions API Setup Guide', status: 'VERIFIED', updated_at: '2026-11-18' },
  { doc_id: 'VRT_NL_006', market: 'NL', category: 'Verticals', title: 'NL Retail & Service Advisory Playbook (Province Scope)', status: 'VERIFIED', updated_at: '2026-11-22' },
  { doc_id: 'POL_BE_001', market: 'BE', category: 'Policies', title: 'Belgian Bilingual Attribution & Consent Checklist', status: 'VERIFIED', updated_at: '2026-11-19' },
  { doc_id: 'TPL_FR_003', market: 'FR', category: 'Templates', title: 'Synthetic Prospect Brief & Readiness Rubric', status: 'REVIEW_DUE', updated_at: '2026-10-15' },
];

const DETECTORS = [
  { code: 'SCN-01', kind: 'Scheduled (07:00)', name: 'Metadata Integrity Scanner', state: 'PASS (0 unowned)' },
  { code: 'SCN-02', kind: 'Scheduled (07:30)', name: 'Expected Run Meta-Auditor', state: 'PASS (14/14 runs)' },
  { code: 'SCN-03', kind: 'Scheduled (02:00)', name: 'Forward/Reverse State Reconciliation', state: 'PASS (0 divergent)' },
  { code: 'DET-01', kind: 'Event Trigger', name: 'Audit Log Write-Failure Halt (P1)', state: 'ARMED' },
  { code: 'DET-02', kind: 'Event Trigger', name: 'Mover Scope-Change Ownership Guard', state: 'ARMED' },
];

const MARKETS = ['ALL', 'GLOBAL', 'NL', 'BE', 'FR'] as const;
const CATEGORIES = ['ALL', 'Formats_and_Tools', 'Verticals', 'Policies', 'Templates'] as const;

export default function SSoTPage() {
  const [market, setMarket] = useState<(typeof MARKETS)[number]>('ALL');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ALL');
  const [searchQ, setSearchQ] = useState('');

  const [liveAuthorized, setLiveAuthorized] = useState(false);
  const [liveRole, setLiveRole] = useState<string>('');
  const [liveDocs, setLiveDocs] = useState<ReplayDocRow[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<FullSsotDoc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

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
    // Selecting NL, BE, or FR automatically displays GLOBAL + that market's documents (Section 2.C)
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

  const openDocument = async (row: ReplayDocRow) => {
    if (!showingLive) {
      setSelectedDoc({
        ...row,
        drive_file_id: 'synthetic-replay',
        content_md: `# ${row.doc_id}: ${row.title}\n\n* **Market Scope:** ${row.market} (inherits GLOBAL baseline)\n* **Category:** ${row.category}\n* **Status:** ${row.status}\n\nSynthetic Replay preview. Redeem a single-use grant on /redeem or unlock Owner session on /admin once Supabase is populated to view live Drive-synced SSoT Markdown.`,
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
          Pillar I: Autonomous SSoT Corpus &amp; Governance ({showingLive ? `Live Supabase · ${liveRole}` : 'Replay Mode'})
        </h1>
        {!liveAuthorized ? (
          <Link
            href="/redeem"
            style={{
              minHeight: 44,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #21E0DC',
              background: '#171B24',
              color: '#21E0DC',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Unlock Live Corpus (/redeem)
          </Link>
        ) : null}
      </div>

      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 820, marginTop: 4 }}>
        Standardized 100-seat Lean DMADV governance model across 3,000+ architectural nodes and 40+ markets. Selecting{' '}
        <strong>NL</strong>, <strong>BE</strong>, or <strong>FR</strong> automatically surfaces{' '}
        <strong>GLOBAL + market-specific</strong> playbooks, policies, verticals, and templates.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, margin: '18px 0' }}>
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#8B95A5', textTransform: 'uppercase' }}>Reference Model Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#21E0DC', marginTop: 4 }}>EUR 198k to 297k</div>
          <div style={{ fontSize: 12, color: '#8B95A5', marginTop: 4 }}>100 seats · 40% to 60% recovery</div>
        </div>
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#8B95A5', textTransform: 'uppercase' }}>Self-Healing Loop</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#21E0DC', marginTop: 4 }}>14 / 14 Active</div>
          <div style={{ fontSize: 12, color: '#8B95A5', marginTop: 4 }}>30 runs/mo (98% saved)</div>
        </div>
        <div style={{ background: '#11141B', border: '1px solid #F0245C', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#F0245C', textTransform: 'uppercase' }}>Market Inheritance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            {market === 'ALL' ? 'GLOBAL + NL/BE/FR' : market === 'GLOBAL' ? 'GLOBAL Only' : `GLOBAL + ${market}`}
          </div>
          <div style={{ fontSize: 12, color: '#B9C0CE', marginTop: 4 }}>{rows.length} documents matched</div>
        </div>
      </div>

      {/* Market Selector + Category Filter + Search + Exports */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
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
                    Read Markdown
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
              <span style={{ fontFamily: 'monospace', color: '#21E0DC', fontSize: 12.5 }}>{selectedDoc.doc_id}</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 18, color: '#FFFFFF' }}>{selectedDoc.title}</h2>
            </div>
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

      <FloatingChat contextLabel="SSoT Wiki" />
    </div>
  );
}
