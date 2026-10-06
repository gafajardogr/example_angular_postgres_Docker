import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { pool } from './db.js';
import { registerAuthentication } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { credentialRoutes } from './routes/credentials.js';

const app = Fastify({
  logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
  bodyLimit: 32 * 1024,
  trustProxy: config.nodeEnv === 'production',
});

await app.register(helmet);
await app.register(cors, {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(jwt, { secret: config.jwtSecret, sign: { expiresIn: '15m' } });
await registerAuthentication(app);

app.get('/api/health', async () => {
  await pool.query('SELECT 1');
  return { status: 'ok' };
});
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(credentialRoutes, { prefix: '/api/credentials' });

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Request failed');
  const requestError = typeof error === 'object' && error !== null
    ? error as { statusCode?: number; validation?: unknown; message?: unknown }
    : undefined;
  if (requestError?.validation) {
    return reply.code(400).send({ error: 'Invalid request', details: requestError.validation });
  }
  const statusCode = requestError?.statusCode;
  const isClientError = typeof statusCode === 'number' && statusCode < 500;
  const message = requestError && isClientError && typeof requestError.message === 'string'
    ? requestError.message
    : 'Internal server error';
  return reply.code(isClientError ? statusCode : 500)
    .send({ error: message });
});

try {
  await pool.query('SELECT 1');
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

const shutdown = async (): Promise<void> => {
  await app.close();
  await pool.end();
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
