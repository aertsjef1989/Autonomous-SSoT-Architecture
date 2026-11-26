'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingChat } from '@/components/FloatingChat';
import {
  buildPressDocumentFromContent,
  buildStudioDeckFromContent,
  saveHandoffToLocalStorage,
  savePressDocHandoffToLocalStorage,
} from '@/lib/signal-handoff';
import type { SyndicateFixtureRow } from '@/app/api/syndicate/live/route';

const INITIAL_FALLBACK_FIXTURES: SyndicateFixtureRow[] = [
  {
    id: 'sim-1',
    match: 'North Harbour FC (Sim) vs Midland Villa (Sim)',
    homeTeam: 'North Harbour FC (Sim)',
    awayTeam: 'Midland Villa (Sim)',
    kickoffUtc: '2026-11-26T20:00:00Z',
    xgHome: 1.66,
    xgAway: 2.38,
    pHome: 25.1,
    pDraw: 20.4,
    pAway: 54.5,
    o25: 73.8,
    btts: 66.2,
    fairHomeOdds: 3.98,
    marketHomeOdds: 4.15,
    edgePct: 1.0,
    quarterKellyPct: 0.32,
    topScorelines: [
      { score: '1-2', pct: 10.1 },
      { score: '1-1', pct: 8.5 },
      { score: '2-2', pct: 8.4 },
      { score: '1-3', pct: 8.0 },
    ],
  },
  {
    id: 'sim-2',
    match: 'Thames Athletic (Sim) vs Ruhr Valley BV (Sim)',
    homeTeam: 'Thames Athletic (Sim)',
    awayTeam: 'Ruhr Valley BV (Sim)',
    kickoffUtc: '2026-11-26T20:00:00Z',
    xgHome: 1.94,
    xgAway: 1.02,
    pHome: 58.2,
    pDraw: 23.1,
    pAway: 18.7,
    o25: 55.4,
    btts: 48.9,
    fairHomeOdds: 1.72,
    marketHomeOdds: 1.82,
    edgePct: 3.25,
    quarterKellyPct: 1.98,
    topScorelines: [
      { score: '2-1', pct: 10.0 },
      { score: '1-0', pct: 10.0 },
      { score: '2-0', pct: 9.7 },
      { score: '1-1', pct: 10.2 },
    ],
  },
  {
    id: 'sim-3',
    match: 'Flanders Bruges XI (Sim) vs Mersey Red FC (Sim)',
    homeTeam: 'Flanders Bruges XI (Sim)',
    awayTeam: 'Mersey Red FC (Sim)',
    kickoffUtc: '2026-11-27T20:00:00Z',
    xgHome: 1.52,
    xgAway: 2.14,
    pHome: 27.9,
    pDraw: 22.4,
    pAway: 49.7,
    o25: 68.4,
    btts: 61.5,
    fairHomeOdds: 3.58,
    marketHomeOdds: 3.85,
    edgePct: 1.93,
    quarterKellyPct: 0.68,
    topScorelines: [
      { score: '1-2', pct: 10.3 },
      { score: '1-1', pct: 9.6 },
      { score: '2-2', pct: 7.8 },
      { score: '0-2', pct: 6.8 },
    ],
  },
];

interface LedgerEntry {
  seq: number;
  kind: 'INIT' | 'MINT' | 'BURN' | 'SETTLE_SLIP';
  actor: string;
  deltaCash: number;
  deltaUnits: number;
  navPerUnit: number;
  poolTotal: number;
  totalUnits: number;
}

const QUANT_PROVIDERS: Array<{ id: string; label: string; lane: 'safe' | 'general' }> = [
  { id: 'nvidia-nim', label: 'NVIDIA NIM Qwen 3 235B (General)', lane: 'general' },
  { id: 'groq', label: 'Groq Llama 3.3 70B (General)', lane: 'general' },
  { id: 'cerebras', label: 'Cerebras Qwen 3 32B (General)', lane: 'general' },
  { id: 'gemini', label: 'Gemini 2.5 Flash (General)', lane: 'general' },
  { id: 'mistral', label: 'Mistral EU (Safe Lane)', lane: 'safe' },
  { id: 'codestral', label: 'Codestral EU (Safe Lane)', lane: 'safe' },
  { id: 'openrouter-free', label: 'OpenRouter :free Pool (General)', lane: 'general' },
  { id: 'fireworks', label: 'Fireworks DeepSeek V3 (General)', lane: 'general' },
];

