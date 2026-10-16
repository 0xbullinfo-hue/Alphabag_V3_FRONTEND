import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const useDevelopmentProxy = import.meta.env.DEV;

export const API_BASE_URL = useDevelopmentProxy ? '' : configuredApiBaseUrl || '';

export const resolveApiUrl = (path: string): string => {
  if (useDevelopmentProxy || !configuredApiBaseUrl) return path;
  return new URL(path, configuredApiBaseUrl).toString();
};

interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'AlphaBAG-Client',
  },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config: RetryConfig) => {
    config.headers['X-Requested-With'] = 'AlphaBAG-Client';
    config.headers['X-Request-ID'] = crypto.randomUUID();
    config.headers['X-Client-Timestamp'] = Date.now().toString();

    // Fallback support if bearer token is stored in memory/session
    const token = sessionStorage.getItem('alphabag_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    const method = (config.method || 'get').toLowerCase();
    const isIdempotent =
      ['get', 'head', 'options', 'put', 'delete'].includes(method) ||
      Boolean((config as any).idempotent);
    const isRetryable =
      (!error.response || [502, 503, 504].includes(error.response.status)) &&
      isIdempotent;
    config.retryCount = config.retryCount || 0;

    if (isRetryable && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      const delay = Math.pow(2, config.retryCount) * RETRY_DELAY_MS;
      console.warn(`[API] Retry ${config.retryCount}/${MAX_RETRIES} for ${config.url} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    if (error.response?.status === 401) {
      sessionStorage.removeItem('alphabag_token');
      sessionStorage.removeItem('alphabag_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    const structuredError = {
      ...error,
      isRetryable,
      retryCount: config.retryCount,
      requestId: config.headers?.['X-Request-ID'],
    };
    return Promise.reject(structuredError);
  }
);

export default api;
