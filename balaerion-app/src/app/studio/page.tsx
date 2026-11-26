'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_HANDOFF_DECK,
  loadHandoffFromLocalStorage,
  saveHandoffToLocalStorage,
  validateHandoffPayload,
  type SignalHandoffPayload,
  type SignalSlideHandoff,
} from '@/lib/signal-handoff';

const STUDIO_HERO_IDS = [
  'glyph',
  ...Array.from({ length: 63 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`),
];

export default function StudioHandoffPage() {
  const [deck, setDeck] = useState<SignalHandoffPayload>(DEFAULT_HANDOFF_DECK);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const incoming = loadHandoffFromLocalStorage();
    if (incoming && incoming.slides.length > 0) {
      setDeck(incoming);
      setActiveSlideIdx(0);
      setStatus(`Loaded incoming workspace deck "${incoming.deckTitle}" (${incoming.slides.length} slides).`);
    }
  }, []);

  const currentSlide: SignalSlideHandoff = deck.slides[activeSlideIdx] ?? deck.slides[0];

  const updateSlide = (patch: Partial<SignalSlideHandoff>) => {
    const nextSlides = deck.slides.map((s, idx) => (idx === activeSlideIdx ? { ...s, ...patch } : s));
    const nextDeck = { ...deck, slides: nextSlides, updatedAt: new Date().toISOString().slice(0, 10) };
    setDeck(nextDeck);
  };

  const addSlide = () => {
    const idx = deck.slides.length + 1;
    const newSlide: SignalSlideHandoff = {
      id: `s${Date.now().toString(36)}`,
      eyebrow: `SECTION ${idx}`,
      title: `Slide ${idx}: Architectural Control`,
      body: 'Summarize the key operational decision, evidence source, and verification gate.',
      callout: 'Human-in-the-loop review required prior to external distribution.',
      heroId: `H${String(((idx - 1) % 63) + 1).padStart(2, '0')}`,
    };
    setDeck({ ...deck, slides: [...deck.slides, newSlide] });
    setActiveSlideIdx(deck.slides.length);
  };

  const deleteCurrentSlide = () => {
    if (deck.slides.length <= 1) return;
    const nextSlides = deck.slides.filter((_, idx) => idx !== activeSlideIdx);
    setDeck({ ...deck, slides: nextSlides });
    setActiveSlideIdx(Math.max(0, activeSlideIdx - 1));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const res = validateHandoffPayload(parsed);
      if (!res.valid || !res.payload) {
        setStatus(`BLOCKED: ${res.errors.join(' ')}`);
        return;
      }
      setDeck(res.payload);
      setActiveSlideIdx(0);
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

  const stagePalette =
    deck.theme === 'lightscreen'
      ? { bg: '#FFFFFF', card: '#F5F6F8', ink: '#14161C', muted: '#525866', line: '#E1E4EA', accent: '#C71048', cyan: '#0A7571' }
      : deck.theme === 'blueprint'
        ? { bg: '#F5F4EF', card: '#FFFFFF', ink: '#203048', muted: '#526071', line: '#DCE0E3', accent: '#C0504A', cyan: '#188860' }
        : { bg: '#0B0C10', card: '#15171F', ink: '#FFFFFF', muted: '#B9C0CE', line: '#2A2E3A', accent: '#F0245C', cyan: '#21E0DC' };

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>Signal Studio: 16:9 Slide Composer &amp; Visual Device Stage</h1>
      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 820 }}>
        Receive generated decks from <code>/ssot</code>, <code>/balaerion</code>, or <code>/syndicate</code>, pair each slide with any of the{' '}
        <strong>63 Signal vector devices (H01 to H63)</strong>, preview in 16:9, or hand off directly into Signal Press (<code>/press</code>).
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
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
          Hand Off Deck to Signal Press (/press)
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
        <button
          type="button"
          onClick={addSlide}
          style={{
            padding: '10px 14px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid #232836',
            background: '#171B24',
            color: '#F2F5F9',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Slide
        </button>
        <select
          aria-label="Deck Theme"
          value={deck.theme}
          onChange={(e) => setDeck({ ...deck, theme: e.target.value as SignalHandoffPayload['theme'] })}
          style={{
            minHeight: 44,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #232836',
            background: '#11141B',
            color: '#F2F5F9',
            fontSize: 13.5,
          }}
        >
          <option value="console">Theme: Console Dark</option>
          <option value="lightscreen">Theme: Light Screen</option>
          <option value="blueprint">Theme: Blueprint</option>
        </select>
      </div>

      {status ? (
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
      ) : null}

      {/* Visual 16:9 Canvas Stage */}
      {currentSlide ? (
        <section
          aria-label="16:9 Slide Stage Preview"
          style={{
            background: stagePalette.bg,
            color: stagePalette.ink,
            border: `1px solid ${stagePalette.line}`,
            borderRadius: 12,
            padding: '22px 24px',
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 20,
            alignItems: 'center',
            minHeight: 290,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F0245C', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#21E0DC', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: stagePalette.cyan, textTransform: 'uppercase' }}>
                {currentSlide.eyebrow} · SLIDE {activeSlideIdx + 1}/{deck.slides.length}
              </span>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 22, lineHeight: 1.25, color: stagePalette.ink }}>
              {currentSlide.title}
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.55, color: stagePalette.muted, whiteSpace: 'pre-wrap' }}>
              {currentSlide.body}
            </p>
            {currentSlide.callout ? (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: stagePalette.card,
                  borderLeft: `3px solid ${stagePalette.accent}`,
                  fontSize: 12.5,
                  color: stagePalette.ink,
                }}
              >
                {currentSlide.callout}
              </div>
            ) : null}
          </div>

          <div
            style={{
              background: '#0B0C10',
              border: `1px solid ${stagePalette.line}`,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={`/press-assets/heroes/${currentSlide.heroId || 'H01'}.svg`}
              alt={`Signal Device ${currentSlide.heroId || 'H01'}`}
              style={{ width: '100%', maxHeight: 210, objectFit: 'contain' }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: '#8B95A5', fontFamily: 'monospace' }}>
              Device: {currentSlide.heroId || 'H01'}
            </div>
          </div>
        </section>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        {/* Left: Slide Rail & Active Slide Editor */}
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8B95A5', marginBottom: 6 }}>
            Deck Title
            <input
              type="text"
              value={deck.deckTitle}
              onChange={(e) => setDeck({ ...deck, deckTitle: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: 44,
                marginTop: 4,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 14,
              }}
            />
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 14px' }}>
            {deck.slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlideIdx(idx)}
                style={{
                  minHeight: 40,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: idx === activeSlideIdx ? '1px solid #21E0DC' : '1px solid #232836',
                  background: idx === activeSlideIdx ? '#21E0DC' : '#171B24',
                  color: idx === activeSlideIdx ? '#08090D' : '#F2F5F9',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                Slide {idx + 1}
              </button>
            ))}
          </div>

          {currentSlide ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={currentSlide.eyebrow}
                  onChange={(e) => updateSlide({ eyebrow: e.target.value })}
                  placeholder="Eyebrow"
                  aria-label="Slide eyebrow"
                  style={{
                    flex: '1 1 130px',
                    minHeight: 44,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #232836',
                    background: '#08090D',
                    color: '#F2F5F9',
                    fontSize: 13,
                  }}
                />
                <select
                  aria-label="Slide Visual Device"
                  value={currentSlide.heroId || 'H01'}
                  onChange={(e) => updateSlide({ heroId: e.target.value })}
                  style={{
                    flex: '1 1 130px',
                    minHeight: 44,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #232836',
                    background: '#08090D',
                    color: '#21E0DC',
                    fontSize: 13,
                  }}
                >
                  {STUDIO_HERO_IDS.map((hid) => (
                    <option key={hid} value={hid}>
                      Device: {hid}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateSlide({ title: e.target.value })}
                placeholder="Slide Title"
                aria-label="Slide title"
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 14,
                }}
              />
              <textarea
                value={currentSlide.body}
                onChange={(e) => updateSlide({ body: e.target.value })}
                rows={4}
                placeholder="Slide body copy"
                aria-label="Slide body"
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              />
              <input
                type="text"
                value={currentSlide.callout ?? ''}
                onChange={(e) => updateSlide({ callout: e.target.value || undefined })}
                placeholder="Optional bottom callout bar"
                aria-label="Slide callout"
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13,
                }}
              />
              {deck.slides.length > 1 ? (
                <button
                  type="button"
                  onClick={deleteCurrentSlide}
                  style={{
                    minHeight: 40,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #F0245C',
                    background: '#171B24',
                    color: '#FF5C86',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  Delete Slide {activeSlideIdx + 1}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right: JSON Importer */}
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#FFFFFF' }}>
            Import JSON (signal-handoff-v1 or Signal Studio DECK)
          </h2>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste {"schema":"signal-handoff-v1", ...} or legacy Studio {"title":"...","slides":[...]}'
            rows={10}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#08090D',
              color: '#F2F5F9',
              border: '1px solid #232836',
              borderRadius: 8,
              padding: 10,
              fontSize: 13.5,
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
            Validate &amp; Import JSON
          </button>
        </div>
      </div>
    </div>
  );
}