export default function SyndicatePage() {
  const router = useRouter();
  const [feedStatus, setFeedStatus] = useState<'LIVE' | 'FALLBACK'>('FALLBACK');
  const [oddsStatus, setOddsStatus] = useState<string>('MODEL_BENCHMARK');
  const [competition, setCompetition] = useState<string>('European League Phase (Deterministic Simulation Fallback)');
  const [fixtures, setFixtures] = useState<SyndicateFixtureRow[]>(INITIAL_FALLBACK_FIXTURES);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { seq: 1, kind: 'INIT', actor: 'Seeded Pool (4 Members)', deltaCash: 400, deltaUnits: 400, navPerUnit: 1.0, poolTotal: 400, totalUnits: 400 },
    { seq: 2, kind: 'SETTLE_SLIP', actor: 'Matchday Slip Settlement (+25%)', deltaCash: 100, deltaUnits: 0, navPerUnit: 1.25, poolTotal: 500, totalUnits: 400 },
  ]);
  const [amount, setAmount] = useState('100');

  const [quantProvider, setQuantProvider] = useState('nvidia-nim');
  const [quantInput, setQuantInput] = useState('');
  const [quantBusy, setQuantBusy] = useState(false);
  const [quantTurns, setQuantTurns] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; provider?: string | null; replay?: boolean; blocked?: boolean }>
  >([]);

  const loadFeed = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/syndicate/live', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.fixtures) && data.fixtures.length > 0) {
          setFixtures(data.fixtures);
          setFeedStatus(data.feedStatus === 'LIVE' ? 'LIVE' : 'FALLBACK');
          setOddsStatus(data.oddsStatus || 'MODEL_BENCHMARK');
          setCompetition(data.competition || 'UEFA Champions League');
          setSelectedIdx(0);
        }
      }
    } catch {
      /* keep deterministic fallback */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const latest = ledger[ledger.length - 1];
  const selectedFixture = fixtures[selectedIdx] ?? fixtures[0];

  const syndicateContextText = useMemo(() => {
    const fLines = fixtures
      .map(
        (f) =>
          `${f.match} | xG ${f.xgHome}-${f.xgAway} | 1X2=${f.pHome}%/${f.pDraw}%/${f.pAway}% | O2.5=${f.o25}% | BTTS=${f.btts}% | Fair1=${f.fairHomeOdds} vs Mkt1=${f.marketHomeOdds} | Edge=${f.edgePct}% | QuarterKelly=${f.quarterKellyPct}%`
      )
      .join('\n');
    return `Feed=${feedStatus} (${competition}) | Pool=${latest.poolTotal} pts | Units=${latest.totalUnits} | NAV/Unit=${latest.navPerUnit}\nFixtures:\n${fLines}`;
  }, [fixtures, feedStatus, competition, latest]);

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
        actor: 'Member Subscription at Current NAV',
        deltaCash: val,
        deltaUnits: unitsMinted,
        navPerUnit: +(poolTotal / totalUnits).toFixed(4),
        poolTotal,
        totalUnits,
      },
    ]);
  };

  const burnVirtualUnits = () => {
    const val = Math.max(10, Math.min(latest.poolTotal * 0.5, Number(amount) || 0));
    if (latest.poolTotal - val < 50) return;
    const unitsBurned = +(val / latest.navPerUnit).toFixed(4);
    const poolTotal = +(latest.poolTotal - val).toFixed(2);
    const totalUnits = Math.max(1, +(latest.totalUnits - unitsBurned).toFixed(4));
    setLedger((prev) => [
      ...prev,
      {
        seq: prev.length + 1,
        kind: 'BURN',
        actor: 'Member Redemption at Current NAV',
        deltaCash: -val,
        deltaUnits: -unitsBurned,
        navPerUnit: +(poolTotal / totalUnits).toFixed(4),
        poolTotal,
        totalUnits,
      },
    ]);
  };

  const sendQuantChat = async (overridePrompt?: string) => {
    const q = (overridePrompt ?? quantInput).trim();
    if (!q || quantBusy) return;
    if (!overridePrompt) setQuantInput('');
    const prov = QUANT_PROVIDERS.find((p) => p.id === quantProvider) ?? QUANT_PROVIDERS[0];
    const history = quantTurns
      .filter((t) => !t.blocked)
      .slice(-6)
      .map((t) => ({ role: t.role, content: t.text }));

    setQuantTurns((prev) => [...prev, { role: 'user', text: q }]);
    setQuantBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lane: prov.lane,
          provider: prov.id,
          mode: 'syndicate_quant',
          pillar: 'syndicate',
          syndicateContext: syndicateContextText,
          history,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setQuantTurns((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setQuantTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || data.error || 'Syndicate quantitative summary served.',
            provider: data.provider || null,
            replay: Boolean(data.replay),
          },
        ]);
      }
    } catch {
      setQuantTurns((prev) => [
        ...prev,
        { role: 'assistant', text: '[Offline Replay] Network unavailable; local Poisson calculator remains active.', replay: true },
      ]);
    } finally {
      setQuantBusy(false);
    }
  };

  const handoffMatchdayToStudio = (title: string, bodyText: string) => {
    const deck = buildStudioDeckFromContent({
      title,
      content: bodyText,
      market: 'UCL',
      eyebrowPrefix: 'SYNDICATE QUANT',
      defaultHeroId: 'H06',
    });
    if (saveHandoffToLocalStorage(deck).ok) {
      router.push('/studio');
    }
  };

  const handoffMatchdayToPress = (title: string, bodyText: string) => {
    const doc = buildPressDocumentFromContent({
      title,
      content: bodyText,
      market: 'GLOBAL',
      docType: 'research_brief',
      sourceLabel: `Syndicate ${feedStatus} Feed (${competition})`,
      sourceRef: `NAV ${latest.navPerUnit}`,
    });
    if (savePressDocHandoffToLocalStorage(doc).ok) {
      router.push('/press');
    }
  };

  const exportCsv = () => {
    const header = 'match,xg_home,xg_away,prob_home_pct,prob_draw_pct,prob_away_pct,over_2_5_pct,btts_pct,edge_pct,quarter_kelly_pct\n';
    const body = fixtures
      .map(
        (f) =>
          `"${f.match}",${f.xgHome},${f.xgAway},${f.pHome},${f.pDraw},${f.pAway},${f.o25},${f.btts},${f.edgePct}%,${f.quarterKellyPct}%`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_matchday_export.csv';
    a.click();
  };

  const exportLedgerJson = () => {
    const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_nav_ledger.json';
    a.click();
  };

  const selectedBriefMarkdown = selectedFixture
    ? `## ${selectedFixture.match}\n\n- Competition: ${competition}\n- Expected Goals (lambda): Home ${selectedFixture.xgHome} vs Away ${selectedFixture.xgAway}\n- 1X2 Fair Probabilities: Home ${selectedFixture.pHome}% | Draw ${selectedFixture.pDraw}% | Away ${selectedFixture.pAway}%\n- Totals: Over 2.5 Goals ${selectedFixture.o25}% | BTTS ${selectedFixture.btts}%\n- Fair Home Odds ${selectedFixture.fairHomeOdds} vs Market ${selectedFixture.marketHomeOdds} (Edge ${selectedFixture.edgePct >= 0 ? '+' : ''}${selectedFixture.edgePct}%)\n- Quarter-Kelly Allocation Cap: ${selectedFixture.quarterKellyPct}% of Virtual Pool (${latest.poolTotal} pts at NAV ${latest.navPerUnit})`
    : '';

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>
          Pillar III: Syndicate Matchday Poisson Engine &amp; Unit-Share NAV Ledger
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: feedStatus === 'LIVE' ? 'rgba(33, 224, 220, 0.16)' : '#171B24',
              border: `1px solid ${feedStatus === 'LIVE' ? '#21E0DC' : '#2D3446'}`,
              color: feedStatus === 'LIVE' ? '#21E0DC' : '#B9C0CE',
            }}
          >
            Feed: {feedStatus} · Odds: {oddsStatus}
          </span>
          <button
            type="button"
            disabled={refreshing}
            onClick={loadFeed}
            style={{
              minHeight: 44,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #21E0DC',
              background: '#171B24',
              color: '#21E0DC',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 820, marginTop: 4 }}>
        Quantitative bivariate Poisson matchday engine wired to <code>football-data.org</code> v4 and optional{' '}
        <code>the-odds-api.com</code> market lines (with automatic deterministic fallback when keys are unset). Accounting uses virtual units only with strict Quarter-Kelly 5% exposure caps.
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
          Export Matchday CSV (BI)
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
        {selectedFixture ? (
          <>
            <button
              type="button"
              onClick={() => handoffMatchdayToStudio(`Matchday Brief: ${selectedFixture.match}`, selectedBriefMarkdown)}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                backgroundColor: '#21E0DC',
                color: '#08090D',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              -&gt; Signal Studio (16:9)
            </button>
            <button
              type="button"
              onClick={() => handoffMatchdayToPress(`Matchday Brief: ${selectedFixture.match}`, selectedBriefMarkdown)}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                backgroundColor: '#F0245C',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              -&gt; Signal Press (A4)
            </button>
          </>
        ) : null}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 18 }}>
        <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', backgroundColor: '#11141B' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Fixture ({competition})</th>
              <th style={{ padding: 10 }}>lambda H / A</th>
              <th style={{ padding: 10 }}>1 / X / 2</th>
              <th style={{ padding: 10 }}>Over 2.5</th>
              <th style={{ padding: 10 }}>BTTS</th>
              <th style={{ padding: 10 }}>Edge</th>
              <th style={{ padding: 10 }}>1/4 Kelly</th>
              <th style={{ padding: 10 }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((f, idx) => (
              <tr
                key={f.id}
                style={{
                  borderTop: '1px solid #232836',
                  fontSize: 13.5,
                  backgroundColor: idx === selectedIdx ? 'rgba(33, 224, 220, 0.06)' : 'transparent',
                }}
              >
                <td style={{ padding: 10, fontWeight: 600 }}>{f.match}</td>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>
                  {f.xgHome} / {f.xgAway}
                </td>
                <td style={{ padding: 10 }}>
                  {f.pHome}% / {f.pDraw}% / {f.pAway}%
                </td>
                <td style={{ padding: 10, color: '#21E0DC' }}>{f.o25}%</td>
                <td style={{ padding: 10 }}>{f.btts}%</td>
                <td style={{ padding: 10, color: f.edgePct > 0 ? '#21E0DC' : '#B9C0CE', fontWeight: 700 }}>
                  {f.edgePct >= 0 ? `+${f.edgePct}%` : `${f.edgePct}%`}
                </td>
                <td style={{ padding: 10, color: '#FF5C86', fontWeight: 700 }}>{f.quarterKellyPct}%</td>
                <td style={{ padding: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    style={{
                      minHeight: 40,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: idx === selectedIdx ? '1px solid #21E0DC' : '1px solid #232836',
                      background: idx === selectedIdx ? '#21E0DC' : '#171B24',
                      color: idx === selectedIdx ? '#08090D' : '#F2F5F9',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Matrix
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedFixture ? (
        <section
          style={{
            background: '#11141B',
            border: '1px solid #232836',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#21E0DC', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            SELECTED MATCHDAY POISSON SCORELINE TOPOLOGY
          </div>
          <h2 style={{ margin: '4px 0 10px', fontSize: 17, color: '#FFFFFF' }}>{selectedFixture.match}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10 }}>
            {selectedFixture.topScorelines.map((sc) => (
              <div
                key={sc.score}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#171B24',
                  border: '1px solid #232836',
                }}
              >
                <div style={{ fontSize: 11, color: '#8B95A5' }}>Exact Scoreline</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>{sc.score}</div>
                <div style={{ fontSize: 13, color: '#21E0DC', fontWeight: 600 }}>{sc.pct}% Poisson mass</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Conversational Syndicate Quant Assistant */}
      <section
        aria-label="Conversational Syndicate Assistant"
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
              CONVERSATIONAL SYNDICATE QUANT ASSISTANT
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 17, color: '#FFFFFF' }}>
              Chat with Matchday Fixtures, Poisson Edges &amp; Pool NAV
            </h2>
          </div>
          <select
            aria-label="Select Syndicate LLM Provider"
            value={quantProvider}
            onChange={(e) => setQuantProvider(e.target.value)}
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
            {QUANT_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Rank Positive Edges', prompt: 'Rank the active matchday fixtures by positive Poisson edge and Quarter-Kelly sizing.' },
            { label: 'Over 2.5 & BTTS Screen', prompt: 'Which active fixtures have the strongest Over 2.5 and BTTS Poisson probabilities?' },
            { label: 'Audit NAV Dilution', prompt: 'Verify our current Pool NAV per unit and explain why new deposits cause zero dilution.' },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => sendQuantChat(b.prompt)}
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
              {b.label}
            </button>
          ))}
        </div>

        {quantTurns.length > 0 ? (
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 10,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #232836',
              marginBottom: 10,
            }}
          >
            {quantTurns.map((t, i) => (
              <div
                key={i}
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
                  {t.role === 'user' ? 'You' : `Syndicate Quant · ${t.replay ? 'Replay' : t.provider || 'Live'}`}
                </div>
                <div>{t.text}</div>
                {t.role === 'assistant' && !t.blocked ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handoffMatchdayToStudio('Syndicate Quant Memo', t.text)}
                      style={{
                        minHeight: 38,
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #21E0DC',
                        background: '#171B24',
                        color: '#21E0DC',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      -&gt; Signal Studio (16:9)
                    </button>
                    <button
                      type="button"
                      onClick={() => handoffMatchdayToPress('Syndicate Quant Memo', t.text)}
                      style={{
                        minHeight: 38,
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #F0245C',
                        background: '#171B24',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      -&gt; Signal Press (A4)
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
            aria-label="Ask Syndicate Quant Assistant"
            value={quantInput}
            onChange={(e) => setQuantInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendQuantChat()}
            placeholder="Ask about fixture xG edges, Quarter-Kelly caps, or NAV state..."
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
            disabled={quantBusy}
            onClick={() => sendQuantChat()}
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
            {quantBusy ? 'Analyzing...' : 'Ask Syndicate'}
          </button>
        </div>
      </section>

      {/* Unit-Share NAV Ledger */}
      <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17, color: '#21E0DC' }}>
          Unit-Share NAV Mint &amp; Burn Ledger (Zero Dilution Invariant)
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
            aria-label="Virtual units deposit or redemption amount"
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
            Mint Entry (Subscribe at NAV)
          </button>
          <button
            onClick={burnVirtualUnits}
            style={{
              background: '#171B24',
              color: '#FF5C86',
              border: '1px solid #F0245C',
              borderRadius: 8,
              padding: '10px 16px',
              minHeight: 44,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Burn Exit (Redeem at NAV)
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
                  <td style={{ padding: 8 }}>{row.deltaCash >= 0 ? `+${row.deltaCash}` : row.deltaCash}</td>
                  <td style={{ padding: 8 }}>{row.deltaUnits >= 0 ? `+${row.deltaUnits}` : row.deltaUnits}</td>
                  <td style={{ padding: 8, fontWeight: 700 }}>{row.navPerUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingChat
        contextLabel="Syndicate Quant"
        pillar="syndicate"
        syndicateContext={syndicateContextText}
      />
    </div>
  );
}
