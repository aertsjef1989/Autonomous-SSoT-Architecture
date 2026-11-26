'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_HANDOFF_DECK,
  saveHandoffToLocalStorage,
  validateHandoffPayload,
  type SignalHandoffPayload,
} from '@/lib/signal-handoff';

export default function StudioHandoffPage() {
  const [deck, setDeck] = useState<SignalHandoffPayload>(DEFAULT_HANDOFF_DECK);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<string>('');
  const router = useRouter();

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const res = validateHandoffPayload(parsed);
      if (!res.valid || !res.payload) {
        setStatus(`BLOCKED: ${res.errors.join(' ')}`);
        return;
      }
      setDeck(res.payload);
      setStatus(`Imported "${res.payload.deckTitle}" (${res.payload.slides.length} slides).`);
    } catch {
      setStatus('BLOCKED: Invalid JSON syntax.');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'signal_handoff_v1.json';
    a.click();
  };

  const handleSendToPress = () => {
    const saved = saveHandoffToLocalStorage(deck);
    if (!saved.ok) {
      setStatus(`BLOCKED: ${saved.error}`);
      return;
    }
    router.push('/press');
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>Signal Studio: Slide Composer & JSON Handoff</h1>
      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 780 }}>
        Compose structured slide outlines or import legacy Signal Studio <code>DECK</code> JSON exports, validate them against <code>signal-handoff-v1</code>, and hand them off locally to Signal Press (<code>/press</code>) without server persistence.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <button
          onClick={handleSendToPress}
          style={{
            padding: '10px 16px',
            minHeight: 44,
            borderRadius: 8,
            border: 'none',
            background: '#F0245C',
            color: '#FFFFFF',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Hand Off to Signal Press (/press)
        </button>
        <button
          onClick={handleExportJson}
          style={{
            padding: '10px 16px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid #21E0DC',
            background: '#171B24',
            color: '#21E0DC',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export signal-handoff-v1 JSON
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            borderLeft: status.startsWith('BLOCKED') ? '3px solid #F0245C' : '3px solid #21E0DC',
            background: '#15171F',
            color: status.startsWith('BLOCKED') ? '#FF5C86' : '#21E0DC',
            fontSize: 13.5,
          }}
        >
          {status}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 16, color: '#21E0DC' }}>
            Active Deck: {deck.deckTitle} ({deck.slides.length} slides)
          </h2>
          {deck.slides.map((s, idx) => (
            <div
              key={s.id}
              style={{
                padding: 12,
                borderRadius: 8,
                background: '#171B24',
                border: '1px solid #232836',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: idx % 2 === 0 ? '#F0245C' : '#21E0DC', letterSpacing: '0.12em' }}>
                {idx + 1}. {s.eyebrow}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, margin: '4px 0' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#B9C0CE' }}>{s.body}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#FFFFFF' }}>
            Import JSON (signal-handoff-v1 or Signal Studio DECK)
          </h2>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste {"schema":"signal-handoff-v1", ...} or legacy Studio {"title":"...","slides":[...]}'
            rows={8}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#08090D',
              color: '#F2F5F9',
              border: '1px solid #232836',
              borderRadius: 8,
              padding: 10,
              fontSize: 14,
              fontFamily: 'monospace',
              marginBottom: 10,
            }}
          />
          <button
            onClick={handleImport}
            style={{
              padding: '10px 16px',
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid #21E0DC',
              background: '#21E0DC',
              color: '#08090D',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Validate & Import JSON
          </button>
        </div>
      </div>
    </div>
  );
}
