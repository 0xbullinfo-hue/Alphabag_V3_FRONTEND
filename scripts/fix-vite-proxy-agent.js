import fs from 'fs';
import path from 'path';

const viteConfigPath = 'C:/Users/1/repos/Alphabag_V3_Backend-UI/vite.config.ts';

const configContent = `import path from 'path';
import dns from 'dns';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

dns.setDefaultResultOrder('ipv4first');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const target = env.VITE_API_BASE_URL || 'http://localhost:3003';

  return {
    server: {
      port: 3001,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: target,
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
`;

fs.writeFileSync(viteConfigPath, configContent, 'utf8');
console.log('✅ Alphabag_V3_Backend-UI/vite.config.ts fixed (removed https.Agent incompatibility with http target)');
