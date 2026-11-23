import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';

// The root of the app. Each feature (auth, stokvels, ledger...) gets its own module here.
@Module({
  imports: [HealthModule, AuthModule, UsersModule],
})
export class AppModule {}
