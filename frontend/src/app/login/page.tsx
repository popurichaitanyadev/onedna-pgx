'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type Role } from '@/stores/authStore';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [role, setRole] = useState<Role>('user');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!userId.trim() || !password) { setError('Please enter your User ID and password.'); return; }
    setBusy(true);
    try {
      const user = await login(userId.trim(), password, role);
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/new-entry');
    } catch (err) {
      // Generic message — no user enumeration (PRD §6.1)
      setError(err instanceof ApiError ? 'Invalid credentials.' : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'radial-gradient(circle at 30% 20%, rgba(0,188,212,0.08), transparent 50%), #000' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          One<span style={{ color: '#00bcd4' }}>DNA</span>
        </div>
        <div style={{ fontSize: 11, color: '#8a8a8a', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
          Semaglutide PGX Portal
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 28, marginBottom: 6 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 24 }}>Select your role and enter your credentials.</p>

        {/* Role selector (PRD §5) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {(['user', 'admin'] as Role[]).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              style={{
                padding: '10px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
                background: role === r ? 'rgba(0,188,212,0.12)' : 'transparent',
                border: `1px solid ${role === r ? '#00bcd4' : '#1f1f1f'}`,
                color: role === r ? '#00bcd4' : '#fff',
              }}>
              {r === 'user' ? 'Hospital User' : 'Administrator'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 4, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="lbl">User ID</label>
          <input className="inp" value={userId} onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="e.g. cityhospital01" autoComplete="username" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="lbl">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="inp" type={showPwd ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a8a', fontSize: 14 }}>
              {showPwd ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p style={{ fontSize: 12, color: '#555', marginTop: 20, textAlign: 'center' }}>
          Accounts are provisioned by your administrator. No self-registration.
        </p>
      </div>
    </div>
  );
}
