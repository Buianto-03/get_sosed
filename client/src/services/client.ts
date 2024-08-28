import type { AxiosError } from 'axios';
import axios from 'axios';
import { authSchema } from '../types/auth';
import type { AppStore } from '../redux/store';

let store: AppStore | undefined;

export function injectStore(_store: AppStore): void {
  store = _store;
}

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${store?.getState().auth.accessToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & { config: { sent?: boolean } }) => {
    const prevRequest = err.config; // необходимо чтобы понять что это второй запрос
    if (err.response?.status === 403 && !prevRequest.sent) {
      prevRequest.sent = true;
      const res = await axios('/api/tokens/refresh');
      const { accessToken } = authSchema.parse(res.data);
      store?.dispatch({ type: 'auth/setAccessToken', payload: accessToken });
      prevRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(prevRequest);
    }
    return Promise.reject(err);
  },
);

export default axiosInstance;
