import type { FastifyInstance } from 'fastify';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  createSubmissionSchema, listSubmissionsQuerySchema,
} from './submissions.validators.js';
import {
  createSubmission, listSubmissions, getSubmission, getStats,
} from './submissions.service.js';

// POST /api/submissions — user-only
export async function submissionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyToken);
  app.addHook('preHandler', requireRole(['user']));

  app.post('/', async (req, reply) => {
    const input = createSubmissionSchema.parse(req.body);
    const submission = await createSubmission(
      { sub: req.user!.sub, name: req.user!.name },
      input
    );
    reply.code(201).send({ submission });
  });
}

// Admin submission views — /api/admin/submissions/*
export async function adminSubmissionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyToken);
  app.addHook('preHandler', requireRole(['admin']));

  // GET /api/admin/submissions/stats  (define before /:id)
  app.get('/stats', async (_req, reply) => {
    reply.send({ stats: await getStats() });
  });

  // GET /api/admin/submissions
  app.get('/', async (req, reply) => {
    const filters = listSubmissionsQuerySchema.parse(req.query);
    reply.send({ submissions: await listSubmissions(filters) });
  });

  // GET /api/admin/submissions/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const submission = await getSubmission(req.params.id);
    if (!submission) return reply.code(404).send({ error: 'Submission not found' });
    reply.send({ submission });
  });
}
