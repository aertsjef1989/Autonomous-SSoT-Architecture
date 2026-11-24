'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Access denied. Invalid password.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, background: '#11141E', border: '1px solid #252B3B', borderRadius: 12, padding: 24 }}>
        <h1 style={{ fontSize: 18, margin: '0 0 6px' }}>Balaerion v1 · Edge Gate</h1>
        <p style={{ fontSize: 13, color: '#8E98B0', margin: '0 0 18px' }}>Private instance. Enter owner access password.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access password"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #252B3B', background: '#171B26', color: '#ECEFF6', marginBottom: 12, boxSizing: 'border-box' }}
        />
        {error && <div style={{ color: '#F0245C', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#21E0DC', color: '#08090D', fontWeight: 700, cursor: 'pointer' }}>
          Unlock Workspace
        </button>
      </form>
    </main>
  );
}
