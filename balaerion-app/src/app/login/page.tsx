import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{ maxWidth: 520, margin: '32px auto', background: '#11141B', border: '1px solid #232836', borderRadius: 10, padding: 24 }}>
      <h1 style={{ fontSize: 20, margin: '0 0 10px', color: '#FFFFFF' }}>Open Replay Workspace</h1>
      <p style={{ fontSize: 14, color: '#B9C0CE', lineHeight: 1.6, margin: '0 0 18px' }}>
        Reading this portfolio and using every Replay surface or offline Signal Press tool requires no password or account. Only live LLM calls require a single-use grant code.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link
          href="/"
          style={{
            padding: '10px 16px',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 8,
            background: '#21E0DC',
            color: '#08090D',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Go to Workspace Hub
        </Link>
        <Link
          href="/redeem"
          style={{
            padding: '10px 16px',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 8,
            border: '1px solid #232836',
            color: '#F2F5F9',
            textDecoration: 'none',
          }}
        >
          Redeem Live AI Grant
        </Link>
      </div>
    </div>
  );
}
