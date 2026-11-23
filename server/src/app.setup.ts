import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter.js';

/**
 * Settings shared by the real app (main.ts) and the end-to-end tests,
 * so the tests run the app exactly the way it runs for real.
 */
export function configureApp(app: INestApplication) {
  // Every route lives under /api/v1 (docs/design/api.md).
  app.setGlobalPrefix('api/v1');

  // Checks every request body against its DTO (e.g. auth.dto.ts).
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // run the @Transform steps, e.g. phone -> +27 format
      whitelist: true, // drop fields the DTO doesn't list
      forbidNonWhitelisted: true, // ...and say so with a 400
    }),
  );

  // Every error leaves the server as { statusCode, error, message }.
  app.useGlobalFilters(new HttpExceptionFilter());
}
