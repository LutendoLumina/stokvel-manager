import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    UsersModule,
    // registerAsync runs this when the app starts, after .env has been loaded.
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET is missing or shorter than 32 characters. See .env.example.');
        }
        return { secret, signOptions: { expiresIn: '1h', algorithm: 'HS256' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // APP_GUARD puts AuthGuard in front of EVERY route in the app.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
