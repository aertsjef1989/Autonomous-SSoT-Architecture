'use client';
import { FloatingChat } from '@/components/FloatingChat';

const SIM_FIXTURES = [
  { match: 'Club Brugge vs Bayern Munich (Sim)', xgHome: 1.42, xgAway: 1.88, o15: 84, o25: 61, o35: 37, edge: '+4.2%' },
  { match: 'PSV vs Benfica (Sim)', xgHome: 1.75, xgAway: 1.31, o15: 81, o25: 57, o35: 33, edge: '+2.8%' },
  { match: 'Sporting CP vs Inter (Sim)', xgHome: 1.28, xgAway: 1.45, o15: 76, o25: 49, o35: 25, edge: '+1.5%' },
];

export default function SyndicatePage() {
  const exportCsv = () => {
    const header = 'match,xg_home,xg_away,over_1_5_pct,over_2_5_pct,over_3_5_pct,model_edge\n';
    const body = SIM_FIXTURES.map((f) => `"${f.match}",${f.xgHome},${f.xgAway},${f.o15},${f.o25},${f.o35},${f.edge}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_sim_bi_export.csv';
    a.click();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Pillar III: Syndicate Probability Simulator & NAV Prototype</h1>
      <p style={{ color: '#B9C0CE' }}>
        Simulation prototype only (synthetic fixtures, no live pooled money). Exports normalized tables for Power BI and Tableau.
      </p>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={exportCsv} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#171B24', color: '#21E0DC', border: '1px solid #21E0DC', cursor: 'pointer' }}>
          Export Simulation CSV (BI)
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#11141B', border: '1px solid #232836' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Fixture (Synthetic)</th>
              <th style={{ padding: '10px' }}>xG Home</th>
              <th style={{ padding: '10px' }}>xG Away</th>
              <th style={{ padding: '10px' }}>Over 1.5</th>
              <th style={{ padding: '10px' }}>Over 2.5</th>
              <th style={{ padding: '10px' }}>Over 3.5</th>
              <th style={{ padding: '10px' }}>Model Edge</th>
            </tr>
          </thead>
          <tbody>
            {SIM_FIXTURES.map((f) => (
              <tr key={f.match} style={{ borderTop: '1px solid #232836' }}>
                <td style={{ padding: '10px', fontWeight: 600 }}>{f.match}</td>
                <td style={{ padding: '10px' }}>{f.xgHome}</td>
                <td style={{ padding: '10px' }}>{f.xgAway}</td>
                <td style={{ padding: '10px', color: '#21E0DC' }}>{f.o15}%</td>
                <td style={{ padding: '10px', color: '#21E0DC' }}>{f.o25}%</td>
                <td style={{ padding: '10px' }}>{f.o35}%</td>
                <td style={{ padding: '10px', color: '#F0245C', fontWeight: 700 }}>{f.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FloatingChat contextLabel="Syndicate Simulator" />
    </div>
  );
}
