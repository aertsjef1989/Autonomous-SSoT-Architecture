'use client';
import { useState } from 'react';

type Mode = 'general' | 'prospecthub' | 'ssot' | 'syndicate';

export default function BalaerionWorkspace() {
  const [mode, setMode] = useState<Mode>('general');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'error'; text: string }[]>([
    { role: 'ai', text: 'Balaerion v1 unlocked. Pre-dispatch PII gate and EU Safe Lane routing are active.' },
  ]);

  const lane = mode === 'prospecthub' || mode === 'ssot' ? 'safe' : 'general';
  const provider = lane === 'safe' ? 'mistral-eu' : 'groq';

  async function send() {
    if (!input.trim()) return;
    const prompt = input.trim();
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, lane, provider, mode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessages((m) => [...m, { role: 'error', text: data.error || 'Request blocked.' }]);
    } else {
      setMessages((m) => [...m, { role: 'ai', text: data.reply }]);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 250, background: '#11141E', borderRight: '1px solid #252B3B', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#21E0DC' }}>BALAERION v1</div>
        {(['general', 'prospecthub', 'ssot', 'syndicate'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: mode === m ? 'rgba(33,224,220,0.12)' : 'transparent',
              color: mode === m ? '#21E0DC' : '#CBD3E6',
              border: mode === m ? '1px solid #21E0DC' : '1px solid transparent',
              textTransform: 'capitalize', fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === 'general' ? 'General AI' : m === 'prospecthub' ? 'ProspectHub (Safe)' : m === 'ssot' ? 'Analyze SSoT (Safe)' : 'Analyze Syndicate'}
          </button>
        ))}
        <div style={{ marginTop: 'auto', fontSize: 12, color: '#8E98B0' }}>
          Lane: <strong style={{ color: lane === 'safe' ? '#22C55E' : '#21E0DC' }}>{lane}</strong> ({provider})
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ flex: 1, overflowY: 'auto', maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'error' ? 'rgba(240,36,92,0.12)' : msg.role === 'user' ? '#1E2433' : '#171B26',
              border: `1px solid ${msg.role === 'error' ? '#F0245C' : '#252B3B'}`,
              padding: '10px 14px', borderRadius: 12, maxWidth: '85%', fontSize: 14, lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 760, width: '100%', margin: '16px auto 0', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={`Ask Balaerion (${mode} · lane: ${lane})...`}
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid #252B3B', background: '#171B26', color: '#ECEFF6' }}
          />
          <button onClick={send} style={{ padding: '0 18px', borderRadius: 12, border: 'none', background: '#21E0DC', color: '#08090D', fontWeight: 700, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
