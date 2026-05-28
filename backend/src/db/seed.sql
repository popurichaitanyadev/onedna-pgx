-- ============================================================
-- Admin seed — run AFTER schema.sql
-- The password_hash below must be generated with bcrypt (12 rounds)
-- from ADMIN_SEED_PASSWORD and injected at boot. This file documents
-- the shape; the backend seeds programmatically (see seed.ts).
-- ============================================================

-- Placeholder; real seeding happens in backend/src/db/seed.ts using
-- env vars ADMIN_SEED_ID and ADMIN_SEED_PASSWORD_HASH so no secret
-- lands in source control.

-- Example (DO NOT COMMIT A REAL HASH):
-- insert into users (user_id, name, password_hash, role, is_active)
-- values ('admin', 'OneDNA Administrator', '$2b$12$....', 'admin', true)
-- on conflict (user_id) do nothing;
