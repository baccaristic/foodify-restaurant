import { create } from 'zustand';
import type { OrderNotificationDTO } from '../types/api';

interface OrdersState {
  activeAlert: OrderNotificationDTO | null;
  queuedAlerts: OrderNotificationDTO[];
  pushAlert: (order: OrderNotificationDTO) => void;
  clearActiveAlert: () => void;
  resetAlerts: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  activeAlert: null,
  queuedAlerts: [],
  pushAlert: (order) =>
    set((state) => {
      if (!state.activeAlert) {
        return { ...state, activeAlert: order };
      }

      return { ...state, queuedAlerts: [...state.queuedAlerts, order] };
    }),
  clearActiveAlert: () =>
    set((state) => {
      if (state.queuedAlerts.length === 0) {
        return { activeAlert: null, queuedAlerts: [] };
      }

      const [nextAlert, ...rest] = state.queuedAlerts;
      return { activeAlert: nextAlert, queuedAlerts: rest };
    }),
  resetAlerts: () => set({ activeAlert: null, queuedAlerts: [] }),
}));
