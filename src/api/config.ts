export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? `${API_BASE_URL.replace(/\/$/, '')}/ws`;

export const ACCESS_TOKEN_KEY = 'foodify.accessToken';
export const REFRESH_TOKEN_KEY = 'foodify.refreshToken';
export const USER_KEY = 'foodify.user';
