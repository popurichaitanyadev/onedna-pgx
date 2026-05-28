import type { FastifyInstance } from 'fastify';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { createUserSchema, updateUserSchema } from './users.validators.js';
import { listUsers, createUser, updateUser, ConflictError } from './users.service.js';

// All routes admin-only (PRD §5, §9)
export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyToken);
  app.addHook('preHandler', requireRole(['admin']));

  // GET /api/admin/users
  app.get('/', async (_req, reply) => {
    reply.send({ users: await listUsers() });
  });

  // POST /api/admin/users
  app.post('/', async (req, reply) => {
    const input = createUserSchema.parse(req.body);
    try {
      const user = await createUser(input);
      reply.code(201).send({ user });
    } catch (err) {
      if (err instanceof ConflictError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  });

  // PATCH /api/admin/users/:id  (deactivate / edit)
  app.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const input = updateUserSchema.parse(req.body);
    const user = await updateUser(req.params.id, input);
    if (!user) return reply.code(404).send({ error: 'User not found' });
    reply.send({ user });
  });
}
