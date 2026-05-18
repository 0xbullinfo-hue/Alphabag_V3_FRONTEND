import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3001,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          // VITE_API_BASE_URL is the single source of truth for the backend URL.
          // In dev: falls back to localhost:3003. In prod: set to https://api.yourdomain.com
          target: env.VITE_API_BASE_URL || 'http://localhost:3003',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
      // VitePWA({...})
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            web3: ['wagmi', 'viem', '@web3modal/wagmi'],
            ui: ['lucide-react', 'framer-motion', 'sweetalert2']
          }
        }
      }
    }
  };
});
