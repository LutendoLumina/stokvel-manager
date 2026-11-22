import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  // Load DATABASE_URL etc. from .env, using Node's built-in helper (no extra library).
  if (existsSync('.env')) process.loadEnvFile('.env');

  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks(); // lets PrismaService close the connection on Ctrl+C
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
