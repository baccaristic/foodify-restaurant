import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AxiosError } from 'axios';
import { apiClient, setAccessToken } from '../services/api';
import { AuthenticatedUser, LoginResponse } from '../types/auth';

const AUTH_STORAGE_KEY = 'foodify/auth';

type Credentials = {
  email: string;
  password: string;
};

type AuthState = {
  user?: AuthenticatedUser;
  accessToken?: string;
  refreshToken?: string;
  loading: boolean;
  error?: string;
  isHydrating: boolean;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
};

type PersistedAuthState = Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>;

const parseErrorMessage = (error: unknown): string => {
  if ((error as Error)?.message === 'Network Error') {
    return 'Unable to reach Foodify servers. Check your connection and try again.';
  }

  if (error instanceof AxiosError) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }
  }

  return 'Invalid credentials. Please try again.';
};

const persistAuthState = async (state: PersistedAuthState) => {
  try {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist auth state', error);
  }
};

const readPersistedAuthState = async (): Promise<PersistedAuthState | undefined> => {
  try {
    const storedValue = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!storedValue) {
      return undefined;
    }

    return JSON.parse(storedValue) as PersistedAuthState;
  } catch (error) {
    console.warn('Failed to parse stored auth state', error);
    return undefined;
  }
};

const clearPersistedAuthState = async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear auth state', error);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  loading: false,
  error: undefined,
  isHydrating: true,
  hydrate: async () => {
    const persisted = await readPersistedAuthState();
    if (persisted?.accessToken) {
      setAccessToken(persisted.accessToken);
    }

    set({
      user: persisted?.user,
      accessToken: persisted?.accessToken,
      refreshToken: persisted?.refreshToken,
      isHydrating: false,
    });
  },
  login: async ({ email, password }) => {
    if (!apiClient.defaults.baseURL) {
      set({
        error: 'API URL is not configured. Please set EXPO_PUBLIC_API_URL in your environment.',
        loading: false,
      });
      return false;
    }

    set({ loading: true, error: undefined });

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });

      setAccessToken(data.accessToken);
      await persistAuthState({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
      });

      return true;
    } catch (error) {
      const message = parseErrorMessage(error);
      set({ error: message, loading: false });
      return false;
    }
  },
  logout: async () => {
    await clearPersistedAuthState();
    setAccessToken(undefined);
    set({ user: undefined, accessToken: undefined, refreshToken: undefined, error: undefined });
  },
  clearError: () => {
    set({ error: undefined });
  },
}));
