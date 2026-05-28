'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { ADMIN_NAV } from '@/lib/admin-nav';
import { api } from '@/lib/api';

interface Sub {
  id: string; referenceNo: string; patientName: string;
  submittedBy: string; userId: string; submittedAt: string;
}

function DataInner() {
  const router = useRouter();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { submissions } = await api.get<{ submissions: Sub[] }>('/admin/submissions'); setSubs(submissions); }
      finally { setLoading(false); }
    })();
  }, []);

  // Group by submitting user (PRD §6.7)
  const grouped = subs.reduce<Record<string, { name: string; rows: Sub[] }>>((acc, s) => {
    acc[s.userId] = acc[s.userId] || { name: s.submittedBy, rows: [] };
    acc[s.userId].rows.push(s);
    return acc;
  }, {});

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Data</h1>
      {loading ? <p style={{ color: '#8a8a8a' }}>Loading…</p> :
        Object.keys(grouped).length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#8a8a8a' }}>No submissions yet.</div>
        ) : Object.entries(grouped).map(([uid, group]) => (
          <div key={uid} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
              {group.name} <span style={{ color: '#8a8a8a', fontSize: 13, fontWeight: 400 }}>· {group.rows.length} submission(s)</span>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#0a0a0a', textAlign: 'left' }}>
                    {['Reference', 'Patient', 'Collection Date', 'Physician', 'Status', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #1f1f1f' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#00bcd4' }}>{s.referenceNo}</td>
                      <td style={{ padding: '10px 16px' }}>{s.patientName}</td>
                      <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>{new Date(s.submittedAt).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>—</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(0,188,212,0.12)', color: '#00bcd4', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Submitted
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => router.push(`/admin/data/submissions/${s.id}`)}>More Info</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </>
  );
}

export default function AdminDataPage() {
  return (
    <AuthGuard allow={['admin']}>
      <AppShell nav={ADMIN_NAV} bell={<NotificationBell />}><DataInner /></AppShell>
    </AuthGuard>
  );
}
