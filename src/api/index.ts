import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { healthHandler, testDBHandler } from './handlers/indexHandlers.ts';
import roomsRouter from './rooms.ts';

const apiRouter = new Hono<{ Bindings: CloudflareBindings }>({
  strict: false,
});

apiRouter.get('/health/db', testDBHandler);
apiRouter.get('/health/api', healthHandler);

apiRouter.route('/rooms', roomsRouter);

export default apiRouter;
