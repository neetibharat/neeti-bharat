import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// End-to-end tests run the whole API against a real database made for the run. They are slower than the unit tests and
// need a PostgreSQL server, so they have their own command: `pnpm test:e2e`.
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/**/*.e2e.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
});
