'use client';
import { useState } from 'react';
import { FloatingChat } from '@/components/FloatingChat';

const SIM_FIXTURES = [
  { match: 'Galatasaray vs Aston Villa (Sim)', xgHome: 1.66, xgAway: 3.07, pHome: 18.4, pDraw: 15.6, pAway: 65.5, o25: 84.6, edge: '+4.8%' },
  { match: 'Arsenal vs Borussia Dortmund (Sim)', xgHome: 1.94, xgAway: 1.02, pHome: 58.2, pDraw: 23.1, pAway: 18.7, o25: 55.4, edge: '+3.1%' },
  { match: 'Club Brugge vs Liverpool (Sim)', xgHome: 1.52, xgAway: 2.14, pHome: 27.9, pDraw: 22.4, pAway: 49.7, o25: 71.2, edge: '+2.4%' },
  { match: 'Sporting CP vs Man United (Sim)', xgHome: 1.81, xgAway: 1.38, pHome: 47.6, pDraw: 24.8, pAway: 27.6, o25: 61.9, edge: '+1.9%' },
];

interface LedgerEntry {
  seq: number;
  kind: 'INIT' | 'MINT' | 'BURN' | 'SETTLE_SIM';
  actor: string;
  deltaCash: number;
  deltaUnits: number;
  navPerUnit: number;
  poolTotal: number;
  totalUnits: number;
}

export default function SyndicatePage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { seq: 1, kind: 'INIT', actor: 'Seeded Pool (4 Synthetic Members)', deltaCash: 400, deltaUnits: 400, navPerUnit: 1.0, poolTotal: 400, totalUnits: 400 },
    { seq: 2, kind: 'SETTLE_SIM', actor: 'MD4 Simulated Slip Settlement', deltaCash: 100, deltaUnits: 0, navPerUnit: 1.25, poolTotal: 500, totalUnits: 400 },
  ]);
  const [amount, setAmount] = useState('100');

  const latest = ledger[ledger.length - 1];

  const mintVirtualUnits = () => {
    const val = Math.max(10, Math.min(5000, Number(amount) || 0));
    const unitsMinted = +(val / latest.navPerUnit).toFixed(4);
    const poolTotal = +(latest.poolTotal + val).toFixed(2);
    const totalUnits = +(latest.totalUnits + unitsMinted).toFixed(4);
    setLedger((prev) => [
      ...prev,
      {
        seq: prev.length + 1,
        kind: 'MINT',
        actor: 'Synthetic Member Deposit',
        deltaCash: val,
        deltaUnits: unitsMinted,
        navPerUnit: +(poolTotal / totalUnits).toFixed(4),
        poolTotal,
        totalUnits,
      },
    ]);
  };

  const exportCsv = () => {
    const header = 'match,xg_home,xg_away,prob_home_pct,prob_draw_pct,prob_away_pct,over_2_5_pct,model_edge\n';
    const body = SIM_FIXTURES.map(
      (f) => `"${f.match}",${f.xgHome},${f.xgAway},${f.pHome},${f.pDraw},${f.pAway},${f.o25},${f.edge}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_sim_bi_export.csv';
    a.click();
  };

  const exportLedgerJson = () => {
    const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_nav_simulation_ledger.json';
    a.click();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>Pillar III: Syndicate Probability Simulator & NAV Ledger Prototype</h1>
      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 780 }}>
        Educational quantitative simulation and append-only unit-share accounting prototype only. Uses synthetic virtual units and seeded fixtures; no live pooled funds or real-money wagering exist anywhere in this system.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          onClick={exportCsv}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            backgroundColor: '#171B24',
            color: '#21E0DC',
            border: '1px solid #21E0DC',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export Simulation CSV (BI)
        </button>
        <button
          onClick={exportLedgerJson}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            backgroundColor: '#171B24',
            color: '#F2F5F9',
            border: '1px solid #232836',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export NAV Ledger JSON
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 24 }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', backgroundColor: '#11141B' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Seeded Fixture (Simulation)</th>
              <th style={{ padding: 10 }}>lambda Home</th>
              <th style={{ padding: 10 }}>lambda Away</th>
              <th style={{ padding: 10 }}>1 (Home)</th>
              <th style={{ padding: 10 }}>X (Draw)</th>
              <th style={{ padding: 10 }}>2 (Away)</th>
              <th style={{ padding: 10 }}>Over 2.5</th>
              <th style={{ padding: 10 }}>Sim Edge</th>
            </tr>
          </thead>
          <tbody>
            {SIM_FIXTURES.map((f) => (
              <tr key={f.match} style={{ borderTop: '1px solid #232836', fontSize: 13.5 }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{f.match}</td>
                <td style={{ padding: 10 }}>{f.xgHome}</td>
                <td style={{ padding: 10 }}>{f.xgAway}</td>
                <td style={{ padding: 10 }}>{f.pHome}%</td>
                <td style={{ padding: 10 }}>{f.pDraw}%</td>
                <td style={{ padding: 10 }}>{f.pAway}%</td>
                <td style={{ padding: 10, color: '#21E0DC' }}>{f.o25}%</td>
                <td style={{ padding: 10, color: '#F0245C', fontWeight: 700 }}>{f.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17, color: '#21E0DC' }}>
          Unit-Share NAV Mint Simulator (Zero Dilution Invariant)
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#B9C0CE' }}>
          Current Virtual Pool: <strong style={{ color: '#FFFFFF' }}>{latest.poolTotal} pts</strong> · Active Units:{' '}
          <strong style={{ color: '#FFFFFF' }}>{latest.totalUnits}</strong> · NAV / Unit:{' '}
          <strong style={{ color: '#21E0DC' }}>{latest.navPerUnit}</strong>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Virtual units deposit amount"
            style={{
              background: '#08090D',
              color: '#F2F5F9',
              border: '1px solid #232836',
              borderRadius: 8,
              padding: '10px 12px',
              minHeight: 44,
              fontSize: 16,
              width: 140,
            }}
          />
          <button
            onClick={mintVirtualUnits}
            style={{
              background: '#21E0DC',
              color: '#08090D',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              minHeight: 44,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Simulate Virtual Entry (Mint at Current NAV)
          </button>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8 }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Event</th>
                <th style={{ padding: 8 }}>Actor</th>
                <th style={{ padding: 8 }}>Delta Points</th>
                <th style={{ padding: 8 }}>Delta Units</th>
                <th style={{ padding: 8 }}>NAV / Unit</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.seq} style={{ borderTop: '1px solid #232836', fontSize: 13 }}>
                  <td style={{ padding: 8 }}>{row.seq}</td>
                  <td style={{ padding: 8, fontFamily: 'monospace', color: '#21E0DC' }}>{row.kind}</td>
                  <td style={{ padding: 8 }}>{row.actor}</td>
                  <td style={{ padding: 8 }}>+{row.deltaCash}</td>
                  <td style={{ padding: 8 }}>+{row.deltaUnits}</td>
                  <td style={{ padding: 8, fontWeight: 700 }}>{row.navPerUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingChat contextLabel="Syndicate Simulator" />
    </div>
  );
}
