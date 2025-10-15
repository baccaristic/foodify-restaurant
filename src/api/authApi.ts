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
    const response = await httpClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const response = await httpClient.post<RefreshResponse>('/auth/refresh', payload);
    return response.data;
  },

  async heartbeat(): Promise<HeartbeatResponse> {
    const response = await httpClient.get<HeartbeatResponse>('/auth/heart-beat');
    return response.data;
  },
};
