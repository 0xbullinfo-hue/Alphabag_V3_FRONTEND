import fs from 'fs';
import path from 'path';

const frontendRoot = 'C:/Users/1/repos/Alphabag_V3_FRONTEND';

// ─────────────────────────────────────────────────────────────────────────────
// 1. src/services/api.ts
// ─────────────────────────────────────────────────────────────────────────────
const apiContent = `import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

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
    if (token) {
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
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
      console.warn(\`[API] Retry \${config.retryCount}/\${MAX_RETRIES} for \${config.url} in \${delay}ms\`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
`;
fs.writeFileSync(path.join(frontendRoot, 'src/services/api.ts'), apiContent, 'utf8');
console.log('✅ Section 1: src/services/api.ts written');

// ─────────────────────────────────────────────────────────────────────────────
// 4. src/lib/queryClient.ts (TanStack Query v5)
// ─────────────────────────────────────────────────────────────────────────────
const queryClientContent = `import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
`;
fs.writeFileSync(path.join(frontendRoot, 'src/lib/queryClient.ts'), queryClientContent, 'utf8');
console.log('✅ Section 4: src/lib/queryClient.ts written');

// ─────────────────────────────────────────────────────────────────────────────
// 8. src/hooks/useFeatures.ts
// ─────────────────────────────────────────────────────────────────────────────
const useFeaturesContent = `import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface FeatureFlags {
  disabledPages: string[];
  enableTokenGating: boolean;
  isTeaserMode: boolean;
  maxPortfolios: number;
  maxWhales: number;
  enableAlphaAi: boolean;
  enableSecurityScanner: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  disabledPages: [],
  enableTokenGating: false,
  isTeaserMode: false,
  maxPortfolios: 5,
  maxWhales: 5,
  enableAlphaAi: true,
  enableSecurityScanner: true,
};

export const useFeatures = () => {
  return useQuery({
    queryKey: ['config', 'features'],
    queryFn: async (): Promise<FeatureFlags> => {
      try {
        const res = await api.get('/api/config/features');
        return { ...DEFAULT_FLAGS, ...res.data };
      } catch {
        return DEFAULT_FLAGS;
      }
    },
    staleTime: 5 * 60_000,
    retry: 3,
  });
};
`;
fs.writeFileSync(path.join(frontendRoot, 'src/hooks/useFeatures.ts'), useFeaturesContent, 'utf8');
console.log('✅ Section 8: src/hooks/useFeatures.ts written');

// ─────────────────────────────────────────────────────────────────────────────
// 11. src/hooks/usePortfolioStream.ts
// ─────────────────────────────────────────────────────────────────────────────
const usePortfolioStreamContent = `import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePortfolioStream = (token: string | null, address?: string) => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token || !address) return;

    const es = new EventSource(\`/api/stream/portfolio?token=\${encodeURIComponent(token)}\`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);

        if (update.balances) {
          queryClient.setQueryData(['portfolio', 'dex', address], update.balances);
        }
        if (update.cexBalances) {
          queryClient.setQueryData(['portfolio', 'cex'], update.cexBalances);
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, falling back to polling:', err);
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, address, queryClient]);
};
`;
fs.writeFileSync(path.join(frontendRoot, 'src/hooks/usePortfolioStream.ts'), usePortfolioStreamContent, 'utf8');
console.log('✅ Section 11: src/hooks/usePortfolioStream.ts written');

// ─────────────────────────────────────────────────────────────────────────────
// 9. src/services/config.ts (Remove hardcoded DISABLED_PAGES)
// ─────────────────────────────────────────────────────────────────────────────
const configPath = path.join(frontendRoot, 'src/services/config.ts');
if (fs.existsSync(configPath)) {
  let configCode = fs.readFileSync(configPath, 'utf8');
  if (configCode.includes('export const DISABLED_PAGES = [')) {
    configCode = configCode.replace(/export const DISABLED_PAGES = \[[^\]]*\];/, 'export const getDisabledPages = (): string[] => [];\nexport const DISABLED_PAGES: string[] = [];');
    fs.writeFileSync(configPath, configCode, 'utf8');
    console.log('✅ Section 9: src/services/config.ts updated (removed hardcoded disabled pages)');
  }
}

console.log('\n🎉 FRONTEND ARCHITECTURE PATCH APPLIED!');
