import { NextResponse } from 'next/server';
import { enforcePreDispatchGate, type Lane } from '@/lib/lane-guard';

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

  // 2. Dispatch to EU Safe Lane (Mistral EU) or General Lane (Groq)
  try {
    if (lane === 'safe') {
      const key = process.env.MISTRAL_EU_API_KEY;
      if (!key) return NextResponse.json({ reply: `[SAFE LANE READY · ${mode}] Configure MISTRAL_EU_API_KEY in Vercel to enable live EU Zero-Retention responses.` });

      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await r.json();
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? 'No response from Mistral EU.' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ reply: `[GENERAL LANE READY · ${provider}] Configure GROQ_API_KEY in Vercel to enable live responses.` });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await r.json();
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? 'No response from Groq.' });
  } catch (err) {
    return NextResponse.json({ error: 'Upstream provider error.' }, { status: 502 });
  }
}
