import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  computeDixonColesFixture,
  runCalibrationBacktest,
  type CalibrationBenchmarkSummary,
  type SyndicateFixtureQuant,
} from '@/lib/syndicate/quant';

export const dynamic = 'force-dynamic';

export type SyndicateFixtureRow = SyndicateFixtureQuant;

interface CachedSyndicatePayload {
  fetchedAtMs: number;
  rho: number;
  body: {
    feedStatus: 'LIVE' | 'FALLBACK';
    oddsStatus: 'LIVE' | 'MODEL_BENCHMARK';
    competition: string;
    updatedAt: string;
    rho: number;
    calibration: CalibrationBenchmarkSummary;
    fixtures: SyndicateFixtureRow[];
  };
}

const globalSyndicateCache = globalThis as unknown as {
  __balaerionSyndicateCache?: CachedSyndicatePayload;
};

function buildFallbackFixtures(rho: number): SyndicateFixtureRow[] {
  return [
    computeDixonColesFixture({
      id: 'sim-1',
      homeTeam: 'North Harbour FC (Sim)',
      awayTeam: 'Midland Villa (Sim)',
      kickoffUtc: '2026-11-26T20:00:00Z',
      xgHome: 1.66,
      xgAway: 2.38,
      rho,
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
      rho,
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
      rho,
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
      rho,
      marketHomeOddsOverride: 2.24,
      marketDrawOddsOverride: 3.6,
      marketAwayOddsOverride: 3.1,
    }),
  ];
}

export async function GET(request: NextRequest) {
  const rawRho = Number(request.nextUrl.searchParams.get('rho') ?? '-0.11');
  const rho = Number.isFinite(rawRho) ? Math.max(-0.22, Math.min(0.12, Number(rawRho.toFixed(2)))) : -0.11;
  const calibration = runCalibrationBacktest(rho);

  const fdKey = (process.env.FOOTBALL_DATA_API_KEY ?? '').trim();
  const oddsKey = (process.env.THE_ODDS_API_KEY ?? '').trim();

  if (!fdKey) {
    return NextResponse.json(
      {
        feedStatus: 'FALLBACK',
        oddsStatus: 'MODEL_BENCHMARK',
        competition: 'European League Phase (Deterministic Dixon-Coles Fallback)',
        updatedAt: new Date().toISOString(),
        rho,
        calibration,
        fixtures: buildFallbackFixtures(rho),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const nowMs = Date.now();
  const cached = globalSyndicateCache.__balaerionSyndicateCache;
  if (cached && cached.rho === rho && nowMs - cached.fetchedAtMs < 300_000) {
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

    const liveOddsByHomeLower = new Map<string, { h: number; d?: number; a?: number }>();
    let oddsStatus: 'LIVE' | 'MODEL_BENCHMARK' = 'MODEL_BENCHMARK';
    if (oddsKey) {
      try {
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${encodeURIComponent(oddsKey)}`;
        const oddsResp = await fetch(oddsUrl);
        if (oddsResp.ok) {
          const oddsList = (await oddsResp.json()) as Array<{
            home_team?: string;
            away_team?: string;
            bookmakers?: Array<{ markets?: Array<{ outcomes?: Array<{ name?: string; price?: number }> }> }>;
          }>;
          for (const ev of oddsList) {
            const hName = (ev.home_team || '').toLowerCase();
            const aName = (ev.away_team || '').toLowerCase();
            const outcomes = ev.bookmakers?.[0]?.markets?.[0]?.outcomes ?? [];
            const homeOut = outcomes.find((o) => (o.name || '').toLowerCase() === hName);
            const drawOut = outcomes.find((o) => (o.name || '').toLowerCase() === 'draw');
            const awayOut = outcomes.find((o) => (o.name || '').toLowerCase() === aName);
            if (hName && homeOut?.price && homeOut.price > 1.01) {
              liveOddsByHomeLower.set(hName, {
                h: homeOut.price,
                d: drawOut?.price,
                a: awayOut?.price,
              });
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
            const mkt =
              liveOddsByHomeLower.get(hName.toLowerCase()) ||
              liveOddsByHomeLower.get((m.homeTeam?.name || '').toLowerCase());
            return computeDixonColesFixture({
              id: String(m.id ?? `cl-${idx + 1}`),
              homeTeam: hName,
              awayTeam: aName,
              kickoffUtc: m.utcDate || new Date().toISOString(),
              xgHome: lamH,
              xgAway: lamA,
              rho,
              marketHomeOddsOverride: mkt?.h,
              marketDrawOddsOverride: mkt?.d,
              marketAwayOddsOverride: mkt?.a,
            });
          })
        : buildFallbackFixtures(rho);

    const body = {
      feedStatus: 'LIVE' as const,
      oddsStatus,
      competition: 'UEFA Champions League (Live football-data.org v4)',
      updatedAt: new Date().toISOString(),
      rho,
      calibration,
      fixtures,
    };
    globalSyndicateCache.__balaerionSyndicateCache = { fetchedAtMs: nowMs, rho, body };
    return NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      {
        feedStatus: 'FALLBACK',
        oddsStatus: 'MODEL_BENCHMARK',
        competition: 'European League Phase (Fallback: Upstream Throttled or Unreachable)',
        updatedAt: new Date().toISOString(),
        rho,
        calibration,
        fixtures: buildFallbackFixtures(rho),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
