import bcrypt from 'bcryptjs';
import { queryOne } from '../../db/pool.js';
import { signAccessToken, signRefreshToken, type Role, type TokenPayload } from '../../utils/jwt.js';
import type { LoginInput } from './auth.validators.js';

interface UserRow {
  id: string;
  user_id: string;
  name: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
}

export class AuthError extends Error {
  constructor(public code = 'AUTH_FAILED') {
    super('Authentication failed');
  }
}

export async function login(input: LoginInput) {
  // Role selection short-circuits credential lookup (PRD §5)
  const user = await queryOne<UserRow>(
    `select id, user_id, name, password_hash, role, is_active
       from users
      where user_id = $1 and role = $2`,
    [input.userId, input.role]
  );

  // Generic failure — no user enumeration (PRD §6.1, §12)
  if (!user || !user.is_active) {
    // Still run a hash compare to equalise timing
    await bcrypt.compare(input.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinv');
    throw new AuthError();
  }

  const ok = await bcrypt.compare(input.password, user.password_hash);
  if (!ok) throw new AuthError();

  const payload: TokenPayload = {
    sub: user.id,
    userId: user.user_id,
    role: user.role,
    name: user.name,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, userId: user.user_id, name: user.name, role: user.role },
  };
}
