import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma doesn't read .env by itself, so we load it with Node's built-in helper.
// If a database address is already set (CI, or `npm run db:migrate:test`, which
// loads .env.test), we skip .env completely, so dev values can never mix in.
if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');

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
