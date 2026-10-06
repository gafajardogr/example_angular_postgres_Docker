import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

export async function registerAuthentication(app: FastifyInstance): Promise<void> {
  app.decorate('authenticate', (async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }) satisfies preHandlerHookHandler);
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
  }
}
