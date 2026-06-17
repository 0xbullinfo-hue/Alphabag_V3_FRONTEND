import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3005,
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
        include: ['buffer', 'crypto', 'stream', 'util', 'vm'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true,
      })
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
            solana: ['@solana/web3.js', '@solana/wallet-adapter-base', '@solana/wallet-adapter-react'],
            walletconnect: ['@walletconnect/ethereum-provider'],
            recharts: ['recharts'],
            ui: ['lucide-react', 'framer-motion', 'sweetalert2'],
            ai: ['@google/genai']
          }
        }
      }
    }
  };
});
