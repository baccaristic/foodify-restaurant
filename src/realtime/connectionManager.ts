import { Client } from '@stomp/stompjs';
import { createRestaurantRealtimeClient, type RestaurantRealtimeCallbacks } from '../api/realtime';

let realtimeClient: Client | null = null;

export const getRealtimeClient = (): Client | null => realtimeClient;

export const connectRealtime = (
  callbacks?: RestaurantRealtimeCallbacks
): Client => {
  if (realtimeClient && realtimeClient.active) {
    return realtimeClient;
  }

  const client = createRestaurantRealtimeClient(callbacks);
  realtimeClient = client;
  client.activate();

  return client;
};

export const disconnectRealtime = async (): Promise<void> => {
  if (!realtimeClient) {
    return;
  }

  const client = realtimeClient;
  realtimeClient = null;

  try {
    await client.deactivate();
  } catch {
    // Swallow the error to avoid unhandled promise rejections while tearing down the client.
  }
};
