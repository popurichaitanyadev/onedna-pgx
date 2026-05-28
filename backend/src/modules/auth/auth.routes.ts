import type { FastifyInstance } from 'fastify';
import {
  ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions,
  signAccessToken, signWsTicket, verifyRefreshToken, type TokenPayload,
} from '../../utils/jwt.js';
import { verifyToken } from '../../middleware/auth.js';
import { loginSchema } from './auth.validators.js';
import { login, AuthError } from './auth.service.js';

const ACCESS_MS = 15 * 60 * 1000;          // 15 min (PRD §6.1)
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }, // PRD §12
  }, async (req, reply) => {
    const input = loginSchema.parse(req.body);
    try {
      const { accessToken, refreshToken, user } = await login(input);
      reply
        .setCookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MS))
        .setCookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MS))
        .send({ user });
    } catch (err) {
      if (err instanceof AuthError) {
        // Generic message — no field-level enumeration (PRD §6.1)
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      throw err;
    }
  });

  // POST /api/auth/refresh — silent refresh
  app.post('/refresh', async (req, reply) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return reply.code(401).send({ error: 'No refresh token' });
    try {
      const payload = verifyRefreshToken(token);
      const fresh: TokenPayload = {
        sub: payload.sub, userId: payload.userId, role: payload.role, name: payload.name,
      };
      reply
        .setCookie(ACCESS_COOKIE, signAccessToken(fresh), cookieOptions(ACCESS_MS))
        .send({ ok: true });
    } catch {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // POST /api/auth/logout
  app.post('/logout', { preHandler: verifyToken }, async (_req, reply) => {
    reply
      .clearCookie(ACCESS_COOKIE, { path: '/' })
      .clearCookie(REFRESH_COOKIE, { path: '/' })
      .send({ ok: true });
  });

  // GET /api/auth/me — current session
  app.get('/me', { preHandler: verifyToken }, async (req, reply) => {
    reply.send({ user: req.user });
  });

  // GET /api/auth/ws-ticket — 60-second ticket for WebSocket auth (PRD §6.5)
  // Token stored in HttpOnly cookie cannot be read by JS; this endpoint
  // re-signs the payload with a 60 s expiry so the client can pass it via ?token=
  app.get('/ws-ticket', { preHandler: verifyToken }, async (req, reply) => {
    const ticket = signWsTicket(req.user!);
    reply.send({ ticket });
  });
}
