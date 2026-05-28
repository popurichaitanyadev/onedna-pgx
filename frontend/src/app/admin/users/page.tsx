'use client';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { ADMIN_NAV } from '@/lib/admin-nav';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string; name: string; userId: string; phone: string | null;
  address: string | null; isActive: boolean; createdAt: string;
}

const emptyForm = { name: '', userId: '', password: '', confirmPassword: '', phone: '', address: '' };

function UsersInner() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = async () => { const { users } = await api.get<{ users: User[] }>('/admin/users'); setUsers(users); };
  useEffect(() => { refresh(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    setErrors({});
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Name is required';
    if (form.userId.trim().length < 3) e.userId = 'User ID must be at least 3 characters';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await api.post('/admin/users', form);
      setForm(emptyForm); setShowForm(false); setToast('User created.'); refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ userId: 'User ID already exists' });
      else if (err instanceof ApiError && err.details) {
        const mapped: Record<string, string> = {};
        Object.entries(err.details).forEach(([k, v]) => (mapped[k] = v[0]));
        setErrors(mapped);
      } else setToast('Could not create user.');
    } finally { setBusy(false); }
  };

  const toggleActive = async (u: User) => {
    await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive });
    refresh();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add User'}</button>
      </div>

      {showForm && (
        <div className="card fade-up" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create Hospital User</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {([
              ['Full Name', 'name', 'text'], ['User ID', 'userId', 'text'],
              ['Password', 'password', 'password'], ['Confirm Password', 'confirmPassword', 'password'],
              ['Contact Number', 'phone', 'text'], ['Address', 'address', 'text'],
            ] as const).map(([label, key, type]) => (
              <div key={key}>
                <label className="lbl">{label}{['name', 'userId', 'password', 'confirmPassword'].includes(key) && <span className="req">*</span>}</label>
                <input className={`inp ${errors[key] ? 'err' : ''}`} type={type} value={(form as any)[key]} onChange={set(key)} />
                {errors[key] && <div className="errtext">{errors[key]}</div>}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={create} disabled={busy}>
            {busy ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#0a0a0a', textAlign: 'left' }}>
              {['Name', 'User ID', 'Phone', 'Address', 'Created', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #1f1f1f' }}>
                <td style={{ padding: '10px 16px' }}>{u.name}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13 }}>{u.userId}</td>
                <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>{u.phone || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>{u.address || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: u.isActive ? 'rgba(0,188,212,0.12)' : 'rgba(239,68,68,0.12)', color: u.isActive ? '#00bcd4' : '#fca5a5' }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#8a8a8a' }}>No users yet</td></tr>}
          </tbody>
        </table>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#121212', border: '1px solid #00bcd4', padding: '12px 18px', borderRadius: 6, fontSize: 14 }}>{toast}</div>}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard allow={['admin']}>
      <AppShell nav={ADMIN_NAV} bell={<NotificationBell />}><UsersInner /></AppShell>
    </AuthGuard>
  );
}
