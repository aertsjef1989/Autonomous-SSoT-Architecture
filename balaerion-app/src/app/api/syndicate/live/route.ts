import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface SyndicateFixtureRow {
  id: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  xgHome: number;
  xgAway: number;
  pHome: number;
  pDraw: number;
  pAway: number;
  o25: number;
  btts: number;
  fairHomeOdds: number;
  marketHomeOdds: number;
  edgePct: number;
  quarterKellyPct: number;
  topScorelines: Array<{ score: string; pct: number }>;
}

interface CachedSyndicatePayload {
  fetchedAtMs: number;
  body: {
    feedStatus: 'LIVE' | 'FALLBACK';
    oddsStatus: 'LIVE' | 'MODEL_BENCHMARK';
    competition: string;
    updatedAt: string;
    fixtures: SyndicateFixtureRow[];
  };
}

const globalSyndicateCache = globalThis as unknown as {
  __balaerionSyndicateCache?: CachedSyndicatePayload;
};

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poissonPmf(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function computePoissonFixtureMetrics(
  id: string,
  homeTeam: string,
  awayTeam: string,
  kickoffUtc: string,
  xgHome: number,
  xgAway: number,
  marketHomeOddsOverride?: number
): SyndicateFixtureRow {
  const lamH = Math.max(0.35, Math.min(4.2, Number(xgHome.toFixed(2))));
  const lamA = Math.max(0.35, Math.min(4.2, Number(xgAway.toFixed(2))));

  let pH = 0;
  let pD = 0;
  let pA = 0;
  let pOver25 = 0;
  let pBtts = 0;
  const grid: Array<{ score: string; pct: number }> = [];

  for (let h = 0; h <= 7; h++) {
    const ph = poissonPmf(h, lamH);
    for (let a = 0; a <= 7; a++) {
      const p = ph * poissonPmf(a, lamA);
      if (h > a) pH += p;
      else if (h === a) pD += p;
      else pA += p;
      if (h + a >= 3) pOver25 += p;
      if (h >= 1 && a >= 1) pBtts += p;
      if (h <= 4 && a <= 4) {
        grid.push({ score: `${h}-${a}`, pct: Number((p * 100).toFixed(1)) });
      }
    }
  }

  grid.sort((x, y) => y.pct - x.pct);
  const fairHomeOdds = Number((1 / Math.max(0.05, pH)).toFixed(2));
  const marketHomeOdds = marketHomeOddsOverride
    ? Number(marketHomeOddsOverride.toFixed(2))
    : Number((fairHomeOdds * 1.045).toFixed(2));
  const impliedHome = 1 / Math.max(1.01, marketHomeOdds);
  const edgePct = Number(((pH - impliedHome) * 100).toFixed(2));

  // Fractional Quarter-Kelly capped strictly at 5.0% of pool NAV
  const b = Math.max(0.01, marketHomeOdds - 1);
  const fullKelly = (b * pH - (1 - pH)) / b;
  const quarterKellyPct = Number(Math.max(0, Math.min(5.0, fullKelly * 0.25 * 100)).toFixed(2));

  return {
    id,
    match: `${homeTeam} vs ${awayTeam}`,
    homeTeam,
    awayTeam,
    kickoffUtc,
    xgHome: lamH,
    xgAway: lamA,
    pHome: Number((pH * 100).toFixed(1)),
    pDraw: Number((pD * 100).toFixed(1)),
    pAway: Number((pA * 100).toFixed(1)),
    o25: Number((pOver25 * 100).toFixed(1)),
    btts: Number((pBtts * 100).toFixed(1)),
    fairHomeOdds,
    marketHomeOdds,
    edgePct,
    quarterKellyPct,
    topScorelines: grid.slice(0, 4),
  };
}

function buildFallbackFixtures(): SyndicateFixtureRow[] {
  return [
    computePoissonFixtureMetrics('sim-1', 'North Harbour FC (Sim)', 'Midland Villa (Sim)', '2026-11-26T20:00:00Z', 1.66, 2.38, 4.15),
    computePoissonFixtureMetrics('sim-2', 'Thames Athletic (Sim)', 'Ruhr Valley BV (Sim)', '2026-11-26T20:00:00Z', 1.94, 1.02, 1.82),
    computePoissonFixtureMetrics('sim-3', 'Flanders Bruges XI (Sim)', 'Mersey Red FC (Sim)', '2026-11-27T20:00:00Z', 1.52, 2.14, 3.85),
    computePoissonFixtureMetrics('sim-4', 'Lisbon Sporting (Sim)', 'Lancaster United (Sim)', '2026-11-27T20:00:00Z', 1.81, 1.38, 2.24),
  ];
}

export async function GET() {
  const fdKey = (process.env.FOOTBALL_DATA_API_KEY ?? '').trim();
  const oddsKey = (process.env.THE_ODDS_API_KEY ?? '').trim();

  if (!fdKey) {
    return NextResponse.json(
      {
        feedStatus: 'FALLBACK',
        oddsStatus: 'MODEL_BENCHMARK',
        competition: 'European League Phase (Deterministic Simulation Fallback)',
        updatedAt: new Date().toISOString(),
        fixtures: buildFallbackFixtures(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const nowMs = Date.now();
  const cached = globalSyndicateCache.__balaerionSyndicateCache;
  if (cached && nowMs - cached.fetchedAtMs < 300_000) {
    return NextResponse.json(cached.body, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const [standingsResp, matchesResp] = await Promise.all([
      fetch('https://api.football-data.org/v4/competitions/CL/standings', {
        headers: { 'X-Auth-Token': fdKey },
      }),
      fetch('https://api.football-data.org/v4/competitions/CL/matches?status=SCHEDULED,TIMED,IN_PLAY', {
        headers: { 'X-Auth-Token': fdKey },
      }),
    ]);

    if (!standingsResp.ok || !matchesResp.ok) {
      throw new Error(`football-data HTTP ${standingsResp.status}/${matchesResp.status}`);
    }

    const standingsJson = (await standingsResp.json()) as {
      standings?: Array<{
        table?: Array<{
          team?: { id?: number; shortName?: string; name?: string };
          playedGames?: number;
          goalsFor?: number;
          goalsAgainst?: number;
        }>;
      }>;
    };
    const matchesJson = (await matchesResp.json()) as {
      matches?: Array<{
        id?: number;
        utcDate?: string;
        homeTeam?: { id?: number; shortName?: string; name?: string };
        awayTeam?: { id?: number; shortName?: string; name?: string };
      }>;
    };

    const table = standingsJson.standings?.[0]?.table ?? [];
    let totalGF = 0;
    let totalGames = 0;
    const teamStrength = new Map<number, { atk: number; def: number }>();

    for (const row of table) {
      const pg = Math.max(1, row.playedGames ?? 1);
      totalGF += row.goalsFor ?? 0;
      totalGames += pg;
    }
    const avgGoalsPerTeamGame = totalGames > 0 ? totalGF / totalGames : 1.48;

    for (const row of table) {
      const tid = row.team?.id;
      if (!tid) continue;
      const pg = Math.max(1, row.playedGames ?? 1);
      const gfPg = (row.goalsFor ?? avgGoalsPerTeamGame) / pg;
      const gaPg = (row.goalsAgainst ?? avgGoalsPerTeamGame) / pg;
      teamStrength.set(tid, {
        atk: Math.max(0.55, Math.min(2.1, gfPg / Math.max(0.8, avgGoalsPerTeamGame))),
        def: Math.max(0.55, Math.min(2.1, gaPg / Math.max(0.8, avgGoalsPerTeamGame))),
      });
    }

    // Optional live decimal market odds from The Odds API
    const liveOddsByHomeLower = new Map<string, number>();
    let oddsStatus: 'LIVE' | 'MODEL_BENCHMARK' = 'MODEL_BENCHMARK';
    if (oddsKey) {
      try {
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${encodeURIComponent(oddsKey)}`;
        const oddsResp = await fetch(oddsUrl);
        if (oddsResp.ok) {
          const oddsList = (await oddsResp.json()) as Array<{
            home_team?: string;
            bookmakers?: Array<{ markets?: Array<{ outcomes?: Array<{ name?: string; price?: number }> }> }>;
          }>;
          for (const ev of oddsList) {
            const hName = (ev.home_team || '').toLowerCase();
            const outcomes = ev.bookmakers?.[0]?.markets?.[0]?.outcomes ?? [];
            const homeOut = outcomes.find((o) => (o.name || '').toLowerCase() === hName);
            if (hName && homeOut?.price && homeOut.price > 1.01) {
              liveOddsByHomeLower.set(hName, homeOut.price);
              oddsStatus = 'LIVE';
            }
          }
        }
      } catch {
        /* keep model benchmark odds */
      }
    }

    const upcoming = (matchesJson.matches ?? []).slice(0, 10);
    const fixtures: SyndicateFixtureRow[] =
      upcoming.length > 0
        ? upcoming.map((m, idx) => {
            const hName = m.homeTeam?.shortName || m.homeTeam?.name || `Home ${idx + 1}`;
            const aName = m.awayTeam?.shortName || m.awayTeam?.name || `Away ${idx + 1}`;
            const hStr = (m.homeTeam?.id && teamStrength.get(m.homeTeam.id)) || { atk: 1.05, def: 1.0 };
            const aStr = (m.awayTeam?.id && teamStrength.get(m.awayTeam.id)) || { atk: 1.0, def: 1.05 };
            const lamH = avgGoalsPerTeamGame * 1.1 * hStr.atk * aStr.def;
            const lamA = avgGoalsPerTeamGame * 0.94 * aStr.atk * hStr.def;
            const mktOdds = liveOddsByHomeLower.get(hName.toLowerCase()) || liveOddsByHomeLower.get((m.homeTeam?.name || '').toLowerCase());
            return computePoissonFixtureMetrics(
              String(m.id ?? `cl-${idx + 1}`),
              hName,
              aName,
              m.utcDate || new Date().toISOString(),
              lamH,
              lamA,
              mktOdds
            );
          })
        : buildFallbackFixtures();

    const body = {
      feedStatus: 'LIVE' as const,
      oddsStatus,
      competition: 'UEFA Champions League (Live football-data.org v4)',
      updatedAt: new Date().toISOString(),
      fixtures,
    };
    globalSyndicateCache.__balaerionSyndicateCache = { fetchedAtMs: nowMs, body };
    return NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      {
        feedStatus: 'FALLBACK',
        oddsStatus: 'MODEL_BENCHMARK',
        competition: 'European League Phase (Fallback: Upstream Throttled or Unreachable)',
        updatedAt: new Date().toISOString(),
        fixtures: buildFallbackFixtures(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
