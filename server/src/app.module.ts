import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';

// The root of the app. Each feature (auth, stokvels, ledger...) gets its own module here.
@Module({
  imports: [HealthModule],
})
export class AppModule {}
