import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Balaerion v1 — AI Workspace',
  description: 'Dual-mode AI Workspace & ProspectHub Multi-Persona Suite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0B0D13', color: '#ECEFF6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
