import React from 'react';
import Link from 'next/link';

const cellHeader: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #232836',
  color: '#FFFFFF',
  fontSize: 12.5,
  whiteSpace: 'nowrap',
};

const cellBody: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #1B202C',
  color: '#B9C0CE',
  fontSize: 13,
  verticalAlign: 'top',
  lineHeight: 1.5,
};

export default function PrivacyNoticePage() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', boxSizing: 'border-box' }}>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: '#171B24',
          border: '1px solid #F0245C',
          color: '#F2F5F9',
          fontSize: 13,
          marginBottom: 18,
        }}
      >
        <strong>Draft operational privacy note (for owner review, not legal advice).</strong> This workspace is a
        non-commercial systems design proof of concept. Do not submit real client, employer, or personal data to Live
        AI prompts.
      </div>

      <h1 style={{ marginTop: 0, fontSize: 24, color: '#FFFFFF' }}>Privacy &amp; Data Minimization Notice (F1 / F3)</h1>
      <p style={{ color: '#B9C0CE', fontSize: 14, lineHeight: 1.6 }}>
        This architecture separates reading, offline document authoring, and live free-tier LLM calls so passive
        visitors leave zero application state and zero cookies.
      </p>

      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>1. Three Operating Modes</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#B9C0CE', fontSize: 13.5, lineHeight: 1.65 }}>
          <li>
            <strong>Signal Press Offline Mode:</strong> Runs 100% client-side in your browser. Zero network calls are
            made while editing or exporting DOCX, PDF, Email HTML, or Markdown. Optional browser{' '}
            <code>localStorage</code> autosave is off by default and includes a one-click clear button.
          </li>
          <li>
            <strong>Replay Mode (Default):</strong> Every workspace surface is readable without an account, password, or
            cookie. Pre-generated synthetic outputs and architecture walkthroughs load locally with zero analytics or
            third-party trackers.
          </li>
          <li>
            <strong>Live AI Mode (Single-Use Grant Only):</strong> Unlocked only when you explicitly redeem a single-use{' '}
            <code>BLR-...</code> grant code on{' '}
            <Link href="/redeem" style={{ color: '#21E0DC' }}>
              /redeem
            </Link>
            . Prompts must use synthetic test inputs only; deterministic pre-dispatch regex gates block VAT numbers,
            IBANs, emails, phones, and cross-lane violations before any upstream call or token deduction.
          </li>
        </ul>
      </section>

      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>2. Data Inventory &amp; Retention Schedule (F1)</h2>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                <th style={cellHeader}>Data Element</th>
                <th style={cellHeader}>Where Processed</th>
                <th style={cellHeader}>Stored Form</th>
                <th style={cellHeader}>Retention / Purge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cellBody}>Grant code</td>
                <td style={cellBody}>Supabase EU Postgres</td>
                <td style={cellBody}>
                  Public <code>kid</code> + 16-byte random salt + <code>HMAC-SHA256(pepper, salt || code)</code>. Raw
                  code is never stored; link uses <code>#code=</code> URL fragment.
                </td>
                <td style={cellBody}>48h issue TTL (24h post-redeem); deleted 7 days after expiry by hourly pg_cron.</td>
              </tr>
              <tr>
                <td style={cellBody}>Reviewer email (optional self-serve grant)</td>
                <td style={cellBody}>Server RAM + Resend API</td>
                <td style={cellBody}>
                  Never written to application DB or logs. If <code>COOLDOWN_MODE=hmac</code>, only{' '}
                  <code>HMAC-SHA256(pepper, email)</code> is kept to block mail-bombing (default{' '}
                  <code>COOLDOWN_MODE=off</code> stores nothing).
                </td>
                <td style={cellBody}>
                  App DB: 0s (or 24h HMAC cooldown). Resend free tier retains delivery metadata for 30 days.
                </td>
              </tr>
              <tr>
                <td style={cellBody}>Client IP (abuse &amp; brute-force guard)</td>
                <td style={cellBody}>Server RAM + Supabase TTL table</td>
                <td style={cellBody}>
                  Keyed only by daily-rotating <code>HMAC-SHA256(pepper || UTC_DATE, ip)</code>. Raw IP is never stored
                  by the application.
                </td>
                <td style={cellBody}>1-hour counter window; purged hourly by pg_cron. Hosting/Supabase platform logs: 1 day on Supabase Free.</td>
              </tr>
              <tr>
                <td style={cellBody}>ALTCHA bot challenge</td>
                <td style={cellBody}>Browser Web Crypto + Server RAM</td>
                <td style={cellBody}>Self-hosted SHA-256 challenge hash nonce (zero cookies, zero external scripts).</td>
                <td style={cellBody}>5-minute challenge TTL; purged hourly by pg_cron.</td>
              </tr>
              <tr>
                <td style={cellBody}>Grant session cookie (<code>balaerion_grant</code>)</td>
                <td style={cellBody}>Browser first-party cookie</td>
                <td style={cellBody}>
                  <code>HttpOnly; Secure; SameSite=Lax</code> HMAC-signed grant ID + session JTI + expiry.
                </td>
                <td style={cellBody}>Max 24 hours, or cleared immediately via &quot;End Session &amp; Clear Cookie&quot; on /redeem.</td>
              </tr>
              <tr>
                <td style={cellBody}>Live AI synthetic prompts</td>
                <td style={cellBody}>Server RAM + selected free LLM lane</td>
                <td style={cellBody}>Not persisted in application tables during stateless assist calls; synthetic inputs only.</td>
                <td style={cellBody}>Governed by admitted provider zero-retention / free-tier terms (documented per lane in P5).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>
          3. Cookie Exemption Basis (ePrivacy Art. 5(3) / V11)
        </h2>
        <p style={{ margin: '0 0 10px', color: '#B9C0CE', fontSize: 13.5, lineHeight: 1.6 }}>
          No cookies, analytics scripts, or tracking pixels are loaded on passive visits, Replay Mode, or Signal Press
          Offline Mode. Consequently, no cookie consent banner is shown.
        </p>
        <p style={{ margin: 0, color: '#B9C0CE', fontSize: 13.5, lineHeight: 1.6 }}>
          The single first-party cookie <code>balaerion_grant</code> is set strictly after you explicitly submit a grant
          code on <code>/redeem</code> solely to authenticate your bounded live-AI session across requests (Directive
          2002/58/EC Art. 5(3) Criterion B; Article 29 Working Party Opinion 04/2012, WP 194).
        </p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link
          href="/redeem"
          style={{
            minHeight: 44,
            padding: '10px 16px',
            borderRadius: 8,
            background: '#21E0DC',
            color: '#08090D',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Manage or Clear Grant Session
        </Link>
        <Link
          href="/"
          style={{
            minHeight: 44,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #232836',
            background: '#171B24',
            color: '#F2F5F9',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Return to Workspace Hub
        </Link>
      </div>
    </div>
  );
}
