import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// npm tells us which script is running. `npm run db:migrate:test` loads .env.test
// itself (see package.json), so for that script we must NEVER fall back to .env:
// that would run the test migration on the dev database.
const isTestMigration = process.env.npm_lifecycle_event === 'db:migrate:test';

if (isTestMigration) {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    throw new Error(
      'db:migrate:test found no database address in .env.test. ' +
        'Add your Neon test branch addresses (see .env.test.example). Refusing to use .env.',
    );
  }
} else if (!process.env.DATABASE_URL && existsSync('.env')) {
  // Normal use: Prisma doesn't read .env by itself, so load it with Node's helper.
  // Skipped when a database address is already set (e.g. in CI).
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // The Prisma CLI (migrations) needs a direct connection, not Neon's pooled one.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
