import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Systems Architecture Workspace (Unlisted POC)',
  description: 'Interactive portfolio workspace: SSoT, Balaerion, Syndicate, Signal Studio, and Signal Press.',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

const navLinks = [
  { href: '/', label: 'Hub' },
  { href: '/ssot', label: 'SSoT Wiki' },
  { href: '/balaerion', label: 'Balaerion' },
  { href: '/syndicate', label: 'Syndicate' },
  { href: '/studio', label: 'Signal Studio' },
  { href: '/press', label: 'Signal Press' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/admin', label: 'Admin' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        backgroundColor: '#08090D',
        color: '#F2F5F9',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100dvh',
      }}>
        <header style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          backgroundColor: '#11141B',
          borderBottom: '1px solid #232836',
        }}>
          <span style={{ fontWeight: 700, color: '#21E0DC', letterSpacing: '0.8px', marginRight: '8px' }}>
            SIGNAL WORKSPACE
          </span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: '#B9C0CE',
                  textDecoration: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #232836',
                  fontSize: '13px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span style={{
            marginLeft: 'auto',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: '#171B24',
            border: '1px solid #21E0DC',
            color: '#21E0DC',
          }}>
            Mode: Replay (Tier 1)
          </span>
        </header>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 80px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
