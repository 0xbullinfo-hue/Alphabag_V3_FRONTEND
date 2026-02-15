import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: 'localhost',
    },
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'AlphaBAG Pro',
          short_name: 'AlphaBAG',
          description: 'Professional Crypto Intelligence Hub',
          theme_color: '#0B0E11',
          background_color: '#0B0E11',
          display: 'standalone',
          icons: [
            {
              src: 'https://ui-avatars.com/api/?name=BAG&background=FCD535&color=0B0E11&size=192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://ui-avatars.com/api/?name=BAG&background=FCD535&color=0B0E11&size=512',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
