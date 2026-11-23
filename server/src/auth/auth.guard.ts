import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthedRequest } from './current-user.decorator.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * The bouncer at the door of every route.
 * No valid token in "Authorization: Bearer <token>" -> 401.
 * Routes marked @Public() are let through.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw notLoggedIn();

    try {
      // Checks the signature (made with our JWT_SECRET) and the 1-hour expiry.
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        algorithms: ['HS256'],
      });
      request.userId = payload.sub;
      return true;
    } catch {
      throw notLoggedIn();
    }
  }
}

function notLoggedIn() {
  return new UnauthorizedException({
    statusCode: 401,
    error: 'UNAUTHORIZED',
    message: 'Please log in.',
  });
}
