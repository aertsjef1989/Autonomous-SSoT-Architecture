'use client';
import { useState } from 'react';
import { FloatingChat } from '@/components/FloatingChat';

const REPLAY_DOCS = [
  { id: 'TTK_FMT_GLB_001', market: 'GLB', folder: '05_Formats_and_Tools', title: 'Shopify Pixel & Events API Integration', status: 'VERIFIED', updated: '2026-11-20' },
  { id: 'TTK_FMT_GLB_004', market: 'GLB', folder: '05_Formats_and_Tools', title: 'GTM Server-Side Conversions API Setup', status: 'VERIFIED', updated: '2026-11-18' },
  { id: 'TTK_TPL_GLB_001', market: 'NL/BE', folder: '06_Templates', title: 'Client Activation Plan (Advisory Framing)', status: 'VERIFIED', updated: '2026-11-22' },
  { id: 'TTK_TPL_GLB_003', market: 'FR', folder: '06_Templates', title: 'OSINT Prospect Brief & Readiness Rubric', status: 'REVIEW_DUE', updated: '2026-10-15' },
];

export default function SSoTPage() {
  const [market, setMarket] = useState('ALL');
  const rows = market === 'ALL' ? REPLAY_DOCS : REPLAY_DOCS.filter((d) => d.market === market);

  const exportCsv = () => {
    const header = 'id,market,folder,title,status,updated\n';
    const body = rows.map((r) => `${r.id},${r.market},${r.folder},"${r.title}",${r.status},${r.updated}`).join('\n');
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
    <div>
      <h1 style={{ marginTop: 0 }}>Pillar I: SSoT Wiki & Governance Console</h1>
      <p style={{ color: '#B9C0CE' }}>Replay corpus preview (live Supabase ingestion activates in P4).</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'GLB', 'NL/BE', 'FR'].map((m) => (
          <button key={m} onClick={() => setMarket(m)} style={{
            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
            backgroundColor: market === m ? '#21E0DC' : '#171B24',
            color: market === m ? '#08090D' : '#F2F5F9',
            border: '1px solid #232836', fontWeight: 600,
          }}>{m}</button>
        ))}
        <button onClick={exportCsv} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#171B24', color: '#21E0DC', border: '1px solid #21E0DC', cursor: 'pointer' }}>
          Export CSV (Power BI / Tableau)
        </button>
        <button onClick={exportJson} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#171B24', color: '#F2F5F9', border: '1px solid #232836', cursor: 'pointer' }}>
          Export JSON
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#11141B', border: '1px solid #232836' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Node ID</th>
              <th style={{ padding: '10px' }}>Market</th>
              <th style={{ padding: '10px' }}>Folder</th>
              <th style={{ padding: '10px' }}>Title</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #232836' }}>
                <td style={{ padding: '10px', color: '#21E0DC' }}>{r.id}</td>
                <td style={{ padding: '10px' }}>{r.market}</td>
                <td style={{ padding: '10px', color: '#B9C0CE' }}>{r.folder}</td>
                <td style={{ padding: '10px' }}>{r.title}</td>
                <td style={{ padding: '10px', color: r.status === 'VERIFIED' ? '#21E0DC' : '#F0245C' }}>{r.status}</td>
                <td style={{ padding: '10px', color: '#B9C0CE' }}>{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FloatingChat contextLabel="SSoT Wiki" />
    </div>
  );
}
