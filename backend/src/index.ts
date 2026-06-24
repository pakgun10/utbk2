import { createApp } from './app';
import { createPool } from './db/connection';
import { applyMigrations } from './db/migrate';
import { loadConfig } from './config';

const pool = createPool();

await applyMigrations(pool);

const config = loadConfig();

const app = createApp({
  pool,
  frontendPort: config.FRONTEND_PORT,
  appPassword: config.APP_PASSWORD,
});

const port = config.APP_PORT;

console.log(`[server] Starting on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`[server] Ready on http://localhost:${port}`);
