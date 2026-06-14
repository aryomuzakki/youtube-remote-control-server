import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import type { CloudflareBindings } from '../types';
import { healthHandler, testDBHandler } from './handlers/indexHandlers.ts';
import roomsRouter from './rooms.ts';

const apiRouter = new OpenAPIHono<{ Bindings: CloudflareBindings }>({
  strict: false,
});

apiRouter.openapi(
  createRoute({
    method: 'get',
    path: '/health/db',
    responses: {
      200: { description: 'DB Health', content: { 'application/json': { schema: z.object({ status: z.string(), timestamp: z.string() }) } } },
      500: { description: 'DB Error', content: { 'application/json': { schema: z.object({ status: z.string(), message: z.string(), timestamp: z.string() }) } } },
    },
  }),
  testDBHandler
);

apiRouter.openapi(
  createRoute({
    method: 'get',
    path: '/health/api',
    responses: {
      200: { description: 'API Health', content: { 'application/json': { schema: z.object({ status: z.string(), timestamp: z.string() }) } } },
    },
  }),
  healthHandler
);

apiRouter.route('/rooms', roomsRouter);

export default apiRouter;
