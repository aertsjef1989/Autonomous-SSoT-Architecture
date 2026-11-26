'use client';
import { useState } from 'react';
import { enforcePreDispatchGate, type Lane } from '@/lib/lane-guard';

const SYNTHETIC_ACCOUNTS = [
  {
    domain: 'vuurtoren-atelier.example',
    entity: 'Kapsalon Vuurtoren BV',
    country: 'BE',
    registryId: 'KBO 0123.456.789',
    stack: 'Lightspeed eCom + Meta Pixel',
    readiness: 8.6,
    lane: 'safe' as Lane,
    state: 'Post-discovery',
  },
  {
    domain: 'noordzee-fietsen.example',
    entity: 'Noordzee Rijwielen BV',
    country: 'NL',
    registryId: 'KvK 90012345',
    stack: 'Shopify + GTM Server-Side',
    readiness: 9.1,
    lane: 'safe' as Lane,
    state: 'Discovery-booked',
  },
  {
    domain: 'atelier-lumiere.example',
    entity: 'Atelier Lumiere SAS',
    country: 'FR',
    registryId: 'SIREN 801234567',
    stack: 'WooCommerce',
    readiness: 6.8,
    lane: 'safe' as Lane,
    state: 'Cold',
  },
];

const LIFECYCLE_STATES = [
  'Cold',
  'Auto-replied',
  'Agent-contacted',
  'Discovery-booked',
  'Post-discovery',
  'In-nurture',
  'Dormant',
] as const;

export default function BalaerionPage() {
  const [accounts, setAccounts] = useState(SYNTHETIC_ACCOUNTS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [testLane, setTestLane] = useState<Lane>('general');
  const [testPrompt, setTestPrompt] = useState('Draft an outreach checklist for VAT BE0123.456.789.');

  const active = accounts[selectedIdx];
  const provider = testLane === 'safe' ? 'scaleway-paris' : 'groq';
  const gateResult = enforcePreDispatchGate(testLane, provider, testPrompt);

  const updateLifecycle = (nextState: string) => {
    setAccounts((prev) =>
      prev.map((acc, idx) => (idx === selectedIdx ? { ...acc, state: nextState } : acc))
    );
  };

  const exportCsv = () => {
    const header = 'domain,entity,country,registry_id,stack,readiness_score,lane,lifecycle_state\n';
    const body = accounts
      .map((a) => `${a.domain},"${a.entity}",${a.country},"${a.registryId}","${a.stack}",${a.readiness},${a.lane},${a.state}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'balaerion_prospecthub_synthetic.csv';
    link.click();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>Pillar II: Balaerion AI Gateway & ProspectHub (Replay)</h1>
      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 780 }}>
        Config-driven multi-provider gateway separating EU safe-lane synthesis from general-lane ideation. All records below are cached synthetic calibration entities; zero live external OSINT calls run on the public build.
      </p>

      <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#21E0DC' }}>Interactive Pre-Dispatch PII & Lane Gate Tester</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => setTestLane('general')}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 8,
              border: testLane === 'general' ? '1px solid #21E0DC' : '1px solid #232836',
              background: testLane === 'general' ? '#21E0DC' : '#171B24',
              color: testLane === 'general' ? '#08090D' : '#B9C0CE',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Target Lane: general ({provider})
          </button>
          <button
            onClick={() => setTestLane('safe')}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 8,
              border: testLane === 'safe' ? '1px solid #21E0DC' : '1px solid #232836',
              background: testLane === 'safe' ? '#21E0DC' : '#171B24',
              color: testLane === 'safe' ? '#08090D' : '#B9C0CE',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Target Lane: eu / safe (scaleway-paris)
          </button>
          <button
            onClick={() => setTestPrompt('Write a generic SQL query for append-only audit tables.')}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid #232836',
              background: '#171B24',
              color: '#F2F5F9',
              cursor: 'pointer',
            }}
          >
            Load Clean Prompt
          </button>
          <button
            onClick={() => setTestPrompt('Summarize VAT BE0123.456.789 and IBAN BE68539007547034.')}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid #F0245C',
              background: '#171B24',
              color: '#F0245C',
              cursor: 'pointer',
            }}
          >
            Load Synthetic PII Prompt
          </button>
        </div>
        <input
          type="text"
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          aria-label="Test prompt for pre-dispatch gate"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            minHeight: 44,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #232836',
            background: '#08090D',
            color: '#F2F5F9',
            marginBottom: 10,
          }}
        />
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            borderLeft: gateResult.allowed ? '3px solid #21E0DC' : '3px solid #F0245C',
            background: gateResult.allowed ? 'rgba(33, 224, 220, 0.08)' : 'rgba(240, 36, 92, 0.12)',
            color: gateResult.allowed ? '#21E0DC' : '#FF5C86',
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          {gateResult.allowed
            ? `ALLOWED: Pre-dispatch gate passed for lane "${testLane}" (provider "${provider}").`
            : gateResult.reason}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: '#FFFFFF' }}>ProspectHub 7-State Synthetic Workspace</h2>
        <button
          onClick={exportCsv}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid #21E0DC',
            background: '#171B24',
            color: '#21E0DC',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export Synthetic Accounts CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 16 }}>
        <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', background: '#11141B' }}>
          <thead>
            <tr style={{ background: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Entity (Fictional)</th>
              <th style={{ padding: 10 }}>Country</th>
              <th style={{ padding: 10 }}>Registry Fixture</th>
              <th style={{ padding: 10 }}>Detected Stack</th>
              <th style={{ padding: 10 }}>Readiness</th>
              <th style={{ padding: 10 }}>State</th>
              <th style={{ padding: 10 }}>Select</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => (
              <tr key={acc.domain} style={{ borderTop: '1px solid #232836', fontSize: 13.5 }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{acc.entity}</td>
                <td style={{ padding: 10 }}>{acc.country}</td>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{acc.registryId}</td>
                <td style={{ padding: 10, color: '#B9C0CE' }}>{acc.stack}</td>
                <td style={{ padding: 10, color: '#21E0DC', fontWeight: 700 }}>{acc.readiness}/10</td>
                <td style={{ padding: 10 }}>{acc.state}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => setSelectedIdx(idx)}
                    style={{
                      padding: '8px 12px',
                      minHeight: 44,
                      borderRadius: 6,
                      border: selectedIdx === idx ? '1px solid #21E0DC' : '1px solid #232836',
                      background: selectedIdx === idx ? '#21E0DC' : '#171B24',
                      color: selectedIdx === idx ? '#08090D' : '#F2F5F9',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, color: '#B9C0CE', marginBottom: 10 }}>
          Human-in-the-Loop Lifecycle Transition for <strong style={{ color: '#FFFFFF' }}>{active.entity}</strong> (AI auto-transition hard-blocked):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LIFECYCLE_STATES.map((st) => (
            <button
              key={st}
              onClick={() => updateLifecycle(st)}
              style={{
                padding: '10px 12px',
                minHeight: 44,
                borderRadius: 6,
                border: active.state === st ? '1px solid #21E0DC' : '1px solid #232836',
                background: active.state === st ? 'rgba(33, 224, 220, 0.14)' : '#171B24',
                color: active.state === st ? '#21E0DC' : '#B9C0CE',
                fontWeight: active.state === st ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
