import { z } from 'zod';

// PRD §6.8 — Add User fields
export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Full name is required').max(150),
    userId: z.string().min(3, 'User ID must be at least 3 characters').max(50)
      .regex(/^[a-zA-Z0-9._-]+$/, 'User ID may only contain letters, numbers, . _ -'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    phone: z.string().max(20).optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateUserSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  isActive: z.boolean().optional(), // soft-delete toggle (PRD §6.8 — no hard deletes)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
