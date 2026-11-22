import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Load .env.test (never .env) before any e2e test runs.
    setupFiles: ['./test/setup-e2e.ts'],
  },
});
