import httpClient from './httpClient';
import type {
  AuthResponse,
  HeartbeatResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
} from '../types/api';

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/api/auth/login', payload);
    return response.data;
  },

  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const response = await httpClient.post<RefreshResponse>('/api/auth/refresh', payload);
    return response.data;
  },

  async heartbeat(): Promise<HeartbeatResponse> {
    const response = await httpClient.get<HeartbeatResponse>('/api/auth/heart-beat');
    return response.data;
  },
};
