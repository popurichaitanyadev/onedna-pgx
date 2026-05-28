import { create } from 'zustand';
import { api } from '../lib/api';

export type Role = 'admin' | 'user';
export interface SessionUser { id?: string; sub?: string; userId: string; name: string; role: Role; }

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (userId: string, password: string, role: Role) => Promise<SessionUser>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (userId, password, role) => {
    const { user } = await api.post<{ user: SessionUser }>('/auth/login', { userId, password, role });
    set({ user });
    return user;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* noop */ }
    set({ user: null });
  },

  loadSession: async () => {
    set({ loading: true });
    try {
      const { user } = await api.get<{ user: SessionUser }>('/auth/me');
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
