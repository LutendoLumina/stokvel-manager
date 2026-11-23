import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

/**
 * Runs before every e2e test file (see vitest.config.e2e.ts).
 *
 * e2e tests create and delete real data, so they must NEVER touch your dev database.
 * - Locally: they read server/.env.test (your Neon "test" branch), never .env.
 * - In CI: there's no .env.test; the workflow passes a throwaway database instead.
 */
const serverDir = resolve(import.meta.dirname, '..');
const testEnvFile = resolve(serverDir, '.env.test');
const devEnvFile = resolve(serverDir, '.env');

if (existsSync(testEnvFile)) process.loadEnvFile(testEnvFile);

if (!process.env.DATABASE_URL) {
  throw new Error(
    'No test database. Copy server/.env.test.example to server/.env.test ' +
      'and put your Neon "test" branch addresses in it.',
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error('No JWT_SECRET for tests. Add one to server/.env.test (see .env.test.example).');
}

// Safety net: stop if the test address is the same as the dev one in .env.
if (existsSync(devEnvFile)) {
  const dev = parseEnv(readFileSync(devEnvFile, 'utf8'));
  const sameAsDev = [dev.DATABASE_URL, dev.DIRECT_URL].includes(
    process.env.DATABASE_URL,
  );
  if (sameAsDev) {
    throw new Error(
      'e2e tests are pointing at your DEV database (the address in .env). ' +
        'Put your Neon "test" branch address in .env.test instead.',
    );
  }
}
