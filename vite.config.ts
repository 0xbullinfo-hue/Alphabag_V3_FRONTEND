import path from 'path';
import dns from 'dns';
import http from 'http';
import https from 'https';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

dns.setDefaultResultOrder('ipv4first');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devHost = env.VITE_DEV_HOST || '0.0.0.0';
  const devPort = Number(env.VITE_DEV_PORT || '3005');
  const proxyTarget = env.VITE_API_BASE_URL || 'http://localhost:3003';
  const isProductionDeployment = mode === 'production' && env.VITE_ENVIRONMENT === 'production';

  if (isProductionDeployment) {
    if (!env.VITE_API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL must be set for a production deployment.');
    }
    const apiUrl = new URL(env.VITE_API_BASE_URL);
    if (apiUrl.protocol !== 'https:') {
      throw new Error('VITE_API_BASE_URL must use HTTPS for a production deployment.');
    }
  }

  const proxyAgent = proxyTarget.startsWith('https://')
    ? new https.Agent({ family: 4 })
    : new http.Agent({ family: 4 });

  return {
    server: {
      port: devPort,
      strictPort: true,
      host: devHost,
      proxy: {
        '/api': {
          // VITE_API_BASE_URL is the single source of truth for the backend URL.
          // In dev: falls back to localhost backend to avoid accidental remote calls.
          // In prod: set VITE_API_BASE_URL to your deployed backend domain.
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          agent: proxyAgent
        }
      }
    },
    preview: {
      host: devHost,
      port: 4173,
      strictPort: true
    },
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
    build: {
      cssMinify: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            web3: ['wagmi', 'viem', '@web3modal/wagmi'],
            walletconnect: ['@walletconnect/ethereum-provider'],
            recharts: ['recharts'],
            ui: ['lucide-react', 'framer-motion', 'sweetalert2'],
            ai: ['@google/genai'],
            query: ['@tanstack/react-query']
          }
        }
      }
    }
  };
});
