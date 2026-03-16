import axios from 'axios';

export const API = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL || '',
  headers: {
    'Cache-Control': 'no-store',
  },
});

// Dynamically attach New-API-User header from localStorage on every request
API.interceptors.request.use((config) => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed?.id != null) {
        config.headers['New-API-User'] = String(parsed.id);
      }
    }
  } catch { /* ignore */ }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipErrorHandler) return Promise.reject(error);
    console.error('[API Error]', error?.response?.data?.message || error.message);
    return Promise.reject(error);
  },
);

// Dedup concurrent identical GET requests
const inFlight = new Map<string, Promise<unknown>>();

const originalGet = API.get.bind(API);
const getKey = (url: string, cfg: Record<string, unknown> = {}) =>
  `${url}?${cfg.params ? JSON.stringify(cfg.params) : '{}'}`;

API.get = ((url: string, config: Record<string, unknown> = {}) => {
  if (config?.disableDuplicate) return originalGet(url, config);
  const k = getKey(url, config);
  if (inFlight.has(k)) return inFlight.get(k)!;
  const p = originalGet(url, config).finally(() => inFlight.delete(k));
  inFlight.set(k, p);
  return p;
}) as typeof API.get;
