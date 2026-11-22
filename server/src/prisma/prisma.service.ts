import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The one shared connection to the database.
 * Other parts of the app ask Nest for this service instead of opening their own.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      // The "adapter" is the driver that actually talks to Postgres.
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        // Give up after 5 seconds instead of hanging if the database can't be reached.
        connectionTimeoutMillis: 5000,
      }),
    });
  }

  // Close the connection cleanly when the app shuts down.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
