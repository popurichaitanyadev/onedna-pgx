'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { ADMIN_NAV } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { SECTIONS } from '@/lib/form-schema';

interface Detail {
  id: string; referenceNo: string; patientName: string;
  submittedBy: string; submittedByUserId: string; submittedAt: string;
  formData: Record<string, any>;
}

function DetailInner() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [d, setD] = useState<Detail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { submission } = await api.get<{ submission: Detail }>(`/admin/submissions/${id}`); setD(submission); }
      catch { setNotFound(true); }
    })();
  }, [id]);

  if (notFound) return <div className="card" style={{ padding: 40, textAlign: 'center', color: '#8a8a8a' }}>Submission not found.</div>;
  if (!d) return <p style={{ color: '#8a8a8a' }}>Loading…</p>;

  const fd = d.formData;

  return (
    <>
      <button className="btn btn-ghost" style={{ fontSize: 13, marginBottom: 16 }} onClick={() => router.back()}>← Back</button>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{d.patientName}</h1>
            <div style={{ fontSize: 13, color: '#8a8a8a', marginTop: 4 }}>
              Submitted by {d.submittedBy} ({d.submittedByUserId}) · {new Date(d.submittedAt).toLocaleString()}
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#00bcd4', alignSelf: 'center' }}>{d.referenceNo}</div>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <div key={s.id} className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#00bcd4' }}>{s.id}. {s.name}</div>

          {s.id === 6 ? (
            <div style={{ fontSize: 13 }}>
              {(fd.medications || []).filter((m: any) => m.drugName).length === 0 ? <span style={{ color: '#8a8a8a' }}>None recorded</span> :
                (fd.medications || []).filter((m: any) => m.drugName).map((m: any, i: number) => (
                  <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #141414' }}>
                    {m.drugName} — {m.dose || '—'} — {m.frequency || '—'} — {m.indication || '—'}
                  </div>
                ))}
            </div>
          ) : s.id === 10 ? (
            <div style={{ fontSize: 13 }}>
              {(fd.geneVariants || []).map((g: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 8, padding: '6px 0', borderBottom: '1px solid #141414' }}>
                  <span>{g.gene}</span><span style={{ color: '#8a8a8a' }}>{g.genotype || '—'}</span>
                  <span style={{ color: '#8a8a8a' }}>{g.method || '—'}</span><span style={{ color: '#8a8a8a' }}>{g.notes || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 13 }}>
              {s.fields.map((f) => {
                const v = fd[f.key];
                return (
                  <div key={f.key}>
                    <div style={{ color: '#8a8a8a', fontSize: 12 }}>{f.label}</div>
                    <div>{v === undefined || v === '' ? '—' : Array.isArray(v) ? v.join(', ') : String(v)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Consent */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#00bcd4' }}>Declaration</div>
        <div style={{ fontSize: 13 }}>
          Consent: <strong style={{ color: fd.consent ? '#00bcd4' : '#ef4444' }}>{fd.consent ? 'Given' : 'Not given'}</strong>
          {' · '}Signature: <strong>{fd.signature || '—'}</strong>
        </div>
      </div>
    </>
  );
}

export default function SubmissionDetailPage() {
  return (
    <AuthGuard allow={['admin']}>
      <AppShell nav={ADMIN_NAV} bell={<NotificationBell />}><DetailInner /></AppShell>
    </AuthGuard>
  );
}
