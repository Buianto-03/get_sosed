import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/env';

type RetriedRequest = InternalAxiosRequestConfig & { sent?: boolean };
type AuthBridge = {
  getAccessToken: () => string;
  refreshAccessToken: () => Promise<string>;
  onUnauthorized: () => void;
};

let authBridge: AuthBridge | undefined;
let refreshPromise: Promise<string> | undefined;

export function configureApiAuth(bridge: AuthBridge): void {
  authBridge = bridge;
}

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const accessToken = authBridge?.getAccessToken();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const previousRequest = error.config as RetriedRequest | undefined;
    if (error.response?.status !== 403 || !previousRequest || previousRequest.sent || !authBridge) {
      return Promise.reject(error);
    }

    previousRequest.sent = true;
    try {
      refreshPromise ??= authBridge.refreshAccessToken().finally(() => {
        refreshPromise = undefined;
      });
      const accessToken = await refreshPromise;
      previousRequest.headers.Authorization = `Bearer ${accessToken}`;
      return await axiosInstance(previousRequest);
    } catch (refreshError) {
      authBridge.onUnauthorized();
      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;
