'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useFormStore } from '@/stores/formStore';

const NAV = [
  { label: 'New Entry', href: '/new-entry' },
  { label: 'My Drafts', href: '/drafts' },
];

interface Draft {
  id: string; formReferenceId: string; patientName: string;
  dateCreated: string; lastUpdated: string; completionPct: number; currentSection: number;
}

function DraftsInner() {
  const router = useRouter();
  const loadDraft = useFormStore((s) => s.loadDraft);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { const { drafts } = await api.get<{ drafts: Draft[] }>('/drafts'); setDrafts(drafts); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const cont = async (id: string) => { await loadDraft(id); router.push('/new-entry'); };
  const remove = async (id: string) => { await api.del(`/drafts/${id}`); refresh(); };

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>My Drafts</h1>
      {loading ? <p style={{ color: '#8a8a8a' }}>Loading…</p> :
        drafts.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#8a8a8a' }}>
            No drafts yet. <button className="btn btn-primary" style={{ marginLeft: 12 }} onClick={() => router.push('/new-entry')}>Start a new form</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#0a0a0a', textAlign: 'left' }}>
                  {['Reference', 'Patient', 'Created', 'Updated', 'Completion', ''].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#00bcd4' }}>{d.formReferenceId.slice(0, 8)}</td>
                    <td style={{ padding: '12px 16px' }}>{d.patientName || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#8a8a8a' }}>{new Date(d.dateCreated).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', color: '#8a8a8a' }}>{new Date(d.lastUpdated).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 5, background: '#1f1f1f', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${d.completionPct}%`, height: '100%', background: '#00bcd4' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#8a8a8a' }}>{d.completionPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', marginRight: 8 }} onClick={() => cont(d.id)}>Continue</button>
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => remove(d.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
}

export default function DraftsPage() {
  return (
    <AuthGuard allow={['user']}>
      <AppShell nav={NAV}><DraftsInner /></AppShell>
    </AuthGuard>
  );
}
