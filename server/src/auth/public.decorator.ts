import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route that anyone can call without logging in (sign-up, log-in, health).
 * Every other route needs a token: see auth.guard.ts.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
