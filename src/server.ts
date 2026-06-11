import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trimTrailingSlash } from 'hono/trailing-slash';
import apiRouter from './api/index';
import { routingErrorHandler } from './services/error/routingErrorHandler';
import { getConfig } from './config';
import type { CloudflareBindings } from './types';

export const app = new Hono<{ Bindings: CloudflareBindings }>({ strict: true });

app.use(trimTrailingSlash());

// Configure CORS
app.use('*', async (c, next) => {
  const config = getConfig(c.env);
  const corsMiddleware = cors({
    origin: config.TRUSTED_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });
  return corsMiddleware(c, next);
});

app.get('/', (c) =>
  c.text(
    'ytrc-server is running!\nAccess the API at /api.\nDocumentation is available at /docs.',
  ),
);

app.route('/api', apiRouter);

// Swagger UI will require openapiSpec to be hosted or imported.
// For now, we'll keep a simple docs endpoint that can be wired up later.
app.get('/docs', (c) => c.text('Swagger UI placeholder'));

// Global error handler
app.onError((err, c) => {
  return routingErrorHandler(err, c);
});
