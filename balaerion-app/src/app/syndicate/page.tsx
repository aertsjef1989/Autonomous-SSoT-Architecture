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
import {
  computeDixonColesFixture,
  computeShinDevig,
  runCalibrationBacktest,
  runMonteCarloBankrollSimulation,
  type SyndicateFixtureQuant,
} from '@/lib/syndicate/quant';

const INITIAL_FALLBACK_FIXTURES: SyndicateFixtureQuant[] = [
  computeDixonColesFixture({
    id: 'sim-1',
    homeTeam: 'North Harbour FC (Sim)',
    awayTeam: 'Midland Villa (Sim)',
    kickoffUtc: '2026-11-26T20:00:00Z',
    xgHome: 1.66,
    xgAway: 2.38,
    rho: -0.11,
    marketHomeOddsOverride: 4.15,
    marketDrawOddsOverride: 4.45,
    marketAwayOddsOverride: 1.74,
  }),
  computeDixonColesFixture({
    id: 'sim-2',
    homeTeam: 'Thames Athletic (Sim)',
    awayTeam: 'Ruhr Valley BV (Sim)',
    kickoffUtc: '2026-11-26T20:00:00Z',
    xgHome: 1.94,
    xgAway: 1.02,
    rho: -0.11,
    marketHomeOddsOverride: 1.82,
    marketDrawOddsOverride: 3.9,
    marketAwayOddsOverride: 4.4,
  }),
  computeDixonColesFixture({
    id: 'sim-3',
    homeTeam: 'Flanders Bruges XI (Sim)',
    awayTeam: 'Mersey Red FC (Sim)',
    kickoffUtc: '2026-11-27T20:00:00Z',
    xgHome: 1.52,
    xgAway: 2.14,
    rho: -0.11,
    marketHomeOddsOverride: 3.85,
    marketDrawOddsOverride: 4.05,
    marketAwayOddsOverride: 1.86,
  }),
  computeDixonColesFixture({
    id: 'sim-4',
    homeTeam: 'Tagus Verde CP (Sim)',
    awayTeam: 'Lancaster United (Sim)',
    kickoffUtc: '2026-11-27T20:00:00Z',
    xgHome: 1.81,
    xgAway: 1.38,
    rho: -0.11,
    marketHomeOddsOverride: 2.24,
    marketDrawOddsOverride: 3.6,
    marketAwayOddsOverride: 3.1,
  }),
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
  const [competition, setCompetition] = useState<string>('European League Phase (Deterministic Dixon-Coles Fallback)');
  const [rawFixtures, setRawFixtures] = useState<SyndicateFixtureQuant[]>(INITIAL_FALLBACK_FIXTURES);
  const [selectedIdx, setSelectedIdx] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Dixon-Coles low-score correlation parameter & Monte Carlo stress controls
  const [rho, setRho] = useState<number>(-0.11);
  const [mcHorizonBets, setMcHorizonBets] = useState<number>(80);

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
      const res = await fetch(`/api/syndicate/live?rho=${encodeURIComponent(String(rho))}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.fixtures) && data.fixtures.length > 0) {
          setRawFixtures(data.fixtures);
          setFeedStatus(data.feedStatus === 'LIVE' ? 'LIVE' : 'FALLBACK');
          setOddsStatus(data.oddsStatus || 'MODEL_BENCHMARK');
          setCompetition(data.competition || 'UEFA Champions League');
        }
      }
    } catch {
      /* keep deterministic fallback */
    } finally {
      setRefreshing(false);
    }
  }, [rho]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Recompute Dixon-Coles instantaneously in browser as rho slider moves
  const fixtures = useMemo(
    () =>
      rawFixtures.map((f) =>
        computeDixonColesFixture({
          id: f.id,
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          kickoffUtc: f.kickoffUtc,
          xgHome: f.xgHome,
          xgAway: f.xgAway,
          rho,
          marketHomeOddsOverride: f.marketHomeOdds,
          marketDrawOddsOverride: f.marketDrawOdds,
          marketAwayOddsOverride: f.marketAwayOdds,
        })
      ),
    [rawFixtures, rho]
  );

  const latest = ledger[ledger.length - 1];
  const selectedFixture = fixtures[selectedIdx] ?? fixtures[0];

  const shinBreakdown = useMemo(
    () =>
      selectedFixture
        ? computeShinDevig(
            selectedFixture.marketHomeOdds,
            selectedFixture.marketDrawOdds,
            selectedFixture.marketAwayOdds
          )
        : null,
    [selectedFixture]
  );

  const calibration = useMemo(() => runCalibrationBacktest(rho), [rho]);

  const monteCarloRegimes = useMemo(
    () =>
      selectedFixture
        ? runMonteCarloBankrollSimulation({
            winProbPct: selectedFixture.pHome,
            decimalOdds: selectedFixture.marketHomeOdds,
            horizonBets: mcHorizonBets,
            paths: 1000,
            startNav: latest.navPerUnit,
          })
        : [],
    [selectedFixture, mcHorizonBets, latest.navPerUnit]
  );

  const syndicateContextText = useMemo(() => {
    const fLines = fixtures
      .map(
        (f) =>
          `${f.match} | xG ${f.xgHome}-${f.xgAway} (rho=${f.rho}) | 1X2=${f.pHome}%/${f.pDraw}%/${f.pAway}% | O2.5=${f.o25}% | BTTS=${f.btts}% | Fair1=${f.fairHomeOdds} vs Mkt1=${f.marketHomeOdds} (Overround=${f.overroundPct}%) | ShinEdge=${f.shinEdgePct}% | QuarterKelly=${f.quarterKellyPct}%`
      )
      .join('\n');
    return `Feed=${feedStatus} (${competition}) | DixonColes_rho=${rho} | Brier=${calibration.dixonColesBrier} vs Indep=${calibration.independentPoissonBrier} | MeanCLV=+${calibration.meanClvPct}% | Pool=${latest.poolTotal} pts | NAV/Unit=${latest.navPerUnit}\nFixtures:\n${fLines}`;
  }, [fixtures, feedStatus, competition, rho, calibration, latest]);

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
        { role: 'assistant', text: '[Offline Replay] Network unavailable; local Dixon-Coles & Shin calculator remains active.', replay: true },
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
    const header =
      'match,xg_home,xg_away,rho,prob_home_pct,prob_draw_pct,prob_away_pct,over_2_5_pct,btts_pct,overround_pct,shin_edge_pct,quarter_kelly_pct\n';
    const body = fixtures
      .map(
        (f) =>
          `"${f.match}",${f.xgHome},${f.xgAway},${f.rho},${f.pHome},${f.pDraw},${f.pAway},${f.o25},${f.btts},${f.overroundPct}%,${f.shinEdgePct}%,${f.quarterKellyPct}%`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'syndicate_matchday_quant_export.csv';
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
    ? `## ${selectedFixture.match}\n\n- Competition: ${competition}\n- Expected Goals (lambda): Home ${selectedFixture.xgHome} vs Away ${selectedFixture.xgAway} (Dixon-Coles rho = ${selectedFixture.rho})\n- 1X2 Probabilities: Home ${selectedFixture.pHome}% | Draw ${selectedFixture.pDraw}% (vs ${selectedFixture.indepDrawPct}% naive Poisson) | Away ${selectedFixture.pAway}%\n- Totals: Over 2.5 Goals ${selectedFixture.o25}% | BTTS ${selectedFixture.btts}%\n- Bookmaker Overround: ${selectedFixture.overroundPct}% | Shin De-Vigged Home Market Prob: ${selectedFixture.shinHomeProbPct}% | Shin True Edge: ${selectedFixture.shinEdgePct >= 0 ? '+' : ''}${selectedFixture.shinEdgePct}%\n- Calibration Backtest (N=${calibration.sampleSize}): Dixon-Coles Brier ${calibration.dixonColesBrier} (vs Naive ${calibration.independentPoissonBrier}) · Mean CLV +${calibration.meanClvPct}%\n- Quarter-Kelly Allocation Cap: ${selectedFixture.quarterKellyPct}% of Virtual Pool (${latest.poolTotal} pts at NAV ${latest.navPerUnit})`
    : '';

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>
          Pillar III: Syndicate Dixon-Coles Quant Engine, Shin De-Vigging &amp; NAV Ledger
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

      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 860, marginTop: 4 }}>
        Quantitative matchday engine combining <strong>Dixon-Coles (1997) low-score correlation</strong>,{' '}
        <strong>Shin (1993) insider overround de-vigging</strong>, <strong>Brier / Log-Loss calibration</strong>, and{' '}
        <strong>1,000-path Monte Carlo drawdown stress testing</strong> over non-monetary virtual units.
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

      {/* Dixon-Coles Low-Score Correlation Slider */}
      <div
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>
            Dixon-Coles Low-Score Correlation Parameter (<code>rho = {rho.toFixed(2)}</code>)
          </div>
          <div style={{ fontSize: 12, color: '#8B95A5' }}>
            Adjusts (0-0, 1-0, 0-1, 1-1) joint density. Set <code>rho = 0.00</code> for naive independent Poisson;{' '}
            <code>rho = -0.11</code> reflects empirical European club draw clustering.
          </div>
        </div>
        <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            aria-label="Dixon-Coles rho parameter"
            min={-0.2}
            max={0.08}
            step={0.01}
            value={rho}
            onChange={(e) => setRho(Number(e.target.value))}
            style={{ width: '100%', minHeight: 44, accentColor: '#21E0DC' }}
          />
          <button
            type="button"
            onClick={() => setRho(-0.11)}
            style={{
              minHeight: 40,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #232836',
              background: '#171B24',
              color: '#B9C0CE',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 18 }}>
        <table style={{ width: '100%', minWidth: 740, borderCollapse: 'collapse', backgroundColor: '#11141B' }}>
          <thead>
            <tr style={{ backgroundColor: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
              <th style={{ padding: 10 }}>Fixture ({competition})</th>
              <th style={{ padding: 10 }}>lambda H / A</th>
              <th style={{ padding: 10 }}>1 / X / 2 (DC)</th>
              <th style={{ padding: 10 }}>Over 2.5</th>
              <th style={{ padding: 10 }}>Vig %</th>
              <th style={{ padding: 10 }}>Shin Edge</th>
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
                <td style={{ padding: 10, color: '#8B95A5' }}>{f.overroundPct}%</td>
                <td style={{ padding: 10, color: f.shinEdgePct > 0 ? '#21E0DC' : '#B9C0CE', fontWeight: 700 }}>
                  {f.shinEdgePct >= 0 ? `+${f.shinEdgePct}%` : `${f.shinEdgePct}%`}
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

      {selectedFixture && shinBreakdown ? (
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
            DIXON-COLES SCORELINE TOPOLOGY &amp; SHIN (1993) OVERROUND DE-VIGGING
          </div>
          <h2 style={{ margin: '4px 0 10px', fontSize: 17, color: '#FFFFFF' }}>{selectedFixture.match}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginBottom: 14 }}>
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
                <div style={{ fontSize: 13, color: '#21E0DC', fontWeight: 600 }}>{sc.pct}% DC mass</div>
              </div>
            ))}
            <div style={{ padding: '10px 12px', borderRadius: 8, background: '#171B24', border: '1px solid #232836' }}>
              <div style={{ fontSize: 11, color: '#8B95A5' }}>Draw Shift (DC vs Naive)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                {selectedFixture.pDraw}% vs {selectedFixture.indepDrawPct}%
              </div>
              <div style={{ fontSize: 12, color: '#21E0DC' }}>
                {(selectedFixture.pDraw - selectedFixture.indepDrawPct >= 0 ? '+' : '') +
                  (selectedFixture.pDraw - selectedFixture.indepDrawPct).toFixed(1)}
                % low-score corr
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#08090D', border: '1px solid #232836', fontSize: 13 }}>
              <div style={{ color: '#8B95A5', fontSize: 11.5 }}>3-Way Market Line &amp; Vig</div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>
                1: {selectedFixture.marketHomeOdds} · X: {selectedFixture.marketDrawOdds} · 2:{' '}
                {selectedFixture.marketAwayOdds}
              </div>
              <div style={{ color: '#21E0DC', fontSize: 12, marginTop: 2 }}>
                Overround: {shinBreakdown.overroundPct}% · Shin Insider z = {shinBreakdown.insiderZ}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#08090D', border: '1px solid #232836', fontSize: 13 }}>
              <div style={{ color: '#8B95A5', fontSize: 11.5 }}>Multiplicative vs Shin De-Vigged (1/X/2)</div>
              <div style={{ color: '#B9C0CE', marginTop: 3 }}>
                Mult: {shinBreakdown.multHomePct}% / {shinBreakdown.multDrawPct}% / {shinBreakdown.multAwayPct}%
              </div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 2 }}>
                Shin: {shinBreakdown.shinHomePct}% / {shinBreakdown.shinDrawPct}% / {shinBreakdown.shinAwayPct}%
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#08090D', border: '1px solid #232836', fontSize: 13 }}>
              <div style={{ color: '#8B95A5', fontSize: 11.5 }}>Proper Scoring Calibration (N={calibration.sampleSize})</div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>
                Brier: {calibration.dixonColesBrier} (vs Naive {calibration.independentPoissonBrier})
              </div>
              <div style={{ color: '#21E0DC', fontSize: 12, marginTop: 2 }}>
                Log-Loss: {calibration.dixonColesLogLoss} · Mean CLV: +{calibration.meanClvPct}% ({calibration.qualifyingBetsCount} qual)
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 1,000-Path Seeded Monte Carlo Staking & Drawdown Stress Simulator */}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#21E0DC', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                1,000-PATH MONTE CARLO DRAWDOWN STRESS SIMULATOR
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: 17, color: '#FFFFFF' }}>
                Why Quarter-Kelly (5% Cap) Dominates Uncapped Kelly Over {mcHorizonBets} Selections
              </h2>
            </div>
            <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', alignItems: 'center', gap: 8 }}>
              Horizon (Selections):
              <select
                aria-label="Monte Carlo Horizon Selections"
                value={mcHorizonBets}
                onChange={(e) => setMcHorizonBets(Number(e.target.value))}
                style={{
                  minHeight: 40,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                }}
              >
                <option value={40}>40 Selections</option>
                <option value={80}>80 Selections</option>
                <option value={150}>150 Selections</option>
              </select>
            </label>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#8B95A5' }}>
            Simulated on selected fixture edge profile (<code>p = {selectedFixture.pHome}%</code>, decimal odds{' '}
            <code>{selectedFixture.marketHomeOdds}</code>, starting NAV <code>{latest.navPerUnit}</code>) across 1,000
            identical seeded Bernoulli paths.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8 }}>
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
                  <th style={{ padding: 9 }}>Staking Regime</th>
                  <th style={{ padding: 9 }}>Median NAV</th>
                  <th style={{ padding: 9 }}>P05 Worst VaR</th>
                  <th style={{ padding: 9 }}>P95 Upside</th>
                  <th style={{ padding: 9 }}>Median Max DD</th>
                  <th style={{ padding: 9 }}>DD &gt;= 30% Breach</th>
                </tr>
              </thead>
              <tbody>
                {monteCarloRegimes.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #232836', fontSize: 13 }}>
                    <td style={{ padding: 9, fontWeight: r.id === 'quarter-kelly' ? 700 : 500, color: r.id === 'quarter-kelly' ? '#21E0DC' : '#F2F5F9' }}>
                      {r.label}
                    </td>
                    <td style={{ padding: 9, fontWeight: 700 }}>{r.medianNav}</td>
                    <td style={{ padding: 9 }}>{r.p05Nav}</td>
                    <td style={{ padding: 9 }}>{r.p95Nav}</td>
                    <td style={{ padding: 9 }}>{r.medianMaxDrawdownPct}%</td>
                    <td style={{ padding: 9, color: r.breach30DrawdownPct > 15 ? '#FF5C86' : '#21E0DC', fontWeight: 700 }}>
                      {r.breach30DrawdownPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              Chat with Dixon-Coles Edges, Shin De-Vigging &amp; Pool NAV
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
            { label: 'Rank Shin De-Vigged Edges', prompt: 'Rank the active matchday fixtures by Shin de-vigged edge and Quarter-Kelly sizing.' },
            { label: 'Explain Dixon-Coles Shift', prompt: 'Compare the Dixon-Coles draw probabilities against naive independent Poisson on the current slate.' },
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
            placeholder="Ask about Dixon-Coles rho, Shin de-vigging, Monte Carlo VaR, or NAV state..."
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
