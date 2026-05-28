import { z } from 'zod';

// PRD §6.1 — login fields: UserID, Password, role selector
export const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(50),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'user']),
});

export type LoginInput = z.infer<typeof loginSchema>;
