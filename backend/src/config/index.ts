import 'dotenv/config';
import { z } from 'zod';

// PRD §11 — environment variables validated at startup
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),

  // Admin seed (PRD §4.2) — no secret in source
  ADMIN_SEED_ID: z.string().default('admin'),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),       // used by seed script
  ADMIN_SEED_PASSWORD_HASH: z.string().optional(),         // pre-hashed alternative

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const config = {
  ...env,
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
  accessTokenTtl: '15m',          // PRD §6.1
  refreshTokenTtl: '7d',          // PRD §6.1
  bcryptRounds: 12,               // PRD §12
  isProd: env.NODE_ENV === 'production',
};
