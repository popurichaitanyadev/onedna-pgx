import { create } from 'zustand';
import { api } from '../lib/api';

export interface Notification {
  id: string;
  submissionId: string;
  referenceNo: string;
  patientName: string;
  submittedBy: string;
  isRead: boolean;
  createdAt: string;
}

interface NotifState {
  socket: WebSocket | null;
  notifications: Notification[];
  unread: number;
  connect: () => void;
  disconnect: () => void;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  onNewSubmission?: () => void; // dashboard hooks this to refresh stats
}

export const useNotificationStore = create<NotifState>((set, get) => ({
  socket: null,
  notifications: [],
  unread: 0,

  // PRD §6.5 — WS authenticated via JWT query param.
  // Cookies are HttpOnly so we fetch a short-lived ws ticket via /auth/me-derived
  // token in production. Here we connect through the same-origin proxy.
  connect: () => {
    if (get().socket) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const base = process.env.NEXT_PUBLIC_WS_URL || `${proto}://${window.location.host}`;
    const ws = new WebSocket(`${base}/ws`);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'FORM_SUBMITTED') {
          // Prepend a lightweight notification; full list refetched on demand
          set((s) => ({
            unread: s.unread + 1,
            notifications: [{
              id: crypto.randomUUID(),
              submissionId: msg.submissionId,
              referenceNo: '',
              patientName: msg.patientName,
              submittedBy: msg.submittedBy,
              isRead: false,
              createdAt: msg.timestamp,
            }, ...s.notifications],
          }));
          get().onNewSubmission?.();
        }
      } catch { /* noop */ }
    };

    ws.onclose = () => set({ socket: null });
    set({ socket: ws });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null });
  },

  load: async () => {
    const { notifications } = await api.get<{ notifications: Notification[] }>('/admin/notifications');
    set({ notifications, unread: notifications.filter((n) => !n.isRead).length });
  },

  markRead: async (id) => {
    await api.patch(`/admin/notifications/${id}/read`);
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unread: Math.max(0, s.unread - 1),
    }));
  },
}));
