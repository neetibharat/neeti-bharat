import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC emits the decorator metadata Nest's dependency injection needs.
export default defineConfig({
  plugins: [swc.vite()],
  test: { include: ['src/**/*.test.ts'] },
});
