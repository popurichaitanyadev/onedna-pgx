import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(err: FastifyError | ZodError, req: FastifyRequest, reply: FastifyReply) {
  // Zod validation errors → 400 with field detail
  if (err instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    });
  }

  // Fastify rate-limit
  if ((err as FastifyError).statusCode === 429) {
    return reply.code(429).send({ error: 'Too many requests. Please try again later.' });
  }

  // Log full error server-side (PRD §12 — exclude sensitive values)
  req.log.error({ msg: err.message, stack: err.stack });

  const status = (err as FastifyError).statusCode ?? 500;
  reply.code(status).send({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}
