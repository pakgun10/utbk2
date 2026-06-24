import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { subjectsRoutes } from './routes/subjects';
import { topicsRoutes } from './routes/topics';
import { questionsRoutes } from './routes/questions';
import { requireAuth } from './middleware/require-auth';
import type { Pool } from './db/connection';

interface AppConfig {
  pool: Pool;
  frontendPort: number;
  appPassword: string;
}

export function createApp(config: AppConfig) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use(
    '/api/*',
    cors({
      origin: `http://localhost:${config.frontendPort}`,
      credentials: true,
    }),
  );

  app.route('/api/auth', authRoutes(config.appPassword));

  if (config.appPassword) {
    app.use('/api/subjects', requireAuth);
    app.use('/api/topics', requireAuth);
    app.use('/api/questions', requireAuth);
  }

  app.onError((err, c) => {
    console.error('[error]', err);
    return c.json({ error: 'internal_server_error', message: 'Terjadi kesalahan server.' }, 500);
  });

  app.route('/api/subjects', subjectsRoutes(config.pool));
  app.route('/api/topics', topicsRoutes(config.pool));
  app.route('/api/questions', questionsRoutes(config.pool));

  if (process.env.NODE_ENV === 'production') {
    const distDir = '../frontend/dist';
    app.get('/assets/*', serveStatic({ root: distDir }));
    app.get('/*', (c) => {
      const file = Bun.file(`${distDir}/index.html`);
      return new Response(file, {
        headers: { 'Content-Type': 'text/html' },
      });
    });
  }

  return app;
}
