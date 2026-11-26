'use client';

import React, { useEffect, useState } from 'react';

export function WorkspaceModeBadge() {
  const [label, setLabel] = useState('Mode: Replay (No Grant Needed)');
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/grants/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.role === 'owner' && data.active) {
          setLabel('Mode: Owner Live (Unlimited)');
          setLive(true);
        } else if (data.active && data.mode === 'live') {
          const calls = data.summary?.remainingCalls;
          setLabel(typeof calls === 'number' ? `Mode: Live Grant (${calls} calls left)` : 'Mode: Live Grant Active');
          setLive(true);
        }
      })
      .catch(() => {
        /* default Replay badge */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <span
      style={{
        marginLeft: 'auto',
        fontSize: '12px',
        padding: '6px 12px',
        borderRadius: '999px',
        backgroundColor: live ? 'rgba(33, 224, 220, 0.16)' : '#171B24',
        border: '1px solid #21E0DC',
        color: '#21E0DC',
        fontWeight: live ? 700 : 500,
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {label}
    </span>
  );
}
