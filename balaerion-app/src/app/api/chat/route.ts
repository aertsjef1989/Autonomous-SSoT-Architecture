import { NextResponse } from 'next/server';
import { enforcePreDispatchGate, type Lane } from '@/lib/lane-guard';
import { getSupabaseServer } from '@/lib/supabase-server';

async function fetchLiveContext(mode: string): Promise<string> {
  const sb = getSupabaseServer();
  if (!sb) return `[DB] Supabase env vars not configured yet. Mode: ${mode}.`;

  if (mode === 'ssot') {
    const { data, error } = await sb
      .from('ssot_documents_with_staleness')
      .select('title, market_code, status, is_stale, escalation_stage, days_since_verified')
      .limit(25);
    if (error) return `[SSoT DB Error] ${error.message}`;
    return `LIVE SSoT DATA (${data?.length ?? 0} docs):\n${JSON.stringify(data ?? [], null, 2)}`;
  }

  if (mode === 'syndicate') {
    const [fixtures, ledger] = await Promise.all([
      sb.from('syndicate_fixtures').select('match_date, home_team, away_team, home_xg, away_xg, model_edge_pct, slip_status').order('match_date', { ascending: true }).limit(15),
      sb.from('syndicate_pool_ledger').select('entry_date, nav_unit_value, pool_balance_eur, note').order('entry_date', { ascending: false }).limit(5),
    ]);
    return `LIVE SYNDICATE DATA:\nFixtures: ${JSON.stringify(fixtures.data ?? [], null, 2)}\nNAV Ledger: ${JSON.stringify(ledger.data ?? [], null, 2)}`;
  }

  if (mode === 'prospecthub') {
    const { data, error } = await sb
      .from('prospect_workspaces')
      .select('domain, entity_name, country_code, readiness_score, lifecycle_state, updated_at')
      .limit(20);
    if (error) return `[ProspectHub DB Error] ${error.message}`;
    return `LIVE PROSPECTHUB WORKSPACES (${data?.length ?? 0}):\n${JSON.stringify(data ?? [], null, 2)}`;
  }

  return '';
}

export async function POST(request: Request) {
  const { prompt, lane = 'general', provider = 'groq', mode = 'general' } = await request.json();

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  // 1. Pre-Dispatch Lane & PII Gate
  const check = enforcePreDispatchGate(lane as Lane, provider, prompt);
  if (!check.allowed) {
    return NextResponse.json({ blocked: true, error: check.reason }, { status: 403 });
  }

  // 2. Pull live database context for SSoT, Syndicate, or ProspectHub
  const liveContext = await fetchLiveContext(mode);
  const messages = [
    ...(liveContext
      ? [{ role: 'system', content: `You are Balaerion. Answer strictly using the live database snapshot below.\n\n${liveContext}` }]
      : []),
    { role: 'user', content: prompt },
  ];

  // 3. Dispatch to EU Safe Lane (Mistral EU) or General Lane (Groq)
  try {
    if (lane === 'safe') {
      const key = process.env.MISTRAL_EU_API_KEY;
      if (!key) return NextResponse.json({ reply: `[SAFE LANE · ${mode}] Live DB connected. Set MISTRAL_EU_API_KEY in Vercel to enable live responses.\n\n${liveContext}` });

      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'mistral-small-latest', messages }),
      });
      const data = await r.json();
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? 'No response from Mistral EU.' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ reply: `[GENERAL LANE · ${mode}] Live DB connected. Set GROQ_API_KEY in Vercel to enable live responses.\n\n${liveContext}` });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages }),
    });
    const data = await r.json();
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? 'No response from Groq.' });
  } catch {
    return NextResponse.json({ error: 'Upstream provider error.' }, { status: 502 });
  }
}
