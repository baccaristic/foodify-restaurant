import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from './config';
import { useAuthStore } from '../stores/authStore';
import type { OrderNotificationDTO } from '../types/api';

export interface RestaurantRealtimeCallbacks {
  onSnapshot?: (orders: OrderNotificationDTO[]) => void;
  onOrderUpdate?: (order: OrderNotificationDTO) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const parseMessage = <T>(message: IMessage): T => {
  try {
    return JSON.parse(message.body) as T;
  } catch (error) {
    throw new Error('Failed to parse realtime message');
  }
};

export const createRestaurantRealtimeClient = (
  callbacks: RestaurantRealtimeCallbacks = {}
): Client => {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_BASE_URL),
    reconnectDelay: 5000,
    debug: undefined,
  });

  client.beforeConnect = () => {
    const { accessToken } = useAuthStore.getState();
    client.connectHeaders = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
  };

  let snapshotSubscription: StompSubscription | null = null;
  let updateSubscription: StompSubscription | null = null;

  client.onConnect = () => {
    snapshotSubscription = client.subscribe('/user/queue/restaurant/orders/snapshot', (message) => {
      try {
        const payload = parseMessage<OrderNotificationDTO[]>(message);
        callbacks.onSnapshot?.(payload);
      } catch (error) {
        callbacks.onError?.(error as Error);
      }
    });

    updateSubscription = client.subscribe('/user/queue/restaurant/orders', (message) => {
      try {
        const payload = parseMessage<OrderNotificationDTO>(message);
        callbacks.onOrderUpdate?.(payload);
      } catch (error) {
        callbacks.onError?.(error as Error);
      }
    });
  };

  client.onStompError = (frame) => {
    const message = frame.headers['message'] ?? 'Realtime connection error';
    callbacks.onError?.(new Error(message));
  };

  client.onWebSocketClose = () => {
    snapshotSubscription?.unsubscribe();
    updateSubscription?.unsubscribe();
    callbacks.onDisconnect?.();
  };

  client.onDisconnect = () => {
    snapshotSubscription?.unsubscribe();
    snapshotSubscription = null;
    updateSubscription?.unsubscribe();
    updateSubscription = null;
    callbacks.onDisconnect?.();
  };

  return client;
};
