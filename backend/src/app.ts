import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { registerRequestLogger } from './middleware/logger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { draftRoutes } from './modules/drafts/drafts.routes.js';
import { submissionRoutes, adminSubmissionRoutes } from './modules/submissions/submissions.routes.js';
import { notificationRoutes } from './modules/notifications/notifications.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.isProd ? 'info' : 'debug',
      // PRD §12 — redact sensitive fields from logs
      redact: ['req.headers.cookie', 'req.body.password', 'req.body.confirmPassword'],
    },
  });

  // Security & infra plugins
  await app.register(cors, {
    origin: config.corsOrigins,    // PRD §12 — whitelisted origins only
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, { global: false }); // opt-in per route (login)

  app.setErrorHandler(errorHandler);
  registerRequestLogger(app);

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // Route registration (PRD §9 endpoint map)
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/admin/users' });
  await app.register(draftRoutes, { prefix: '/api/drafts' });
  await app.register(submissionRoutes, { prefix: '/api/submissions' });
  await app.register(adminSubmissionRoutes, { prefix: '/api/admin/submissions' });
  await app.register(notificationRoutes, { prefix: '/api/admin/notifications' });

  return app;
}
