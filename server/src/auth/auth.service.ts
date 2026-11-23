import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '../generated/prisma/client.js';
import { toProfile, UsersService } from '../users/users.service.js';
import type { LoginDto, SignupDto } from './auth.dto.js';
import { hashPassword, verifyPassword } from './password.js';

// One message for "no such phone" AND "wrong password" (US-01), so nobody can
// use the login form to find out which phone numbers have accounts.
export const WRONG_LOGIN_MESSAGE = 'Phone number or password is incorrect.';

@Injectable()
export class AuthService {
  // A real hash of a random password. When the phone isn't found, we still check
  // against this, so a wrong phone takes as long as a wrong password.
  private readonly dummyHash = hashPassword(crypto.randomUUID());

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.users.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
      });
      return this.loggedIn(user);
    } catch (error) {
      // P2002 = the database's unique rule on phone said no.
      // Letting the database decide also covers two sign-ups at the same moment.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          statusCode: 409,
          error: 'PHONE_ALREADY_REGISTERED',
          message: 'This phone number already has an account. Please log in.',
        });
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByPhone(dto.phone);
    const passwordOk = await verifyPassword(
      dto.password,
      user?.passwordHash ?? (await this.dummyHash),
    );

    if (!user || !passwordOk) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: WRONG_LOGIN_MESSAGE,
      });
    }
    return this.loggedIn(user);
  }

  /** The token (a signed "wristband" with the user's id) plus their profile. */
  private async loggedIn(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken, user: toProfile(user) };
  }
}
