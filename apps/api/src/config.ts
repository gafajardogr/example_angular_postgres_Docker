import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const apiEnvPath = resolve(moduleDirectory, '../.env');
const rootEnvPath = resolve(moduleDirectory, '../../../.env');
dotenv.config({ path: existsSync(apiEnvPath) ? apiEnvPath : rootEnvPath });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (Buffer.byteLength(jwtSecret) < 32) {
  throw new Error('JWT_SECRET must contain at least 32 bytes');
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.API_PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
