'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  buildPressDocumentFromContent,
  buildStudioDeckFromContent,
  saveHandoffToLocalStorage,
  savePressDocHandoffToLocalStorage,
} from '@/lib/signal-handoff';

interface CitationBadge {
  docId: string;
  title: string;
  market: string;
  isStale: boolean;
}

export function FloatingChat({
  contextLabel,
  pillar,
  market,
  activeDocId,
  syndicateContext,
}: {
  contextLabel: string;
  pillar?: 'ssot' | 'prospecthub' | 'syndicate';
  market?: string;
  activeDocId?: string;
  syndicateContext?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lane, setLane] = useState<'general' | 'safe'>(pillar === 'ssot' ? 'safe' : 'general');
  const [messages, setMessages] = useState<
    Array<{
      role: string;
      text: string;
      blocked?: boolean;
      citations?: CitationBadge[];
      staleWarning?: boolean;
      provider?: string | null;
    }>
  >([
    {
      role: 'system',
      text: `Balaerion docked to ${contextLabel}. Pre-dispatch PII gate & grounded retrieval active.`,
    },
  ]);

  const send = async (overridePrompt?: string) => {
    const q = (overridePrompt ?? input).trim();
    if (!q) return;
    if (!overridePrompt) setInput('');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: q }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lane,
          provider: lane === 'safe' ? 'mistral' : 'groq',
          mode: contextLabel.toLowerCase(),
          pillar,
          market,
          activeDocId,
          syndicateContext,
          history,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || data.error || 'Replay response served.',
            citations: Array.isArray(data.citations) ? data.citations : undefined,
            staleWarning: Boolean(data.staleWarning),
            provider: data.provider || null,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `[Offline Replay | ${contextLabel}] Network unavailable; serving local Replay fallback.` },
      ]);
    }
  };

  const handoffReplyToStudio = (text: string) => {
    const deck = buildStudioDeckFromContent({
      title: `${contextLabel}: Grounded Brief`,
      content: text,
      market: market || 'GLOBAL',
      eyebrowPrefix: contextLabel.toUpperCase(),
    });
    if (saveHandoffToLocalStorage(deck).ok) {
      router.push('/studio');
    }
  };

  const handoffReplyToPress = (text: string) => {
    const doc = buildPressDocumentFromContent({
      title: `${contextLabel}: Grounded Brief`,
      content: text,
      market: market || 'GLOBAL',
      sourceLabel: `${contextLabel} Grounded Session`,
    });
    if (savePressDocHandoffToLocalStorage(doc).ok) {
      router.push('/press');
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
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        height: '490px',
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
              whiteSpace: 'pre-wrap',
              backgroundColor: m.blocked ? 'rgba(240, 36, 92, 0.14)' : m.role === 'user' ? '#1E2230' : '#171B24',
              borderLeft: m.blocked ? '3px solid #F0245C' : m.role === 'assistant' ? '2px solid #21E0DC' : 'none',
            }}
          >
            <div>{m.text}</div>
            {m.staleWarning ? (
              <div style={{ marginTop: 6, fontSize: 11, color: '#FF5C86', fontWeight: 700 }}>
                Warning: One or more cited SSoT nodes have REVIEW_DUE status.
              </div>
            ) : null}
            {m.citations && m.citations.length > 0 ? (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {m.citations.map((c, ci) => (
                  <span
                    key={`${c.docId}-${ci}`}
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: '#08090D',
                      border: `1px solid ${c.isStale ? '#F0245C' : '#21E0DC'}`,
                      color: c.isStale ? '#FF5C86' : '#21E0DC',
                    }}
                  >
                    [{c.docId}]
                  </span>
                ))}
              </div>
            ) : null}
            {m.role === 'assistant' && !m.blocked ? (
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handoffReplyToStudio(m.text)}
                  style={{
                    minHeight: 36,
                    padding: '4px 8px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #21E0DC',
                    background: '#08090D',
                    color: '#21E0DC',
                    cursor: 'pointer',
                  }}
                >
                  -&gt; Studio (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => handoffReplyToPress(m.text)}
                  style={{
                    minHeight: 36,
                    padding: '4px 8px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #F0245C',
                    background: '#08090D',
                    color: '#FF5C86',
                    cursor: 'pointer',
                  }}
                >
                  -&gt; Press (A4)
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid #232836', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
            onClick={() => send('/ask Summarize active market rules and server event deduplication')}
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
            Test Grounded /ask
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={`Ask ${contextLabel} (/ask, /check)...`}
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
