import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
    server: {
      deps: {
        inline: ['viem', '@noble/hashes', 'siwe'],
      },
    },
  },
});
