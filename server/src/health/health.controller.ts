import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * GET /api/v1/health
 * Answers "is the server running, and can it reach the database?"
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // The smallest possible question for the database.
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error) {
      this.logger.error(`Database check failed: ${(error as Error).message}`);
      // Same error shape as every other error in the API (docs/design/api.md).
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'DATABASE_UNAVAILABLE',
        message: 'The database cannot be reached.',
      });
    }
  }
}
