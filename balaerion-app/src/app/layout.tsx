import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { WorkspaceModeBadge } from '@/components/WorkspaceModeBadge';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08090D',
};

export const metadata: Metadata = {
  title: 'Systems Design Workspace (Unlisted POC)',
  description: 'Interactive portfolio workspace: SSoT, Balaerion, Syndicate, Signal Studio, and Signal Press.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
  referrer: 'no-referrer',
};

const navLinks = [
  { href: '/', label: 'Hub' },
  { href: '/ssot', label: 'SSoT Wiki' },
  { href: '/balaerion', label: 'Balaerion' },
  { href: '/syndicate', label: 'Syndicate' },
  { href: '/studio', label: 'Signal Studio' },
  { href: '/press', label: 'Signal Press' },
  { href: '/redeem', label: 'Redeem Grant' },
  { href: '/admin', label: 'Owner' },
  { href: '/privacy', label: 'Privacy' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: '#08090D',
          color: '#F2F5F9',
          fontFamily: '"Carlito", "Calibri", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          minHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            backgroundColor: '#11141B',
            borderBottom: '1px solid #232836',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.8px', marginRight: '8px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#F0245C', display: 'inline-block' }} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#21E0DC', display: 'inline-block' }} />
            SIGNAL WORKSPACE
          </span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} aria-label="Workspace navigation">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: '#B9C0CE',
                  textDecoration: 'none',
                  padding: '10px 12px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  border: '1px solid #232836',
                  fontSize: '13.5px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <WorkspaceModeBadge />
        </header>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px 88px', boxSizing: 'border-box' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
