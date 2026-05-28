import type { FastifyReply, FastifyRequest } from 'fastify';
import { ACCESS_COOKIE, verifyAccessToken, type Role, type TokenPayload } from '../utils/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

// PRD §4.3 (1) — verifyToken: validate JWT, attach payload to request
export async function verifyToken(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  try {
    req.user = verifyAccessToken(token);
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

// PRD §4.3 (2) — requireRole: enforce allowed roles, else 403
export function requireRole(roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return reply.code(403).send({ error: 'Forbidden: insufficient permissions' });
    }
  };
}
