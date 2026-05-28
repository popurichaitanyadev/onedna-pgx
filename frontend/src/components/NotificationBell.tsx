'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notificationStore';

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unread, connect, disconnect, load, markRead } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => { load(); connect(); return () => disconnect(); }, [load, connect, disconnect]);

  const openItem = async (id: string, submissionId: string) => {
    await markRead(id);
    setOpen(false);
    if (submissionId) router.push(`/admin/data/submissions/${submissionId}`);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} className="btn btn-ghost" style={{ position: 'relative', padding: '8px 14px' }}>
        Notifications
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -6, right: -6, background: '#00bcd4', color: '#00171c', fontSize: 11, fontWeight: 700, borderRadius: 99, minWidth: 18, height: 18, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340, maxHeight: 420, overflowY: 'auto', zIndex: 60, padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', fontSize: 13, fontWeight: 600 }}>Recent Submissions</div>
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8a8a8a', fontSize: 13 }}>No notifications</div>
          ) : notifications.slice(0, 20).map((n) => (
            <button key={n.id} onClick={() => openItem(n.id, n.submissionId)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #141414', border: 'none', cursor: 'pointer',
                background: n.isRead ? 'transparent' : 'rgba(0,188,212,0.06)', color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.patientName}</div>
              <div style={{ fontSize: 12, color: '#8a8a8a' }}>by {n.submittedBy} · {new Date(n.createdAt).toLocaleTimeString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
