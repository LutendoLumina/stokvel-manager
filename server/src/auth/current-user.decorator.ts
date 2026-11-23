import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** The request after AuthGuard has checked the token. */
export interface AuthedRequest extends Request {
  userId: string;
}

/** Gives a controller the logged-in user's id: `me(@CurrentUserId() userId: string)`. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().userId,
);
