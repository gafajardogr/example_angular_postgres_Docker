import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

const attributesSchema = {
  type: 'object',
  additionalProperties: { type: 'string', maxLength: 2_000 },
  maxProperties: 100,
} as const;

const credentialFields = {
  nombre_pagina: { type: 'string', minLength: 1, maxLength: 200 },
  url: { type: 'string', maxLength: 2_000 },
  aplicacion: { type: 'string', maxLength: 200 },
  usuario: { type: 'string', minLength: 1, maxLength: 500 },
  password: { type: 'string', minLength: 1, maxLength: 2_000 },
  puerto: { anyOf: [{ type: 'integer', minimum: 1, maximum: 65_535 }, { type: 'null' }] },
  base_datos: { type: 'string', maxLength: 200 },
  otros_atributos: attributesSchema,
} as const;

const credentialSchema = {
  type: 'object',
  required: ['nombre_pagina', 'usuario', 'password'],
  additionalProperties: false,
  properties: credentialFields,
} as const;

type CredentialInput = {
  nombre_pagina: string;
  url?: string | null;
  aplicacion?: string | null;
  usuario: string;
  password: string;
  puerto?: number | null;
  base_datos?: string | null;
  otros_atributos?: Record<string, string>;
};
type IdParams = { id: string };

const columns = 'id, nombre_pagina, url, aplicacion, usuario, password, puerto, base_datos, otros_atributos, created_at, updated_at';

export async function credentialRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async () => {
    const result = await pool.query(`SELECT ${columns} FROM credentials ORDER BY nombre_pagina ASC, created_at DESC`);
    return result.rows;
  });

  app.post<{ Body: CredentialInput }>('/', {
    schema: { body: credentialSchema },
  }, async (request, reply) => {
    const input = request.body;
    const result = await pool.query(
      `INSERT INTO credentials (nombre_pagina, url, aplicacion, usuario, password, puerto, base_datos, otros_atributos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) RETURNING ${columns}`,
      [input.nombre_pagina, input.url ?? null, input.aplicacion ?? null, input.usuario, input.password,
        input.puerto ?? null, input.base_datos ?? null, JSON.stringify(input.otros_atributos ?? {})],
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.put<{ Params: IdParams; Body: CredentialInput }>('/:id', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: credentialSchema,
    },
  }, async (request, reply) => {
    const input = request.body;
    const result = await pool.query(
      `UPDATE credentials SET nombre_pagina = $1, url = $2, aplicacion = $3, usuario = $4,
       password = $5, puerto = $6, base_datos = $7, otros_atributos = $8::jsonb, updated_at = now()
       WHERE id = $9 RETURNING ${columns}`,
      [input.nombre_pagina, input.url ?? null, input.aplicacion ?? null, input.usuario, input.password,
        input.puerto ?? null, input.base_datos ?? null, JSON.stringify(input.otros_atributos ?? {}), request.params.id],
    );
    if (!result.rowCount) return reply.code(404).send({ error: 'Credential not found' });
    return result.rows[0];
  });

  app.delete<{ Params: IdParams }>('/:id', {
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const result = await pool.query('DELETE FROM credentials WHERE id = $1', [request.params.id]);
    if (!result.rowCount) return reply.code(404).send({ error: 'Credential not found' });
    return reply.code(204).send();
  });
}
