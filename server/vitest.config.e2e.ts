import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Load .env.test (never .env) before any e2e test runs.
    setupFiles: ['./test/setup-e2e.ts'],
    // e2e tests talk to a real database over the internet, and password hashing
    // is deliberately slow (about 1 second), so allow more than the 5-second default.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
