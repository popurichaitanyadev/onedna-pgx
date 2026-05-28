import { create } from 'zustand';

export type DashboardPeriod = 'all' | 'day' | 'week' | 'month' | 'year';

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  dashboardPeriod: DashboardPeriod;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setDashboardPeriod: (p: DashboardPeriod) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  dashboardPeriod: 'all',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setDashboardPeriod: (p) => set({ dashboardPeriod: p }),
}));
