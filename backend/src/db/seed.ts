import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, query } from './pool.js';
import { config, env } from '../config/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  // 1. Apply schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Schema applied');

  // 2. Seed admin from env (PRD §4.2, §12 — no hardcoded secret in source)
  let hash = env.ADMIN_SEED_PASSWORD_HASH;
  if (!hash) {
    if (!env.ADMIN_SEED_PASSWORD) {
      throw new Error('Set ADMIN_SEED_PASSWORD or ADMIN_SEED_PASSWORD_HASH to seed the admin');
    }
    hash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, config.bcryptRounds);
  }

  await query(
    `insert into users (user_id, name, password_hash, role, is_active)
     values ($1, 'OneDNA Administrator', $2, 'admin', true)
     on conflict (user_id) do nothing`,
    [env.ADMIN_SEED_ID, hash]
  );
  console.log(`✅ Admin seeded (user_id: ${env.ADMIN_SEED_ID})`);

  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
