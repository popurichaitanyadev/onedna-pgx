import bcrypt from 'bcryptjs';
import { query, queryOne } from '../../db/pool.js';
import { config } from '../../config/index.js';
import type { CreateUserInput, UpdateUserInput } from './users.validators.js';

export class ConflictError extends Error {}

export async function listUsers() {
  // PRD §6.8 — Name, UserID, Phone, Address, Date Created, Status
  return query(
    `select id, name, user_id as "userId", phone, address,
            is_active as "isActive", created_at as "createdAt"
       from users
      where role = 'user'
      order by created_at desc`
  );
}

export async function createUser(input: CreateUserInput) {
  // Server validates uniqueness of UserID (PRD §6.8)
  const existing = await queryOne(`select 1 from users where user_id = $1`, [input.userId]);
  if (existing) throw new ConflictError('User ID already exists');

  const hash = await bcrypt.hash(input.password, config.bcryptRounds);

  const row = await queryOne(
    `insert into users (user_id, name, password_hash, role, phone, address, is_active)
     values ($1, $2, $3, 'user', $4, $5, true)
     returning id, name, user_id as "userId", phone, address,
               is_active as "isActive", created_at as "createdAt"`,
    [input.userId, input.name, hash, input.phone || null, input.address || null]
  );
  return row;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) { fields.push(`name = $${i++}`); values.push(input.name); }
  if (input.phone !== undefined) { fields.push(`phone = $${i++}`); values.push(input.phone); }
  if (input.address !== undefined) { fields.push(`address = $${i++}`); values.push(input.address); }
  if (input.isActive !== undefined) { fields.push(`is_active = $${i++}`); values.push(input.isActive); }

  if (fields.length === 0) return null;
  values.push(id);

  return queryOne(
    `update users set ${fields.join(', ')}
      where id = $${i} and role = 'user'
      returning id, name, user_id as "userId", phone, address,
                is_active as "isActive", created_at as "createdAt"`,
    values
  );
}
