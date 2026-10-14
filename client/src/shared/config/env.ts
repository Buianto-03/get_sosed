export const API_URL = import.meta.env.VITE_API_URL || '/api';

const pageLocation = typeof window === 'undefined'
  ? { protocol: 'http:', host: 'localhost:3000' }
  : window.location;
const socketProtocol = pageLocation.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = import.meta.env.VITE_WS_URL || `${socketProtocol}//${pageLocation.host}/ws`;

export const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_API_KEY;
