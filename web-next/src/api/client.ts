import axios from 'axios';

function getUserIdFromLocalStorage(): string {
  const user = localStorage.getItem('user');
  if (!user) return '';
  try {
    const parsed = JSON.parse(user);
    return String(parsed?.id ?? '');
  } catch {
    return '';
  }
}

export let API = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL || '',
  headers: {
    'New-API-User': getUserIdFromLocalStorage(),
    'Cache-Control': 'no-store',
  },
});

function patchDedup(instance: typeof API) {
  const originalGet = instance.get.bind(instance);
  const inFlight = new Map<string, Promise<unknown>>();

  const key = (url: string, cfg: Record<string, unknown> = {}) =>
    `${url}?${cfg.params ? JSON.stringify(cfg.params) : '{}'}`;

  instance.get = ((url: string, config: Record<string, unknown> = {}) => {
    if (config?.disableDuplicate) return originalGet(url, config);
    const k = key(url, config);
    if (inFlight.has(k)) return inFlight.get(k)!;
    const p = originalGet(url, config).finally(() => inFlight.delete(k));
    inFlight.set(k, p);
    return p;
  }) as typeof instance.get;
}

patchDedup(API);

export function updateAPI() {
  API = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL || '',
    headers: {
      'New-API-User': getUserIdFromLocalStorage(),
      'Cache-Control': 'no-store',
    },
  });
  patchDedup(API);
}

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipErrorHandler) return Promise.reject(error);
    console.error('[API Error]', error?.response?.data?.message || error.message);
    return Promise.reject(error);
  },
);
