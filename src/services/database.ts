import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { D1Database } from '@cloudflare/workers-types';

export const createPrismaClient = (d1: D1Database) => {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
};
