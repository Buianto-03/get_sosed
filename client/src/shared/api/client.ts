import axios, { CanceledError } from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/env';
import { isRequestCanceled, waitForRefresh } from './cancellation';

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
    if (isRequestCanceled(error) || previousRequest?.signal?.aborted) {
      return Promise.reject(new CanceledError('Request canceled'));
    }
    if (error.response?.status !== 403 || !previousRequest || previousRequest.sent || !authBridge) {
      return Promise.reject(error);
    }

    previousRequest.sent = true;
    let accessToken: string;
    try {
      const bridge = authBridge;
      refreshPromise ??= bridge
        .refreshAccessToken()
        .catch((refreshError: unknown) => {
          bridge.onUnauthorized();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = undefined;
        });
      accessToken = await waitForRefresh(refreshPromise, previousRequest.signal);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
    if (previousRequest.signal?.aborted) {
      return Promise.reject(new CanceledError('Request canceled'));
    }
    previousRequest.headers.Authorization = `Bearer ${accessToken}`;
    return axiosInstance(previousRequest);
  },
);

export default axiosInstance;
