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
  const isProductionBuild = mode === 'production';
  const isDevelopment = mode === 'development';

  if (isProductionBuild) {
    if (!env.VITE_API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL must be set for a production build.');
    }
    let apiUrl: URL;
    try {
      apiUrl = new URL(env.VITE_API_BASE_URL);
    } catch {
      throw new Error(`VITE_API_BASE_URL is not a valid URL: ${env.VITE_API_BASE_URL}`);
    }
    if (apiUrl.protocol !== 'https:') {
      throw new Error(`VITE_API_BASE_URL must use HTTPS for production builds, got: ${env.VITE_API_BASE_URL}`);
    }
    if (env.VITE_DATA_MODE === 'MOCK' || env.VITE_LAUNCH_MODE === 'dev') {
      throw new Error('Production builds cannot have VITE_DATA_MODE=MOCK or dev VITE_LAUNCH_MODE.');
    }
  }

  const contentSecurityPolicy = isDevelopment
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://iframe.bubblemaps.io https://challenges.cloudflare.com https://hcaptcha.com; connect-src 'self' http://localhost:3003 http://127.0.0.1:3003 https: wss:; object-src 'none'; base-uri 'self'; form-action 'self';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://iframe.bubblemaps.io https://challenges.cloudflare.com https://hcaptcha.com; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; form-action 'self';";

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
          secure: proxyTarget.startsWith('https://'),
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
      {
        name: 'inject-content-security-policy',
        transformIndexHtml() {
          return {
            tags: [
              {
                tag: 'meta',
                attrs: {
                  'http-equiv': 'Content-Security-Policy',
                  content: contentSecurityPolicy,
                },
                injectTo: 'head-prepend',
              },
            ],
          };
        },
      },
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'stream', 'util'],
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
      drop: ['debugger'],
      pure: ['console.log', 'console.debug', 'console.info'],
    },
    build: {
      sourcemap: false,
      cssMinify: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            web3: ['wagmi', 'viem', '@web3modal/wagmi'],
            recharts: ['recharts'],
            ui: ['lucide-react', 'framer-motion', 'sweetalert2'],
            query: ['@tanstack/react-query']
          }
        }
      }
    }
  };
});
