import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

const passwordSchema = {
  type: 'object',
  required: ['masterPassword'],
  additionalProperties: false,
  properties: {
    masterPassword: { type: 'string', minLength: 12, maxLength: 128 },
  },
} as const;

type PasswordBody = { masterPassword: string };

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async (_request, reply) => {
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM app_config WHERE id = 1) AS configured');
    return reply.send({ configured: result.rows[0]?.configured === true });
  });

  app.post<{ Body: PasswordBody }>('/setup', {
    schema: { body: passwordSchema },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const passwordHash = await bcrypt.hash(request.body.masterPassword, 12);
    const result = await pool.query(
      'INSERT INTO app_config (id, master_password_hash) VALUES (1, $1) ON CONFLICT (id) DO NOTHING RETURNING id',
      [passwordHash],
    );

    if (result.rowCount !== 1) {
      return reply.code(409).send({ error: 'Master password is already configured' });
    }

    return reply.code(201).send({ token: app.jwt.sign({ sub: 'admin' }) });
  });

  app.post<{ Body: PasswordBody }>('/login', {
    schema: { body: passwordSchema },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const result = await pool.query('SELECT master_password_hash FROM app_config WHERE id = 1');
    const passwordHash: string | undefined = result.rows[0]?.master_password_hash;
    const valid = passwordHash
      ? await bcrypt.compare(request.body.masterPassword, passwordHash)
      : false;

    if (!valid) return reply.code(401).send({ error: 'Invalid master password' });
    return reply.send({ token: app.jwt.sign({ sub: 'admin' }) });
  });
}
