import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma doesn't read .env by itself, so we load it with Node's built-in helper.
// In CI there is no .env file: the variables come from the workflow instead.
if (existsSync('.env')) process.loadEnvFile('.env');

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
