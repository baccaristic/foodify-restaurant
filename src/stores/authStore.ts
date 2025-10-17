import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/authApi';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../api/config';
import { registerAuthHandlers } from '../api/httpClient';
import { tokenManager } from '../api/tokenManager';
import type { AuthResponse, LoginRequest, RefreshResponse, UserDTO } from '../types/api';
import { Platform } from 'react-native';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  heartbeat: () => Promise<boolean>;
}

const saveTokens = async (tokens: RefreshResponse): Promise<void> => {
   if (Platform.OS === 'web') {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.accessToken);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
};

const saveUser = async (user: UserDTO): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

const clearSecureStore = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};


export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userRaw] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
      getItem(USER_KEY),
    ]);

    const user = userRaw ? (JSON.parse(userRaw) as UserDTO) : null;

    set({
      user,
      accessToken,
      refreshToken,
      isHydrated: true,
      isAuthenticated: Boolean(accessToken && refreshToken && user),
    });

    if (accessToken && refreshToken) {
      tokenManager.setTokens({ accessToken, refreshToken });
    } else {
      tokenManager.clear();
    }
  },

  login: async (credentials) => {
    const response = await authApi.login(credentials);

    await Promise.all([saveTokens(response), saveUser(response.user)]);

    tokenManager.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
    });

    return response;
  },

  logout: async () => {
    await clearSecureStore();
    tokenManager.clear();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  refreshSession: async () => {
    const { refreshToken } = get();

    if (!refreshToken) {
      await get().logout();
      return null;
    }

    const response: RefreshResponse = await authApi.refresh({ refreshToken });
    await saveTokens(response);

    tokenManager.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    set({ accessToken: response.accessToken, refreshToken: response.refreshToken, isAuthenticated: true });

    return response.accessToken;
  },

  heartbeat: async () => {
    try {
      const response = await authApi.heartbeat();
      return response.status === 'active';
    } catch (error) {
      return false;
    }
  },
}));

registerAuthHandlers({
  refresh: () => useAuthStore.getState().refreshSession(),
  logout: () => useAuthStore.getState().logout(),
});
