import type { FastifyInstance } from 'fastify';

// PRD §7 Auditability — log every request: timestamp, userId, route, HTTP status
export function registerRequestLogger(app: FastifyInstance) {
  app.addHook('onResponse', (req, reply, done) => {
    req.log.info({
      ts: new Date().toISOString(),
      userId: req.user?.userId ?? null,
      method: req.method,
      url: req.url,
      status: reply.statusCode,
    }, 'request');
    done();
  });
}
