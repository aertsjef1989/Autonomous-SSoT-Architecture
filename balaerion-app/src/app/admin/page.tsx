'use client';

import React, { useState } from 'react';

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

export default function AdminGrantsAndSyncPage() {
  const [ownerSecret, setOwnerSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tokenBudget, setTokenBudget] = useState(12000);
  const [callsBudget, setCallsBudget] = useState(25);
  const [ttlHours, setTtlHours] = useState(48);
  const [statusMsg, setStatusMsg] = useState('');
  const [minted, setMinted] = useState<{ code: string; redeemFragmentUrl: string; expiresAt: string } | null>(null);

  const [syncForce, setSyncForce] = useState(false);
  const [syncCategoryHint, setSyncCategoryHint] = useState('Formats_and_Tools');
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');
  const [tgBusy, setTgBusy] = useState(false);
  const [tgResult, setTgResult] = useState<string>('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    const res = await fetch('/api/auth/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ownerSecret }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMsg(data.error || 'Owner authentication failed.');
      return;
    }
    setOwnerSecret('');
    setUnlocked(true);
    setStatusMsg('Owner session active (Unlimited Live LLM, Drive SSoT, Syndicate & Signal Press AI Assist unlocked).');
  };

  const handleTelegramPing = async () => {
    setTgBusy(true);
    setTgResult('');
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Manual ping from Owner Console' }),
      });
      const data = await res.json().catch(() => ({}));
      setTgResult(data.message || data.error || `HTTP ${res.status}`);
    } finally {
      setTgBusy(false);
    }
  };

  const handleServiceAccountSync = async () => {
    setSyncBusy(true);
    setSyncResult('');
    try {
      const res = await fetch('/api/admin/sync-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'service_account', force: syncForce }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncResult(json.error || 'Sync failed.');
      } else {
        setSyncResult(
          `Drive API Sync complete: ${json.upserted} upserted, ${json.unchangedSkipped} unchanged skipped, ${json.outOfScopeSkipped} out-of-scope skipped.`
        );
      }
    } finally {
      setSyncBusy(false);
    }
  };

  const handleInMemoryFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setSyncBusy(true);
    setSyncResult('');
    try {
      const batch: Array<{
        driveFileId: string;
        title: string;
        parentFolderName: string;
        contentMd: string;
        driveModifiedAt: string;
      }> = [];

      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const text = await f.text();
        const relPath = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        const parts = relPath.split('/');
        const folderName = parts.length >= 2 ? parts[parts.length - 2] : syncCategoryHint;
        const baseTitle = f.name.replace(/\.(md|markdown|txt)$/i, '');
        batch.push({
          driveFileId: `mem-${baseTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`,
          title: baseTitle,
          parentFolderName: folderName,
          contentMd: text,
          driveModifiedAt: new Date(f.lastModified || Date.now()).toISOString(),
        });
      }

      const res = await fetch('/api/admin/sync-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'push_batch', force: syncForce, docs: batch }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncResult(json.error || 'In-memory batch upsert failed.');
      } else {
        setSyncResult(
          `In-memory upsert complete: ${json.upserted} upserted (${(json.docIds || []).join(', ') || 'none'}), ${json.unchangedSkipped} unchanged, ${json.outOfScopeSkipped} out-of-scope skipped.`
        );
      }
    } finally {
      setSyncBusy(false);
      e.target.value = '';
    }
  };

  const [sendToEmail, setSendToEmail] = useState('');

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setMinted(null);
    const res = await fetch('/api/admin/grants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenBudgetWeighted: Number(tokenBudget),
        callsBudget: Number(callsBudget),
        ttlHours: Number(ttlHours),
        sendToEmail: sendToEmail.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMsg(data.error || 'Failed to mint grant.');
      return;
    }
    setMinted({
      code: data.code,
      redeemFragmentUrl: data.redeemFragmentUrl,
      expiresAt: data.expiresAt,
    });
    setSendToEmail('');
    setStatusMsg(
      data.emailNotice || 'Minted single-use grant. Copy now; only the salted HMAC is stored in the database.'
    );
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0, fontSize: 24, color: '#FFFFFF' }}>Owner Console: SSoT Sync &amp; Grant Issuer</h1>
      <p style={{ color: '#B9C0CE', fontSize: 14, lineHeight: 1.6 }}>
        Manage the zero-commit SSoT pipeline (<code>Google Drive / RAM -&gt; Supabase -&gt; /ssot</code>, scoped to{' '}
        <code>NL</code>, <code>BE</code>, <code>FR</code>, and <code>GLOBAL</code>), approve incoming Telegram reviewer
        requests, and mint hand-shared single-use <code>BLR-...</code> grants.
      </p>

      {statusMsg ? (
        <div
          role="status"
          style={{
            background: '#171B24',
            border: '1px solid #21E0DC',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 13.5,
            color: '#F2F5F9',
            overflowWrap: 'anywhere',
          }}
        >
          {statusMsg}
        </div>
      ) : null}

      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>1. Unlock Owner Session</h2>
        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
            Owner Access Secret
            <input
              type="password"
              value={ownerSecret}
              onChange={(e) => setOwnerSecret(e.target.value)}
              placeholder="Enter OWNER_ACCESS_SECRET"
              autoComplete="off"
              style={inputStyle}
            />
          </label>
          <div>
            <button type="submit" style={{ ...btnStyle, background: '#21E0DC', color: '#08090D', borderColor: '#21E0DC' }}>
              {unlocked ? 'Refresh Owner Session' : 'Unlock Owner Console'}
            </button>
          </div>
        </form>
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
          2. Sync SSoT Corpus to Supabase (Zero-Commit Memory Pipeline)
        </h2>
        <p style={{ color: '#B9C0CE', fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
          Pushes from <code>docs/google-apps-script-sync.gs</code> (zero GCP Console needed) hit{' '}
          <code>POST /api/admin/sync-drive</code> automatically. You can also upload exported <code>.md</code> files
          directly in browser memory below, or trigger Service Account sync if configured.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Default Category (when filename has no subfolder)
            <select
              value={syncCategoryHint}
              onChange={(e) => setSyncCategoryHint(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              <option value="Formats_and_Tools">Formats_and_Tools</option>
              <option value="Verticals">Verticals</option>
              <option value="Policies">Policies</option>
              <option value="Templates">Templates</option>
              <option value="Campaigns">Campaigns</option>
              <option value="Lifecycle">Lifecycle</option>
              <option value="Markets">Markets</option>
            </select>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, fontSize: 13, color: '#F2F5F9', marginTop: 14 }}>
            <input
              type="checkbox"
              checked={syncForce}
              onChange={(e) => setSyncForce(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#21E0DC' }}
            />
            Force overwrite unchanged timestamps
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <label
            style={{
              ...btnStyle,
              display: 'inline-flex',
              alignItems: 'center',
              borderColor: '#21E0DC',
              color: '#21E0DC',
            }}
          >
            {syncBusy ? 'Syncing in RAM...' : 'Upload Markdown Files (RAM -> Supabase)'}
            <input
              type="file"
              accept=".md,.markdown,.txt"
              multiple
              disabled={syncBusy}
              onChange={handleInMemoryFilesUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            disabled={syncBusy}
            onClick={handleServiceAccountSync}
            style={btnStyle}
          >
            Sync from Google Drive (Service Account)
          </button>
        </div>

        {syncResult ? (
          <div
            role="status"
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #21E0DC',
              fontSize: 13,
              color: '#F2F5F9',
              overflowWrap: 'anywhere',
            }}
          >
            {syncResult}
          </div>
        ) : null}
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
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>3. Approve &amp; Mint Single-Use Reviewer Grant</h2>
        <p style={{ color: '#B9C0CE', fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
          When a recruiter requests access on GitHub or <code>/redeem</code>, review the Telegram alert and mint a
          bounded <code>BLR-...</code> grant below. Leave the email field blank to copy the fragment URL manually, or
          fill it to dispatch via Resend immediately.
        </p>
        <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Weighted Token Budget
              <input
                type="number"
                min={500}
                max={100000}
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Max Live LLM Calls
              <input
                type="number"
                min={1}
                max={200}
                value={callsBudget}
                onChange={(e) => setCallsBudget(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Expiry Window (Hours)
              <input
                type="number"
                min={1}
                max={168}
                value={ttlHours}
                onChange={(e) => setTtlHours(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
          </div>
          <label style={{ fontSize: 13, color: '#B9C0CE', display: 'flex', flexDirection: 'column', gap: 6 }}>
            Approved Reviewer Email (Optional 1-Click Resend Dispatch)
            <input
              type="email"
              value={sendToEmail}
              onChange={(e) => setSendToEmail(e.target.value)}
              placeholder="Leave blank to copy #code= link manually, or enter reviewer@company.com"
              style={inputStyle}
            />
          </label>
          <div>
            <button type="submit" style={{ ...btnStyle, borderColor: '#F0245C', color: '#FFFFFF', background: '#F0245C' }}>
              {sendToEmail.trim() ? 'Mint & Dispatch Approved Grant' : 'Mint Single-Use Grant Code'}
            </button>
          </div>
        </form>

        {minted ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 8,
              background: '#08090D',
              border: '1px solid #21E0DC',
              overflowWrap: 'anywhere',
            }}
          >
            <div style={{ fontSize: 12, color: '#21E0DC', fontWeight: 700, marginBottom: 6 }}>
              SINGLE-USE GRANT READY (DISPLAYED ONCE)
            </div>
            <p style={{ margin: '4px 0', fontSize: 13.5 }}>
              <strong>Code:</strong> <code>{minted.code}</code>
            </p>
            <p style={{ margin: '4px 0', fontSize: 13.5 }}>
              <strong>Fragment URL:</strong> <code>{minted.redeemFragmentUrl}</code>
            </p>
            <p style={{ margin: '4px 0', fontSize: 12.5, color: '#B9C0CE' }}>Expires: {minted.expiresAt}</p>
          </div>
        ) : null}
      </section>

      <section
        style={{
          background: '#11141B',
          border: '1px solid #232836',
          borderRadius: 10,
          padding: 18,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 17, color: '#FFFFFF' }}>4. Telegram Owner Approval Channel &amp; Diagnostics</h2>
        <p style={{ color: '#B9C0CE', fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
          Verify that <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_OWNER_ID</code> receive Reviewer Grant approval
          requests and live provider health summaries.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button type="button" disabled={tgBusy} onClick={handleTelegramPing} style={{ ...btnStyle, borderColor: '#21E0DC', color: '#21E0DC' }}>
            {tgBusy ? 'Sending Ping...' : 'Send Test Alert to Telegram'}
          </button>
        </div>
        {tgResult ? (
          <p role="status" style={{ margin: '10px 0 0', fontSize: 13, color: '#21E0DC', overflowWrap: 'anywhere' }}>
            {tgResult}
          </p>
        ) : null}
      </section>
    </div>
  );
}
