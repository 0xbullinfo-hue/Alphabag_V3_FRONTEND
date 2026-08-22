import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: RetryConfig) => {
    const token = sessionStorage.getItem('alphabag_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['X-Request-ID'] = crypto.randomUUID();
    config.headers['X-Client-Timestamp'] = Date.now().toString();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    const isRetryable = !error.response || [502, 503, 504].includes(error.response.status);
    config.retryCount = config.retryCount || 0;

    if (isRetryable && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      const delay = Math.pow(2, config.retryCount) * RETRY_DELAY_MS;
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }

    if (error.response?.status === 401) {
      sessionStorage.removeItem('alphabag_token');
      sessionStorage.removeItem('alphabag_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      if (window.location.hash !== '#/' && window.location.hash !== '#/airdrop') {
        window.location.hash = '#/';
      }
    }

    return Promise.reject({
      ...error,
      isRetryable,
      retryCount: config.retryCount,
      requestId: config.headers?.['X-Request-ID'],
    });
  }
);

export default api;
