'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type Role } from '@/stores/authStore';

export function AuthGuard({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, loadSession } = useAuthStore();

  useEffect(() => { if (!user && loading) loadSession(); }, [user, loading, loadSession]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!allow.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/new-entry');
    }
  }, [user, loading, allow, router]);

  if (loading || !user || !allow.includes(user.role)) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#8a8a8a' }}>Loading…</div>;
  }
  return <>{children}</>;
}
