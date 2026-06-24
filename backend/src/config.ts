import fs from 'node:fs';
import path from 'node:path';

interface RawEnvMap {
  [key: string]: string | undefined;
}

export interface AppConfig {
  APP_PORT: number;
  FRONTEND_PORT: number;
  APP_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

let cachedConfig: AppConfig | null = null;

function readEnvFile(): RawEnvMap {
  const envPath = path.join(process.cwd(), '..', '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  const values: RawEnvMap = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return values;
}

function getEnvValue(processValue: string | undefined, fileValue: string | undefined, fallback: string): string {
  if (processValue && processValue.length > 0) return processValue;
  if (fileValue && fileValue.length > 0) return fileValue;
  return fallback;
}

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const fileEnv = readEnvFile();

  cachedConfig = {
    APP_PORT: Number(getEnvValue(process.env.APP_PORT, fileEnv.APP_PORT, '3000')) || 3000,
    FRONTEND_PORT: Number(getEnvValue(process.env.FRONTEND_PORT, fileEnv.FRONTEND_PORT, '5173')) || 5173,
    APP_PASSWORD: getEnvValue(process.env.APP_PASSWORD, fileEnv.APP_PASSWORD, ''),
    DB_HOST: getEnvValue(process.env.DB_HOST, fileEnv.DB_HOST, '127.0.0.1'),
    DB_PORT: Number(getEnvValue(process.env.DB_PORT, fileEnv.DB_PORT, '3306')) || 3306,
    DB_USER: getEnvValue(process.env.DB_USER, fileEnv.DB_USER, 'root'),
    DB_PASSWORD: getEnvValue(process.env.DB_PASSWORD, fileEnv.DB_PASSWORD, ''),
    DB_NAME: getEnvValue(process.env.DB_NAME, fileEnv.DB_NAME, 'utbk_belajar'),
  };

  return cachedConfig;
}
