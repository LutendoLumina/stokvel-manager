import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '../generated/prisma/client.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService, WRONG_LOGIN_MESSAGE } from './auth.service.js';
import { hashPassword } from './password.js';

// Unit tests: a FAKE UsersService stands in for the database.
describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'test-secret-that-is-at-least-32-chars!!' });

  async function makeUser(password = 'correct horse'): Promise<User> {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Thandi Mokoena',
      phone: '+27821234567',
      email: null,
      passwordHash: await hashPassword(password),
      createdAt: new Date('2026-11-23T08:00:00Z'),
    };
  }

  function makeService(fakeUsers: Partial<UsersService>) {
    return new AuthService(fakeUsers as UsersService, jwt);
  }

  async function caught(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error('expected the promise to fail');
  }

  describe('signup', () => {
    it('stores a hash, not the password, and returns a token + profile', async () => {
      const user = await makeUser();
      const create = vi.fn().mockResolvedValue(user);
      const service = makeService({ create });

      const result = await service.signup({
        name: 'Thandi Mokoena',
        phone: '+27821234567',
        password: 'correct horse',
      });

      const saved = create.mock.calls[0][0];
      expect(saved.passwordHash).not.toBe('correct horse');
      expect(saved.passwordHash.startsWith('scrypt$')).toBe(true);
      expect(saved).not.toHaveProperty('password');

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.phone).toBe('+27821234567');
      const payload = await jwt.verifyAsync<{ sub: string }>(result.accessToken);
      expect(payload.sub).toBe(user.id);
    });

    it('returns 409 PHONE_ALREADY_REGISTERED when the phone is taken', async () => {
      const uniqueClash = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.1',
      });
      const service = makeService({ create: vi.fn().mockRejectedValue(uniqueClash) });

      const error = await caught(
        service.signup({ name: 'Sipho', phone: '+27821234567', password: 'password123' }),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        error: 'PHONE_ALREADY_REGISTERED',
      });
    });

    it('does not hide other database errors as 409', async () => {
      const service = makeService({ create: vi.fn().mockRejectedValue(new Error('db down')) });

      await expect(
        service.signup({ name: 'Sipho', phone: '+27821234567', password: 'password123' }),
      ).rejects.toThrow('db down');
    });
  });

  describe('login', () => {
    it('returns a token for the right phone and password', async () => {
      const user = await makeUser('correct horse');
      const service = makeService({ findByPhone: vi.fn().mockResolvedValue(user) });

      const result = await service.login({ phone: user.phone, password: 'correct horse' });

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user.id).toBe(user.id);
    });

    it('gives the SAME error for a wrong password and an unknown phone', async () => {
      const user = await makeUser('correct horse');
      const wrongPassword = makeService({ findByPhone: vi.fn().mockResolvedValue(user) });
      const unknownPhone = makeService({ findByPhone: vi.fn().mockResolvedValue(null) });

      const a = await caught(wrongPassword.login({ phone: user.phone, password: 'wrong pass' }));
      const b = await caught(unknownPhone.login({ phone: '+27830000000', password: 'anything1' }));

      for (const error of [a, b]) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          statusCode: 401,
          error: 'INVALID_CREDENTIALS',
          message: WRONG_LOGIN_MESSAGE,
        });
      }
    });
  });
});
