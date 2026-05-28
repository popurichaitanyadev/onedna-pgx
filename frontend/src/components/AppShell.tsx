'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface NavItem { label: string; href: string; }

export function AppShell({ nav, children, bell }: { nav: NavItem[]; children: React.ReactNode; bell?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const doLogout = async () => { await logout(); router.replace('/login'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0a0a0a', borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ fontSize: 20, fontWeight: 700, padding: '0 8px', marginBottom: 28 }}>
          One<span style={{ color: '#00bcd4' }}>DNA</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: active ? 'rgba(0,188,212,0.12)' : 'transparent',
                  color: active ? '#00bcd4' : '#cfcfcf',
                }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#8a8a8a', textTransform: 'capitalize', marginBottom: 12 }}>{user?.role}</div>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={doLogout}>Log out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {bell && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px', borderBottom: '1px solid #1f1f1f' }}>
            {bell}
          </div>
        )}
        <div style={{ padding: 28 }}>{children}</div>
      </main>
    </div>
  );
}
