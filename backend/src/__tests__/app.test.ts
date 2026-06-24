import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

vi.mock('hono/bun', () => ({
  serveStatic: () => async () => new Response(null, { status: 404 }),
}));

vi.mock('@/routes/auth', () => ({
  authRoutes: () => new Hono(),
}));

vi.mock('@/routes/subjects', () => ({
  subjectsRoutes: () => new Hono(),
}));

vi.mock('@/routes/topics', () => ({
  topicsRoutes: () => new Hono(),
}));

vi.mock('@/routes/questions', () => ({
  questionsRoutes: () => new Hono(),
}));

import { createApp } from '@/app.js';

describe('createApp', () => {
  it('returns health status', async () => {
    const app = createApp({
      pool: {} as never,
      frontendPort: 5173,
      appPassword: '',
    });

    const res = await app.request('http://localhost/health');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok' });
  });
});
