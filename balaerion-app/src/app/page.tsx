import Link from 'next/link';

const cards = [
  { href: '/ssot', title: 'Pillar I: SSoT Wiki & Governance', desc: 'Browsable knowledge base, staleness controls, BI CSV/JSON export, and floating Balaerion chat.' },
  { href: '/balaerion', title: 'Pillar II: Balaerion & ProspectHub', desc: 'Task-aware multi-provider AI gateway, PII gate, and synthetic account research workspace.' },
  { href: '/syndicate', title: 'Pillar III: Syndicate Simulator', desc: 'Poisson/xG probability ladder, unit-share NAV ledger prototype (simulation only), and floating chat.' },
  { href: '/studio', title: 'Signal Studio (Slides)', desc: 'Standalone slide editor with 6 themes, 56 vector devices, and on-command JSON handoff.' },
  { href: '/press', title: 'Signal Press (Documents)', desc: 'Offline-first DOCX, PDF, email HTML, and Markdown designer with blocking pre-export lint.' },
];

export default function HomePage() {
  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '28px' }}>Systems Architecture Portfolio (Unlisted Workspace)</h1>
      <p style={{ color: '#B9C0CE', maxWidth: '720px', lineHeight: 1.6 }}>
        All three pillars and both Signal design tools run inside one unified deployment. Tier 1 exploration and Replay mode work immediately without a grant.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} style={{
            display: 'block',
            padding: '18px',
            backgroundColor: '#11141B',
            border: '1px solid #232836',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#F2F5F9',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '17px', color: '#21E0DC' }}>{c.title}</h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#B9C0CE', lineHeight: 1.5 }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
