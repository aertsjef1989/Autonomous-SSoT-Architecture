import Link from 'next/link';

const cards = [
  {
    href: '/ssot',
    title: 'Pillar I: SSoT Wiki & Governance',
    tag: '100-Seat Reference Model',
    desc: 'DMADV lifecycle monitor, 14-detector status board, normalized BI CSV/JSON export, and synthetic records.',
  },
  {
    href: '/balaerion',
    title: 'Pillar II: Balaerion & ProspectHub',
    tag: 'EU vs General Lanes',
    desc: 'Config-driven multi-provider gateway console, interactive PII gate tester, and 7-state synthetic account workspace.',
  },
  {
    href: '/syndicate',
    title: 'Pillar III: Syndicate Simulator',
    tag: 'Simulation Only',
    desc: 'Poisson/xG 1X2 and Over/Under probability calculator plus unit-share NAV mint/burn prototype (virtual units only).',
  },
  {
    href: '/studio',
    title: 'Signal Studio (Slide Handoff)',
    tag: 'JSON Handoff v1',
    desc: 'Slide deck composer, legacy DECK JSON adapter, and deterministic handoff to Signal Press.',
  },
  {
    href: '/press',
    title: 'Signal Press (Document Designer)',
    tag: 'Offline-First',
    desc: 'Client-side A4 document designer (DOCX, Google Docs, PDF, Email HTML, Markdown) with blocking pre-export lint.',
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '26px', color: '#FFFFFF' }}>
        Systems Design Portfolio: Interactive Workspace
      </h1>
      <p style={{ color: '#B9C0CE', maxWidth: '760px', lineHeight: 1.6, marginBottom: '16px' }}>
        All three architecture pillars and both Signal design tools run inside one unlisted workspace. Anyone with this link can browse every page and run Replay or Offline tools without an account. Only live AI calls require a single-use grant redeemed on <Link href="/redeem" style={{ color: '#21E0DC' }}>/redeem</Link>.
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
          marginBottom: '24px',
        }}
      >
        <strong style={{ color: '#FFFFFF' }}>Security Boundary Note (D9):</strong> An unlisted URL provides obscurity against casual indexing, not access control. Every public or Replay dataset here is 100% synthetic, and live provider routes enforce cryptographic single-use grants, atomic token budgets, and a global daily circuit breaker.
      </div>
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
