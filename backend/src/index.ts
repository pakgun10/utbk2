import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app';
import { createPool } from './db/connection';
import { applyMigrations } from './db/migrate';

function loadEnv(): { port: number; frontendPort: number; appPassword: string } {
  const port = Number(process.env.APP_PORT) || 3000;
  const frontendPort = Number(process.env.FRONTEND_PORT) || 5173;
  const appPassword = process.env.APP_PASSWORD || '';
  const dbHost = process.env.DB_HOST || '';

  if (dbHost) {
    return { port, frontendPort, appPassword };
  }

  const envPath = path.join(process.cwd(), '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  const map: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return {
    port: Number(map['APP_PORT']) || 3000,
    frontendPort: Number(map['FRONTEND_PORT']) || 5173,
    appPassword: map['APP_PASSWORD'] || '',
  };
}

const pool = createPool();

await applyMigrations(pool);

const env = loadEnv();

const app = createApp({ pool, frontendPort: env.frontendPort, appPassword: env.appPassword });

const port = env.port;

console.log(`[server] Starting on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`[server] Ready on http://localhost:${port}`);
