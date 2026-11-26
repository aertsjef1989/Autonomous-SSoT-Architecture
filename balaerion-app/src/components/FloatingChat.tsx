'use client';
import { useState } from 'react';

export function FloatingChat({ contextLabel }: { contextLabel: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lane, setLane] = useState<'general' | 'safe'>('general');
  const [messages, setMessages] = useState<Array<{ role: string; text: string; blocked?: boolean }>>([
    {
      role: 'system',
      text: `Balaerion docked to ${contextLabel}. Running in Replay Mode (zero LLM tokens spent; pre-dispatch PII gate active).`,
    },
  ]);

  const send = async (overridePrompt?: string) => {
    const q = (overridePrompt ?? input).trim();
    if (!q) return;
    if (!overridePrompt) setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lane,
          provider: lane === 'safe' ? 'scaleway-paris' : 'groq',
          mode: contextLabel.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.reply || data.error || 'Replay response served.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `[Offline Replay | ${contextLabel}] Network unavailable; serving local Replay fallback.` },
      ]);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: '16px',
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          backgroundColor: '#21E0DC',
          color: '#08090D',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 18px',
          minHeight: '44px',
          fontWeight: 700,
          fontSize: '13.5px',
          cursor: 'pointer',
          zIndex: 50,
        }}
      >
        Balaerion ({contextLabel})
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '16px',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        height: '450px',
        maxHeight: 'calc(100dvh - 32px)',
        backgroundColor: '#11141B',
        border: '1px solid #21E0DC',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #232836',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <strong style={{ color: '#21E0DC', fontSize: '13px' }}>Balaerion ({contextLabel})</strong>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setLane(lane === 'general' ? 'safe' : 'general')}
            style={{
              backgroundColor: '#171B24',
              color: lane === 'safe' ? '#21E0DC' : '#B9C0CE',
              border: '1px solid #232836',
              borderRadius: 6,
              padding: '8px 10px',
              minHeight: 44,
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            lane: {lane === 'safe' ? 'eu' : 'general'}
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            style={{
              background: '#171B24',
              border: '1px solid #232836',
              borderRadius: 6,
              color: '#B9C0CE',
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.45,
              wordBreak: 'break-word',
              backgroundColor: m.blocked ? 'rgba(240, 36, 92, 0.14)' : m.role === 'user' ? '#1E2230' : '#171B24',
              borderLeft: m.blocked ? '3px solid #F0245C' : m.role === 'assistant' ? '2px solid #21E0DC' : 'none',
            }}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid #232836', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => send('Audit VAT BE0123.456.789 on general lane')}
            style={{
              backgroundColor: '#171B24',
              color: '#F0245C',
              border: '1px solid #F0245C',
              borderRadius: 6,
              padding: '8px 10px',
              minHeight: 44,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Test PII Block
          </button>
          <button
            onClick={() => send('Summarize active governance controls')}
            style={{
              backgroundColor: '#171B24',
              color: '#B9C0CE',
              border: '1px solid #232836',
              borderRadius: 6,
              padding: '8px 10px',
              minHeight: 44,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Test Clean Prompt
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={`Ask ${contextLabel}...`}
            style={{
              flex: 1,
              backgroundColor: '#08090D',
              color: '#F2F5F9',
              border: '1px solid #232836',
              borderRadius: '6px',
              padding: '8px 10px',
              minHeight: '44px',
              fontSize: '16px',
            }}
          />
          <button
            onClick={() => send()}
            style={{
              backgroundColor: '#21E0DC',
              color: '#08090D',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              minHeight: '44px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
