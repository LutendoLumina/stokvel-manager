import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { toProfile, UsersService } from './users.service.js';

/** GET /api/v1/me: the logged-in user's profile (US-01). */
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUserId() userId: string) {
    const user = await this.users.findById(userId);
    // A valid token for a user that no longer exists: treat as logged out.
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Please log in again.',
      });
    }
    return toProfile(user);
  }
}
