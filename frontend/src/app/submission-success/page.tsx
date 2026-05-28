'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get('ref') || '—';
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card fade-up" style={{ padding: 48, textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: 'rgba(0,188,212,0.12)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 30, color: '#00bcd4' }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Form Submitted</h1>
        <p style={{ color: '#8a8a8a', fontSize: 14, marginBottom: 24 }}>
          The requisition has been received and the OneDNA team has been notified.
        </p>
        <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 6, padding: '12px 20px', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1 }}>Submission Reference</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00bcd4', fontFamily: 'monospace', marginTop: 4 }}>{ref}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => router.push('/new-entry')}>New Form</button>
          <button className="btn btn-ghost" onClick={() => router.push('/drafts')}>View Drafts</button>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionSuccessPage() {
  return <Suspense fallback={null}><SuccessInner /></Suspense>;
}
