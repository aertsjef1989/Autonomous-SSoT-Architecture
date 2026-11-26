import Link from 'next/link';
import { ProviderStatusBar } from '@/components/ProviderStatusBar';

const cards = [
  {
    href: '/ssot',
    title: 'Pillar I: SSoT Wiki & Conversational RAG',
    tag: 'Drive -> Supabase Hybrid Search',
    desc: 'Zero-commit Drive corpus (GLOBAL + NL/BE/FR inheritance), conversational /ask & /check chat with citations, and Signal Studio/Press handoff.',
  },
  {
    href: '/balaerion',
    title: 'Pillar II: Balaerion Workbench & ProspectHub',
    tag: '12-Provider EU & General Pool',
    desc: 'Standalone multi-provider LLM workbench (Mode A) plus 7-state ProspectHub GTM suite (Mode B) with one-click Studio & Press handoff.',
  },
  {
    href: '/syndicate',
    title: 'Pillar III: Syndicate Live Matchday AI',
    tag: 'Live UCL Feeds + Poisson xG',
    desc: 'Live football-data.org / The Odds API feed with automatic simulation fallback, Poisson edge calculator, NAV ledger, and grounded chat.',
  },
  {
    href: '/studio',
    title: 'Signal Studio (16:9 Slide Composer)',
    tag: '63 Devices · JSON Handoff v1',
    desc: 'Interactive 16:9 deck preview with H01-H63 vector devices, slide editing, and deterministic handoff to Signal Press.',
  },
  {
    href: '/press',
    title: 'Signal Press (A4 Document Designer)',
    tag: 'DOCX · Google Docs · PDF · Email',
    desc: 'A4 document designer with 63 hero devices, rich comparison/timeline/checklist blocks, removable AI Assist, and blocking lint.',
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '26px', color: '#FFFFFF' }}>
        Systems Design Portfolio: Interactive Workspace
      </h1>
      <p style={{ color: '#B9C0CE', maxWidth: '780px', lineHeight: 1.6, marginBottom: '16px' }}>
        All three architecture pillars and both Signal design tools run inside one unlisted workspace. Visitors can browse every surface in Replay Mode without an account; single-use grants unlock on <Link href="/redeem" style={{ color: '#21E0DC' }}>/redeem</Link>, and the unlocked <Link href="/admin" style={{ color: '#21E0DC' }}>/admin</Link> Owner session enables unlimited Live LLM, Drive SSoT, and Syndicate feeds.
      </p>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#15171F',
          borderLeft: '3px solid #21E0DC',
          color: '#B9C0CE',
          fontSize: '13px',
          lineHeight: 1.5,
          marginBottom: '20px',
        }}
      >
        <strong style={{ color: '#FFFFFF' }}>Security Boundary Note (D9):</strong> An unlisted URL provides obscurity against casual indexing, not access control. Public Replay mode serves synthetic data only, while live routes enforce Owner authentication or cryptographic single-use grants, atomic token budgets, and a global daily circuit breaker.
      </div>

      <ProviderStatusBar />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
        }}
      >
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: 'block',
              padding: '18px',
              backgroundColor: '#11141B',
              border: '1px solid #232836',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#F2F5F9',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#21E0DC', marginBottom: '6px' }}>
              {c.tag}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '17px', color: '#FFFFFF' }}>{c.title}</h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#B9C0CE', lineHeight: 1.55 }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
