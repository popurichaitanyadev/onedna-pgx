import type { FastifyInstance } from 'fastify';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { upsertDraftSchema } from './drafts.validators.js';
import { listDrafts, getDraft, createDraft, updateDraft, deleteDraft } from './drafts.service.js';

// User-only (PRD §5, §9)
export async function draftRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyToken);
  app.addHook('preHandler', requireRole(['user']));

  // GET /api/drafts
  app.get('/', async (req, reply) => {
    reply.send({ drafts: await listDrafts(req.user!.sub) });
  });

  // GET /api/drafts/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const draft = await getDraft(req.user!.sub, req.params.id);
    if (!draft) return reply.code(404).send({ error: 'Draft not found' });
    reply.send({ draft });
  });

  // POST /api/drafts
  app.post('/', async (req, reply) => {
    const input = upsertDraftSchema.parse(req.body);
    reply.code(201).send({ draft: await createDraft(req.user!.sub, input) });
  });

  // PATCH /api/drafts/:id
  app.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const input = upsertDraftSchema.parse(req.body);
    const draft = await updateDraft(req.user!.sub, req.params.id, input);
    if (!draft) return reply.code(404).send({ error: 'Draft not found' });
    reply.send({ draft });
  });

  // DELETE /api/drafts/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const ok = await deleteDraft(req.user!.sub, req.params.id);
    if (!ok) return reply.code(404).send({ error: 'Draft not found' });
    reply.code(204).send();
  });
}
