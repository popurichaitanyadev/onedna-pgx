'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { user, loading, loadSession } = useAuthStore();

  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else router.replace(user.role === 'admin' ? '/admin/dashboard' : '/new-entry');
  }, [user, loading, router]);

  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#8a8a8a' }}>Loading…</div>;
}
