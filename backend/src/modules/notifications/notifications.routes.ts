import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../../db/pool.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

async function listNotifications() {
  // PRD §6.5 — unread + recent, joined to submission for display
  return query(
    `select n.id, n.is_read as "isRead", n.created_at as "createdAt",
            s.id as "submissionId", s.reference_no as "referenceNo",
            s.patient_name as "patientName", u.name as "submittedBy"
       from notifications n
       join form_submissions s on s.id = n.submission_id
       join users u on u.id = s.user_id
      order by n.created_at desc
      limit 50`
  );
}

async function markRead(id: string) {
  return queryOne(
    `update notifications set is_read = true where id = $1 returning id`,
    [id]
  );
}

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyToken);
  app.addHook('preHandler', requireRole(['admin']));

  // GET /api/admin/notifications
  app.get('/', async (_req, reply) => {
    reply.send({ notifications: await listNotifications() });
  });

  // PATCH /api/admin/notifications/:id/read
  app.patch<{ Params: { id: string } }>('/:id/read', async (req, reply) => {
    const row = await markRead(req.params.id);
    if (!row) return reply.code(404).send({ error: 'Notification not found' });
    reply.send({ ok: true });
  });
}
