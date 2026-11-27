'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface GrantStatusPayload {
  active: boolean;
  mode: string;
  summary: {
    grantId: string;
    status: string;
    tokenBudgetWeighted: number;
    tokensUsedWeighted: number;
    remainingTokensWeighted?: number;
    callsBudget: number;
    callsUsed: number;
    remainingCalls?: number;
    expiresAt: string;
    circuitOpen: boolean;
  } | null;
  policy?: {
    cooldownMode: string;
    dailyEmailCap: number;
    cookiePolicy: string;
  };
}

const btnStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #232836',
  background: '#171B24',
  color: '#F2F5F9',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #232836',
  background: '#08090D',
  color: '#F2F5F9',
  fontSize: 15,
  boxSizing: 'border-box',
};

async function sha256HexBrowser(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function RedeemGrantPage() {
  const [code, setCode] = useState('');
  const [fragmentDetected, setFragmentDetected] = useState(false);
  const [statusData, setStatusData] = useState<GrantStatusPayload | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [busyRedeem, setBusyRedeem] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [organization, setOrganization] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [altchaState, setAltchaState] = useState<'idle' | 'working' | 'verified' | 'error'>('idle');
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const [requestFeedback, setRequestFeedback] = useState<string>('');
  const [busyRequest, setBusyRequest] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/grants/status', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as GrantStatusPayload;
        setStatusData(json);
      }
    } catch {
      /* offline or unreachable */
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const rawHash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(rawHash);
      const hashCode = params.get('code');
      if (hashCode) {
        setCode(hashCode.trim());
        setFragmentDetected(true);
        // Immediately scrub the secret from the browser URL bar and session history (E8)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    refreshStatus();
  }, [refreshStatus]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedback({ tone: 'error', text: 'Paste a grant code (BLR-...) before redeeming.' });
      return;
    }
    setBusyRedeem(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/grants/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ tone: 'error', text: json.error || 'Grant redemption failed.' });
      } else {
        setCode('');
        setFragmentDetected(false);
        setFeedback({
          tone: 'info',
          text: 'Single-use grant redeemed. Strictly necessary HttpOnly session cookie set for Live AI calls.',
        });
        await refreshStatus();
      }
    } finally {
      setBusyRedeem(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/grants/logout', { method: 'POST' });
    setFeedback({ tone: 'info', text: 'Session cookie cleared. Workspace returned to Replay Mode.' });
    await refreshStatus();
  };

  const handleRunAltcha = async () => {
    if (altchaState === 'working' || altchaState === 'verified') return;
    setAltchaState('working');
    setRequestFeedback('');
    try {
      const res = await fetch('/api/grants/altcha', { cache: 'no-store' });
      const ch = await res.json();
      if (!res.ok || !ch?.challenge || !ch?.salt) {
        setAltchaState('error');
        setRequestFeedback(ch?.error || 'Could not load challenge.');
        return;
      }
      const maxNum = typeof ch.maxnumber === 'number' ? ch.maxnumber : 35000;
      let matched = -1;
      for (let n = 0; n <= maxNum; n++) {
        if (n > 0 && n % 1500 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
        const h = await sha256HexBrowser(`${ch.salt}${n}`);
        if (h === ch.challenge) {
          matched = n;
          break;
        }
      }
      if (matched < 0) {
        setAltchaState('error');
        setRequestFeedback('Verification check did not converge. Retry.');
        return;
      }
      const encoded = window.btoa(
        JSON.stringify({
          algorithm: 'SHA-256',
          challenge: ch.challenge,
          number: matched,
          salt: ch.salt,
          signature: ch.signature,
        })
      );
      setAltchaPayload(encoded);
      setAltchaState('verified');
    } catch {
      setAltchaState('error');
      setRequestFeedback('Network error while verifying challenge.');
    }
  };

  const handleRequestGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (altchaState !== 'verified' || !altchaPayload) {
      setRequestFeedback('Complete the self-hosted proof-of-work check first.');
      return;
    }
    setBusyRequest(true);
    setRequestFeedback('');
    try {
      const res = await fetch('/api/grants/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reviewerName,
          organization,
          contextNote,
          altcha: altchaPayload,
        }),
      });
      const json = await res.json().catch(() => ({}));
      setEmail('');
      setReviewerName('');
      setOrganization('');
      setContextNote('');
      setAltchaPayload('');
      setAltchaState('idle');
      setRequestFeedback(json.message || json.error || 'Request processed.');
    } finally {
      setBusyRequest(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 18 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#08090D',
            backgroundColor: '#21E0DC',
            padding: '4px 10px',
            borderRadius: 999,
            marginBottom: 8,
          }}
        >
          SECTION E &amp; F · SINGLE-USE LIVE AI GRANTS
        </span>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, color: '#FFFFFF' }}>Redeem or Inspect Live AI Grant</h1>
        <p style={{ margin: 0, color: '#B9C0CE', fontSize: 14, lineHeight: 1.6 }}>
          Every architecture chapter, Replay console, and offline Signal Press document export works immediately with{' '}
          <strong>no login, no cookie, and no grant</strong>. A single-use grant is needed only if you want to trigger
          live free-tier LLM calls.
        </p>
      </div>

      {feedback ? (
        <div
          role="status"
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            background: '#171B24',
            border: `1px solid ${feedback.tone === 'error' ? '#F0245C' : '#21E0DC'}`,
            color: '#F2F5F9',
            fontSize: 13.5,
          }}
        >
          {feedback.text}
        </div>
      ) : null}

      {/* Live Grant Budget Status (E12) */}
      <section
        aria-label="Grant Session Status"
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, color: '#FFFFFF' }}>Current Session Mode</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#B9C0CE' }}>
              Active mode:{' '}
              <strong style={{ color: statusData?.active ? '#21E0DC' : '#F2F5F9' }}>
                {statusData?.active ? 'LIVE AI UNLOCKED (Grant Redeemed)' : 'REPLAY MODE (Zero Cookies Set)'}
              </strong>
            </p>
          </div>
          {statusData?.summary ? (
            <button type="button" onClick={handleLogout} style={{ ...btnStyle, borderColor: '#F0245C', color: '#FF5C86' }}>
              End Session &amp; Clear Cookie
            </button>
          ) : null}
        </div>

        {statusData?.summary ? (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #232836',
              fontSize: 13,
              color: '#B9C0CE',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            <div>
              <div style={{ color: '#8A93A6', fontSize: 11.5 }}>Weighted Tokens Remaining</div>
              <strong style={{ color: '#FFFFFF', fontSize: 15 }}>
                {statusData.summary.remainingTokensWeighted ??
                  Math.max(0, statusData.summary.tokenBudgetWeighted - statusData.summary.tokensUsedWeighted)}{' '}
                / {statusData.summary.tokenBudgetWeighted}
              </strong>
            </div>
            <div>
              <div style={{ color: '#8A93A6', fontSize: 11.5 }}>Live Calls Remaining</div>
              <strong style={{ color: '#FFFFFF', fontSize: 15 }}>
                {statusData.summary.remainingCalls ??
                  Math.max(0, statusData.summary.callsBudget - statusData.summary.callsUsed)}{' '}
                / {statusData.summary.callsBudget}
              </strong>
            </div>
            <div>
              <div style={{ color: '#8A93A6', fontSize: 11.5 }}>Session Expires</div>
              <strong style={{ color: '#FFFFFF', fontSize: 13 }}>{statusData.summary.expiresAt}</strong>
            </div>
          </div>
        ) : null}
      </section>

      {/* Fragment / Manual Grant Code Redemption */}
      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>Redeem a Single-Use Grant Code</h2>
        {fragmentDetected ? (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#21E0DC' }}>
            Grant code loaded from your <code>#code=</code> URL fragment and scrubbed from the address bar. Click below
            to complete single-use redemption (explicit click prevents email link-preview scanners from burning your
            grant).
          </p>
        ) : (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#B9C0CE', lineHeight: 1.55 }}>
            Paste a hand-shared or emailed <code>BLR-...</code> grant code. Redeeming sets one strictly necessary{' '}
            <code>HttpOnly; SameSite=Lax</code> session cookie for up to 24 hours.
          </p>
        )}

        <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
            Single-Use Grant Code
            <input
              type="text"
              aria-label="Single-Use Grant Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BLR-XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              style={inputStyle}
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="submit"
              disabled={busyRedeem}
              style={{ ...btnStyle, background: '#21E0DC', color: '#08090D', borderColor: '#21E0DC' }}
            >
              {busyRedeem ? 'Redeeming...' : 'Redeem Single-Use Grant'}
            </button>
            <Link href="/press" style={btnStyle}>
              Use Signal Press Offline Instead
            </Link>
          </div>
        </form>
      </section>

      {/* Invite-Only + Owner-Approved Grant Request Queue with Self-Hosted ALTCHA */}
      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: '1 1 260px' }}>
            <h2 style={{ margin: 0, fontSize: 17, color: '#FFFFFF' }}>Request Reviewer Grant (Owner-Approved Queue)</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#B9C0CE', lineHeight: 1.5 }}>
              To protect free-tier LLM and data quotas, live grants are never auto-minted publicly. Submitting below
              verifies a browser proof-of-work check and notifies the architect via Telegram to approve and issue a
              single-use <code>BLR-...</code> grant (25 live calls / 48h TTL).
            </p>
          </div>
          <button type="button" onClick={() => setShowRequestForm(!showRequestForm)} style={btnStyle}>
            {showRequestForm ? 'Hide Request Form' : 'Request Owner Approval'}
          </button>
        </div>

        {showRequestForm ? (
          <form onSubmit={handleRequestGrant} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: '#B9C0CE', lineHeight: 1.55 }}>
              <strong>Data minimization notice:</strong> Your contact fields are held only in transient server memory to
              notify the owner for manual grant approval and are never stored in our Postgres database. Review{' '}
              <Link href="/privacy" style={{ color: '#21E0DC' }}>
                /privacy
              </Link>{' '}
              for full details.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Your Name (Optional)
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Hiring Manager / Technical Reviewer"
                  maxLength={80}
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Organization / Role (Optional)
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Company or Role Context"
                  maxLength={100}
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Work Email (for approved single-use #code= link)
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reviewer@example.com"
                autoComplete="email"
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Review Context Note (Optional)
              <input
                type="text"
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="e.g., Inspecting SSoT RAG + Syndicate Quant Engine"
                maxLength={200}
                style={inputStyle}
              />
            </label>

            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: '#08090D',
                border: '1px solid #232836',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, color: '#F2F5F9' }}>
                Self-Hosted ALTCHA Proof-of-Work ({altchaState === 'verified' ? 'Verified' : altchaState})
              </span>
              <button
                type="button"
                onClick={handleRunAltcha}
                disabled={altchaState === 'working' || altchaState === 'verified'}
                style={{
                  ...btnStyle,
                  borderColor: altchaState === 'verified' ? '#21E0DC' : '#232836',
                  color: altchaState === 'verified' ? '#21E0DC' : '#F2F5F9',
                }}
              >
                {altchaState === 'verified'
                  ? 'Challenge Verified'
                  : altchaState === 'working'
                    ? 'Verifying in Browser...'
                    : 'Verify Browser Challenge'}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={busyRequest || altchaState !== 'verified'}
                style={{
                  ...btnStyle,
                  background: altchaState === 'verified' ? '#F0245C' : '#171B24',
                  borderColor: '#F0245C',
                  color: '#FFFFFF',
                  opacity: altchaState === 'verified' ? 1 : 0.6,
                }}
              >
                {busyRequest ? 'Submitting Request...' : 'Submit for Owner Approval'}
              </button>
            </div>

            {requestFeedback ? (
              <p role="status" style={{ margin: 0, fontSize: 13, color: '#21E0DC' }}>
                {requestFeedback}
              </p>
            ) : null}
          </form>
        ) : null}
      </section>
    </div>
  );
}
