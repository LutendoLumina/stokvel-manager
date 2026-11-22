import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Unit test: we hand the controller a FAKE database, so no real database is needed.
describe('HealthController', () => {
  function makeController(queryRaw: () => Promise<unknown>) {
    const fakePrisma = { $queryRaw: vi.fn(queryRaw) } as unknown as PrismaService;
    return new HealthController(fakePrisma);
  }

  it('says ok when the database answers', async () => {
    const controller = makeController(() => Promise.resolve([{ '?column?': 1 }]));

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('returns 503 when the database cannot be reached', async () => {
    const controller = makeController(() =>
      Promise.reject(new Error('connection refused')),
    );

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
