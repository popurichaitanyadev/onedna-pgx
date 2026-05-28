import { z } from 'zod';

// PRD §6.4 — submission requires consent + signature in the form data
export const createSubmissionSchema = z.object({
  draftId: z.string().uuid().optional(),       // associated draft to delete
  patientName: z.string().min(1).max(150),
  formData: z.record(z.any()),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Patient consent is required' }),
  }),
  signature: z.string().min(1, 'Patient signature is required'),
});

export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

export const listSubmissionsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
