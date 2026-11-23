import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** What we send back about a user. Never includes passwordHash. */
export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
}

export function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/** The only place that reads and writes the User table. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; phone: string; email?: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
