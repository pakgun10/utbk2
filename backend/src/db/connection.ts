import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

interface Env {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

function loadEnv(): Env {
  const fromEnv = {
    DB_HOST: process.env.DB_HOST || '',
    DB_PORT: process.env.DB_PORT || '',
    DB_USER: process.env.DB_USER || '',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || '',
  };

  if (fromEnv.DB_HOST && fromEnv.DB_USER && fromEnv.DB_NAME) {
    return {
      DB_HOST: fromEnv.DB_HOST,
      DB_PORT: Number(fromEnv.DB_PORT) || 3306,
      DB_USER: fromEnv.DB_USER,
      DB_PASSWORD: fromEnv.DB_PASSWORD,
      DB_NAME: fromEnv.DB_NAME,
    };
  }

  const envPath = path.join(process.cwd(), '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }

  return {
    DB_HOST: env.DB_HOST || '127.0.0.1',
    DB_PORT: Number(env.DB_PORT) || 3306,
    DB_USER: env.DB_USER || 'root',
    DB_PASSWORD: env.DB_PASSWORD || '',
    DB_NAME: env.DB_NAME || 'utbk_belajar',
  };
}

export function createPool() {
  const env = loadEnv();

  return mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
}

export type Pool = ReturnType<typeof createPool>;
