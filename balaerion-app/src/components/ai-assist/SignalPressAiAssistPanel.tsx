'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PressBlock, PressDocument, PressLanguage } from '@/lib/press/schema';
import type { CriticIssue, PressAssistAction } from '@/lib/ai-assist/press-assist-engine';

export interface SignalPressAiAssistPanelProps {
  doc: PressDocument;
  commitDoc: (next: PressDocument) => void;
}

const btnStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '8px 14px',
  borderRadius: 6,
  border: '1px solid #2A2E3A',
  background: '#15171F',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 13.5,
  cursor: 'pointer',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const fieldStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #2A2E3A',
  background: '#0B0C10',
  color: '#FFFFFF',
  fontSize: 14,
  maxWidth: '100%',
  boxSizing: 'border-box',
};

export function SignalPressAiAssistPanel({ doc, commitDoc }: SignalPressAiAssistPanelProps) {
  const [open, setOpen] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [action, setAction] = useState<PressAssistAction>('draft');
  const [lane, setLane] = useState<'eu' | 'general'>('eu');
  const [targetLocale, setTargetLocale] = useState<PressLanguage>('nl-BE');
  const [blockType, setBlockType] = useState<'callout' | 'paragraph' | 'bullets'>('callout');
  const [targetBlockIdx, setTargetBlockIdx] = useState<number>(0);
  const [sourceId, setSourceId] = useState<string>('');
  const [brief, setBrief] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [statusNote, setStatusNote] = useState<string>('');
  const [criticIssues, setCriticIssues] = useState<{ summary: string; issues: CriticIssue[] } | null>(null);

  const pendingDraftCount = doc.blocks.filter((b) => Boolean(b.aiDraft)).length;

  const extractBlockSourceText = (b: PressBlock | undefined): string => {
    if (!b) return '';
    return [b.title ?? '', b.text ?? '', ...(b.items ?? [])].filter(Boolean).join('\n').trim();
  };

  const handleRunAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentConfirmed) {
      setStatusNote('Check the F5 synthetic-data consent line before calling AI Assist.');
      return;
    }

    const selectedBlock = doc.blocks[targetBlockIdx];
    const effectiveInput =
      action === 'draft'
        ? brief.trim()
        : brief.trim() || extractBlockSourceText(selectedBlock) || doc.meta.title;

    if (!effectiveInput) {
      setStatusNote('Provide a synthetic brief or select a non-empty block.');
      return;
    }

    setBusy(true);
    setStatusNote('');
    setCriticIssues(null);

    try {
      const res = await fetch('/api/press/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          consentConfirmed: true,
          lane,
          targetLocale,
          blockType,
          sourceId: sourceId || undefined,
          briefOrText: effectiveInput,
          audience: doc.meta.audience,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 || res.status === 400) {
        setStatusNote(data.error || 'Request blocked by pre-dispatch safety gate.');
        return;
      }

      if (action === 'critic' && data.criticReport) {
        setCriticIssues({
          summary: data.criticReport.summary,
          issues: data.criticReport.issues || [],
        });
        setStatusNote(
          data.replay
            ? `Critic ran in deterministic Replay Mode (${data.error || 'no live grant active'}).`
            : `Live Critic completed via ${data.providerId} (${data.modelId}).`
        );
        return;
      }

      if (data.block) {
        const incomingBlock: PressBlock = {
          ...data.block,
          // Enforce I12 client-side too: AI output ALWAYS enters as aiDraft: true until human clicks Accept Draft!
          aiDraft: true,
        };
        if (action === 'draft') {
          commitDoc({ ...doc, blocks: [...doc.blocks, incomingBlock] });
        } else if (selectedBlock) {
          const nextBlocks = doc.blocks.map((b, i) =>
            i === targetBlockIdx
              ? {
                  ...incomingBlock,
                  id: b.id,
                  sourceId: sourceId || b.sourceId,
                  aiDraft: true,
                }
              : b
          );
          commitDoc({ ...doc, blocks: nextBlocks });
        } else {
          commitDoc({ ...doc, blocks: [...doc.blocks, incomingBlock] });
        }

        const sourceWarn = data.requiresSourceBinding
          ? ' Numeric claim detected: bind a source_id before exporting.'
          : '';
        setStatusNote(
          (data.replay
            ? 'Inserted Replay AI-assisted block (marked PENDING REVIEW; export stays locked until you click Accept Draft).'
            : `Inserted Live AI block via ${data.providerId} (marked PENDING REVIEW; click Accept Draft after human review to unlock export).`) +
            sourceWarn
        );
      } else {
        setStatusNote(data.error || 'AI Assist returned no block.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Optional AI Assist Extension"
      style={{
        background: '#15171F',
        border: '1px solid #2A2E3A',
        borderRadius: 6,
        padding: 14,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <strong style={{ fontSize: 13.5, color: '#21E0DC' }}>
            Optional AI Assist (Removable P6 Extension · Unlisted Workspace Only)
          </strong>
          <div style={{ fontSize: 12.5, color: '#B9C0CE', marginTop: 2 }}>
            Offline manual authoring needs zero network calls. Pending unaccepted AI drafts:{' '}
            <strong style={{ color: pendingDraftCount > 0 ? '#FF5C86' : '#21E0DC' }}>{pendingDraftCount}</strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{ ...btnStyle, borderColor: '#21E0DC', color: '#21E0DC' }}
        >
          {open ? 'Hide AI Assist' : 'Open AI Assist (Optional)'}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleRunAssist} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* F5 Explicit Consent Line Before First Call */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 10,
              borderRadius: 6,
              background: '#0B0C10',
              border: `1px solid ${consentConfirmed ? '#21E0DC' : '#F0245C'}`,
              fontSize: 12.5,
              color: '#FFFFFF',
              lineHeight: 1.5,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              aria-label="Confirm synthetic-only AI Assist consent (F5)"
              style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, accentColor: '#21E0DC' }}
            />
            <span>
              <strong>Consent &amp; synthetic-only confirmation (F5):</strong> I confirm the selected text contains{' '}
              <strong>100% synthetic data</strong> (no real client, employer, or personal information) and consent to
              dispatching it to an admitted free-tier LLM provider under{' '}
              <Link href="/privacy" style={{ color: '#21E0DC' }}>
                /privacy
              </Link>
              . Without a redeemed grant on{' '}
              <Link href="/redeem" style={{ color: '#21E0DC' }}>
                /redeem
              </Link>
              , deterministic Replay output is returned locally.
            </span>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Assist Action
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as PressAssistAction)}
                aria-label="AI Assist Action"
                style={fieldStyle}
              >
                <option value="draft">Draft New Block</option>
                <option value="tighten">Tighten Selected Block</option>
                <option value="translate">Translate / Localize (nl-BE vs nl-NL)</option>
                <option value="critic">Adversarial Pre-Export Critic</option>
              </select>
            </label>

            <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Routing Lane
              <select
                value={lane}
                onChange={(e) => setLane(e.target.value as 'eu' | 'general')}
                aria-label="AI Routing Lane"
                style={fieldStyle}
              >
                <option value="eu">EU Safe Lane (Default · Zero General Fallback)</option>
                <option value="general">General Free Lane (Groq / Cerebras / Workers AI)</option>
              </select>
            </label>

            {action === 'draft' ? (
              <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                New Block Type
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as 'callout' | 'paragraph' | 'bullets')}
                  style={fieldStyle}
                >
                  <option value="callout">Callout</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="bullets">Bullet List</option>
                </select>
              </label>
            ) : (
              <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                Target Block
                <select
                  value={targetBlockIdx}
                  onChange={(e) => setTargetBlockIdx(Number(e.target.value))}
                  style={fieldStyle}
                >
                  {doc.blocks.map((b, idx) => (
                    <option key={b.id} value={idx}>
                      #{idx + 1} · {b.type}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {action === 'translate' ? (
              <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                Target Locale Register
                <select
                  value={targetLocale}
                  onChange={(e) => setTargetLocale(e.target.value as PressLanguage)}
                  aria-label="Target Locale Register"
                  style={fieldStyle}
                >
                  <option value="nl-BE">Vlaams / Belgisch Nederlands (nl-BE)</option>
                  <option value="nl-NL">Noord-Nederlands Zakelijk (nl-NL)</option>
                  <option value="en-GB">English (en-GB)</option>
                  <option value="fr-BE">Francais BE (fr-BE)</option>
                </select>
              </label>
            ) : null}

            <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Bind Provenance Source ID
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={fieldStyle}>
                <option value="">None (figures will block export until bound)</option>
                {doc.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.classification})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ fontSize: 12.5, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Synthetic Brief or Override Text
            <textarea
              rows={2}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Enter a synthetic topic brief (leave blank on Tighten/Translate/Critic to use selected block text)..."
              aria-label="Synthetic AI Assist Brief"
              style={{ ...fieldStyle, width: '100%' }}
            />
          </label>

          <div>
            <button
              type="submit"
              disabled={!consentConfirmed || busy}
              style={{
                ...btnStyle,
                background: consentConfirmed ? '#F0245C' : '#15171F',
                borderColor: '#F0245C',
                color: '#FFFFFF',
                opacity: consentConfirmed ? 1 : 0.55,
              }}
            >
              {busy ? 'Running Assist...' : `Run ${action.toUpperCase()} Assist`}
            </button>
          </div>

          {statusNote ? (
            <div
              role="status"
              style={{
                padding: 10,
                borderRadius: 6,
                background: '#0B0C10',
                border: '1px solid #21E0DC',
                fontSize: 13,
                color: '#FFFFFF',
              }}
            >
              {statusNote}
            </div>
          ) : null}

          {criticIssues ? (
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                background: '#0B0C10',
                border: '1px solid #2A2E3A',
                fontSize: 13,
              }}
            >
              <strong style={{ color: '#FFFFFF' }}>{criticIssues.summary}</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#B9C0CE' }}>
                {criticIssues.issues.map((iss, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <strong style={{ color: iss.severity === 'high' ? '#FF5C86' : '#21E0DC' }}>[{iss.code}]</strong>{' '}
                    {iss.message} <em>({iss.fixSuggestion})</em>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
