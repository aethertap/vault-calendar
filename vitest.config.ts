import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      obsidian: new URL('./src/__mocks__/obsidian.ts', import.meta.url).pathname,
      'obsidian-dataview': new URL('./src/__mocks__/obsidian-dataview.ts', import.meta.url).pathname,
    },
  },
});
