'use client';
import { useState } from 'react';

export function FloatingChat({ contextLabel }: { contextLabel: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([
    {
      role: 'system',
      text: `Balaerion docked to ${contextLabel}. Running in Tier 1 Replay Mode (zero LLM tokens used).`,
    },
  ]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      {
        role: 'assistant',
        text: `[Replay | ${contextLabel}] "${q}" logged in Replay mode. Live free-model routing activates in P4/P5.`,
      },
    ]);
    setInput('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          backgroundColor: '#21E0DC',
          color: '#08090D',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 18px',
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 50,
        }}
      >
        Balaerion Chat ({contextLabel})
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      width: '360px',
      maxWidth: 'calc(100vw - 32px)',
      height: '420px',
      backgroundColor: '#11141B',
      border: '1px solid #21E0DC',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #232836',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <strong style={{ color: '#21E0DC', fontSize: '13px' }}>Balaerion ({contextLabel})</strong>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#B9C0CE', cursor: 'pointer', fontSize: '16px' }}
        >
          x
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: '8px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            backgroundColor: m.role === 'user' ? '#1E2230' : '#171B24',
            borderLeft: m.role === 'assistant' ? '2px solid #21E0DC' : 'none',
          }}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding: '10px', borderTop: '1px solid #232836', display: 'flex', gap: '6px' }}>
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
            padding: '8px',
            fontSize: '13px',
          }}
        />
        <button
          onClick={send}
          style={{
            backgroundColor: '#21E0DC',
            color: '#08090D',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
