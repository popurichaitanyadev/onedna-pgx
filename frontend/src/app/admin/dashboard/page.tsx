'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { ADMIN_NAV } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiStore, type DashboardPeriod } from '@/stores/uiStore';

interface Stats { total: number; day: number; week: number; month: number; year: number; series: { bucket: string; count: number }[]; }
interface Sub { id: string; referenceNo: string; patientName: string; submittedBy: string; submittedAt: string; }

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
];

function DashboardInner() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Sub[]>([]);
  const { dashboardPeriod, setDashboardPeriod } = useUiStore();

  const refresh = useCallback(async () => {
    const [{ stats }, { submissions }] = await Promise.all([
      api.get<{ stats: Stats }>('/admin/submissions/stats'),
      api.get<{ submissions: Sub[] }>('/admin/submissions'),
    ]);
    setStats(stats);
    setRecent(submissions.slice(0, 10));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Live-refresh when a WS submission arrives (PRD §6.6)
  useEffect(() => { useNotificationStore.setState({ onNewSubmission: refresh }); }, [refresh]);

  const periodValue = stats ? (
    dashboardPeriod === 'all' ? stats.total :
    dashboardPeriod === 'day' ? stats.day :
    dashboardPeriod === 'week' ? stats.week :
    dashboardPeriod === 'month' ? stats.month : stats.year
  ) : null;

  const periodLabel = PERIODS.find((p) => p.key === dashboardPeriod)?.label ?? '';

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

      {/* Period filter toggle (PRD §6.6) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setDashboardPeriod(p.key)}
            className={dashboardPeriod === p.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12, padding: '6px 14px' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Selected period highlight card */}
      <div className="card" style={{ padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{periodLabel}</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#00bcd4', lineHeight: 1.1 }}>{periodValue ?? '—'}</div>
          <div style={{ fontSize: 12, color: '#8a8a8a', marginTop: 4 }}>submissions</div>
        </div>
      </div>

      {/* All counts summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
        {PERIODS.map((p) => {
          const v = stats ? (p.key === 'all' ? stats.total : stats[p.key as keyof typeof stats] as number) : null;
          return (
            <div key={p.key} className="card" style={{ padding: '12px 16px', cursor: 'pointer', borderColor: dashboardPeriod === p.key ? '#00bcd4' : undefined }}
              onClick={() => setDashboardPeriod(p.key)}>
              <div style={{ fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: dashboardPeriod === p.key ? '#00bcd4' : '#fff' }}>{v ?? '—'}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Submissions (last 12 months)</div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.series || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="bucket" stroke="#8a8a8a" fontSize={12} />
              <YAxis stroke="#8a8a8a" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#121212', border: '1px solid #1f1f1f', borderRadius: 6 }} cursor={{ fill: 'rgba(0,188,212,0.08)' }} />
              <Bar dataKey="count" fill="#00bcd4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, borderBottom: '1px solid #1f1f1f' }}>Recent Submissions</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#0a0a0a', textAlign: 'left' }}>
              {['Reference', 'Patient', 'Submitted By', 'Date', ''].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid #1f1f1f' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#00bcd4' }}>{s.referenceNo}</td>
                <td style={{ padding: '10px 16px' }}>{s.patientName}</td>
                <td style={{ padding: '10px 16px', color: '#cfcfcf' }}>{s.submittedBy}</td>
                <td style={{ padding: '10px 16px', color: '#8a8a8a' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => router.push(`/admin/data/submissions/${s.id}`)}>View</button>
                </td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#8a8a8a' }}>No submissions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard allow={['admin']}>
      <AppShell nav={ADMIN_NAV} bell={<NotificationBell />}><DashboardInner /></AppShell>
    </AuthGuard>
  );
}
