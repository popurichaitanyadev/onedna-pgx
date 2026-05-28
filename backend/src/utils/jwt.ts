import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export type Role = 'admin' | 'user';

export interface TokenPayload {
  sub: string;      // user UUID
  userId: string;   // login username
  role: Role;
  name: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.accessTokenTtl } as SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.refreshTokenTtl } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
}

// Cookie options — HttpOnly, Secure, SameSite=Strict (PRD §12)
export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

// Short-lived ticket for WebSocket auth (60 s) — same secret so verifyAccessToken works
export function signWsTicket(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: '60s' } as SignOptions);
}

export const ACCESS_COOKIE = 'onedna_at';
export const REFRESH_COOKIE = 'onedna_rt';
