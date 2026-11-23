import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// End-to-end tests for US-01 against the TEST database (.env.test).
// They empty the User table before each test, which is why they must never run on dev.
describe('US-01 sign up and log in (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const thandi = {
    name: 'Thandi Mokoena',
    phone: '082 123 4567',
    password: 'correct horse',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const signup = (body: object) => api().post('/api/v1/auth/signup').send(body);
  const login = (body: object) => api().post('/api/v1/auth/login').send(body);

  describe('POST /auth/signup', () => {
    it('creates an account, saves the phone in +27 format and logs you in', async () => {
      const res = await signup({ ...thandi, email: 'thandi@example.com' }).expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        name: 'Thandi Mokoena',
        phone: '+27821234567',
        email: 'thandi@example.com',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');

      const saved = await prisma.user.findUniqueOrThrow({ where: { phone: '+27821234567' } });
      expect(saved.passwordHash).not.toContain('correct horse');
    });

    it('works without an email', async () => {
      const res = await signup(thandi).expect(201);
      expect(res.body.user.email).toBeNull();
    });

    it('returns 409 when the phone is already registered, in either format', async () => {
      await signup(thandi).expect(201);

      const res = await signup({ ...thandi, name: 'Someone Else', phone: '+27821234567' }).expect(
        409,
      );
      expect(res.body).toEqual({
        statusCode: 409,
        error: 'PHONE_ALREADY_REGISTERED',
        message: expect.any(String),
      });
    });

    it.each([
      ['a password shorter than 8 characters', { password: 'short' }],
      ['a phone in the wrong format', { phone: '12345' }],
      ['a missing name', { name: '' }],
      ['a bad email', { email: 'not-an-email' }],
      ['an unknown field', { role: 'CHAIRPERSON' }],
    ])('returns 400 for %s', async (_label, change) => {
      const res = await signup({ ...thandi, ...change }).expect(400);
      expect(res.body).toEqual({
        statusCode: 400,
        error: 'VALIDATION_FAILED',
        message: expect.any(String),
      });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await signup(thandi).expect(201);
    });

    it('logs in with the phone in either format', async () => {
      const a = await login({ phone: '082 123 4567', password: thandi.password }).expect(200);
      const b = await login({ phone: '+27821234567', password: thandi.password }).expect(200);
      expect(a.body.accessToken).toEqual(expect.any(String));
      expect(b.body.user.phone).toBe('+27821234567');
    });

    it('gives the same 401 for a wrong password and an unknown phone', async () => {
      const wrongPassword = await login({ phone: thandi.phone, password: 'wrong password' }).expect(
        401,
      );
      const unknownPhone = await login({ phone: '083 000 0000', password: thandi.password }).expect(
        401,
      );

      expect(wrongPassword.body).toEqual(unknownPhone.body);
      expect(wrongPassword.body).toEqual({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Phone number or password is incorrect.',
      });
    });
  });

  describe('GET /me', () => {
    it('returns my profile with a valid token', async () => {
      const { body } = await signup(thandi).expect(201);

      const res = await api()
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Thandi Mokoena', phone: '+27821234567' });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('gives tokens that last exactly 1 hour (docs/design/api.md)', async () => {
      const { body } = await signup(thandi).expect(201);

      const { iat, exp } = new JwtService().decode<{ iat: number; exp: number }>(
        body.accessToken,
      );
      expect(exp - iat).toBe(3600);
    });

    it('returns 401 for an expired token, even with a real signature', async () => {
      const { body } = await signup(thandi).expect(201);
      // Signed with the real JWT_SECRET, but its expiry time is one minute ago.
      const now = Math.floor(Date.now() / 1000);
      const expired = await new JwtService({ secret: process.env.JWT_SECRET }).signAsync({
        sub: body.user.id,
        iat: now - 3660,
        exp: now - 60,
      });

      const res = await api()
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
      expect(res.body).toEqual({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Please log in.',
      });
    });

    it.each([
      ['no token', undefined],
      ['a made-up token', 'Bearer not.a.real.token'],
      ['the wrong scheme', 'Basic abc123'],
    ])('returns 401 with %s', async (_label, header) => {
      const req = api().get('/api/v1/me');
      if (header) req.set('Authorization', header);

      const res = await req.expect(401);
      expect(res.body).toEqual({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Please log in.',
      });
    });
  });

  it('unknown routes still use the standard error shape', async () => {
    const res = await api().get('/api/v1/does-not-exist').expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: expect.any(String),
    });
  });
});
