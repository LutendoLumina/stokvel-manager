import { INestApplication } from '@nestjs/common';

/**
 * Settings shared by the real app (main.ts) and the end-to-end tests,
 * so the tests run the app exactly the way it runs for real.
 */
export function configureApp(app: INestApplication) {
  // Every route lives under /api/v1 (docs/design/api.md).
  app.setGlobalPrefix('api/v1');
}
