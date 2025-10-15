import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from './config';
import { tokenManager } from './tokenManager';

interface RetriableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RefreshHandler = () => Promise<string | null>;
type LogoutHandler = () => Promise<void>;

let refreshHandler: RefreshHandler | null = null;
let logoutHandler: LogoutHandler | null = null;

export const registerAuthHandlers = ({
  refresh,
  logout,
}: {
  refresh: RefreshHandler;
  logout: LogoutHandler;
}): void => {
  refreshHandler = refresh;
  logoutHandler = logout;
};

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenManager.getAccessToken();

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

type AxiosResponseError = AxiosError & { config: RetriableAxiosRequestConfig };

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosResponseError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshHandler) {
          await logoutHandler?.();
          return Promise.reject(error);
        }

        const newAccessToken = await refreshHandler();

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return httpClient(originalRequest);
        }

        await logoutHandler?.();
      } catch (refreshError) {
        await logoutHandler?.();
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
