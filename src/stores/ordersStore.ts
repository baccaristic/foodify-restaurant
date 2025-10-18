import { create } from 'zustand';
import type { OrderNotificationDTO } from '../types/api';

interface OrdersState {
  activeAlert: OrderNotificationDTO | null;
  queuedAlerts: OrderNotificationDTO[];
  activeDriverAssignment: OrderNotificationDTO | null;
  queuedDriverAssignments: OrderNotificationDTO[];
  pushAlert: (order: OrderNotificationDTO) => void;
  clearActiveAlert: () => void;
  removeAlert: (orderId: number) => void;
  pushDriverAssignment: (order: OrderNotificationDTO) => void;
  clearDriverAssignment: () => void;
  resetAlerts: () => void;
  activeOrdersRefreshToken: number;
  bumpActiveOrdersRefreshToken: () => void;
}

const shiftQueue = (
  queue: OrderNotificationDTO[]
): { next: OrderNotificationDTO | null; rest: OrderNotificationDTO[] } => {
  if (queue.length === 0) {
    return { next: null, rest: [] };
  }

  const [next, ...rest] = queue;
  return { next, rest };
};

export const useOrdersStore = create<OrdersState>((set) => ({
  activeAlert: null,
  queuedAlerts: [],
  activeDriverAssignment: null,
  queuedDriverAssignments: [],
  activeOrdersRefreshToken: 0,
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
        return { ...state, activeAlert: null };
      }

      const { next, rest } = shiftQueue(state.queuedAlerts);
      return { ...state, activeAlert: next, queuedAlerts: rest };
    }),
  removeAlert: (orderId) =>
    set((state) => {
      if (state.activeAlert?.orderId === orderId) {
        if (state.queuedAlerts.length === 0) {
          return { ...state, activeAlert: null };
        }

        const { next, rest } = shiftQueue(state.queuedAlerts);
        return { ...state, activeAlert: next, queuedAlerts: rest };
      }

      const index = state.queuedAlerts.findIndex((alert) => alert.orderId === orderId);
      if (index === -1) {
        return state;
      }

      const updatedQueue = [...state.queuedAlerts];
      updatedQueue.splice(index, 1);

      return { ...state, queuedAlerts: updatedQueue };
    }),
  pushDriverAssignment: (order) =>
    set((state) => {
      if (!state.activeDriverAssignment) {
        return { ...state, activeDriverAssignment: order };
      }

      return {
        ...state,
        queuedDriverAssignments: [...state.queuedDriverAssignments, order],
      };
    }),
  clearDriverAssignment: () =>
    set((state) => {
      if (state.queuedDriverAssignments.length === 0) {
        return { ...state, activeDriverAssignment: null };
      }

      const { next, rest } = shiftQueue(state.queuedDriverAssignments);
      return {
        ...state,
        activeDriverAssignment: next,
        queuedDriverAssignments: rest,
      };
    }),
  resetAlerts: () =>
    set({
      activeAlert: null,
      queuedAlerts: [],
      activeDriverAssignment: null,
      queuedDriverAssignments: [],
      activeOrdersRefreshToken: 0,
    }),
  bumpActiveOrdersRefreshToken: () =>
    set((state) => ({
      ...state,
      activeOrdersRefreshToken: state.activeOrdersRefreshToken + 1,
    })),
}));
