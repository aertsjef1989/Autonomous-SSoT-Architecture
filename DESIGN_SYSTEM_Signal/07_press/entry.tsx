import React from 'react';
import { createRoot } from 'react-dom/client';
import { SignalPressWorkspace } from '../../balaerion-app/src/components/SignalPressWorkspace';

function StaticPressShell() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#08090D',
        color: '#F2F5F9',
        fontFamily: "'Carlito', 'Calibri', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: '1px solid #232836',
          backgroundColor: '#0D1017',
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', gap: 5 }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#F0245C', display: 'inline-block' }} />
            <i style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#21E0DC', display: 'inline-block' }} />
          </span>
          <strong style={{ fontSize: 15, letterSpacing: '0.06em', color: '#FFFFFF' }}>
            SIGNAL PRESS · STANDALONE OFFLINE EDITION
          </strong>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a
            href="../../index.html"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #232836',
              backgroundColor: '#171B24',
              color: '#F2F5F9',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Back to Architecture Book
          </a>
          <a
            href="../02_studio/signal-studio.html"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #21E0DC',
              backgroundColor: '#171B24',
              color: '#21E0DC',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Open Signal Studio (Slides)
          </a>
        </nav>
      </header>
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 16px 48px' }}>
        <SignalPressWorkspace assetBasePath="./press-assets" samplesBasePath="./press-samples" />
      </main>
    </div>
  );
}

const container = document.getElementById('signal-press-root');
if (container) {
  createRoot(container).render(<StaticPressShell />);
}
