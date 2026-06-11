import type { Context } from 'hono';
import { createPrismaClient } from '../../services/database';
import type { CloudflareBindings } from '../../types';

export const healthHandler = (c: Context) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
};

export const testDBHandler = async (
  c: Context<{ Bindings: CloudflareBindings }>,
) => {
  try {
    const prisma = createPrismaClient(c.env.DB);
    // Execute a simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return c.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
};
