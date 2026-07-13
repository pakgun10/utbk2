import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { subjectsRoutes } from './routes/subjects';
import { topicsRoutes } from './routes/topics';
import { questionsRoutes } from './routes/questions';
import { participantRoutes } from './routes/participant';
import { attemptsRoutes } from './routes/attempts';
import { requireAuth } from './middleware/require-auth';
import type { Pool } from './db/connection';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

interface AppConfig {
  pool: Pool;
  corsOrigin: string;
  appPassword: string;
}

export function createApp(config: AppConfig) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('/api/*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    await next();
  });

  app.use(
    '/api/*',
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );

  app.route('/api/auth', authRoutes(config.appPassword));

  if (config.appPassword) {
    app.use('/api/subjects', requireAuth);
    app.use('/api/topics', requireAuth);
    app.use('/api/questions', requireAuth);
    app.use('/api/participant', requireAuth);
    app.use('/api/attempts', requireAuth);
  }

  app.onError((err, c) => {
    const requestId = c.get('requestId') ?? 'unknown';
    console.error(`[error] [${requestId}]`, err);
    return c.json(
      {
        error: 'internal_server_error',
        message: 'Terjadi kesalahan server.',
        request_id: requestId,
      },
      500,
    );
  });

  app.route('/api/subjects', subjectsRoutes(config.pool));
  app.route('/api/topics', topicsRoutes(config.pool));
  app.route('/api/questions', questionsRoutes(config.pool));
  app.route('/api/participant', participantRoutes(config.pool));
  app.route('/api/attempts', attemptsRoutes(config.pool));

  if (process.env.NODE_ENV === 'production') {
    const distDir = '../frontend/dist';
    app.get('/assets/*', serveStatic({ root: distDir }));
    app.get('/*', () => {
      const file = Bun.file(`${distDir}/index.html`);
      return new Response(file, {
        headers: { 'Content-Type': 'text/html' },
      });
    });
  }

  return app;
}
