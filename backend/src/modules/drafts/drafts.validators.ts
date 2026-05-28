import { z } from 'zod';

export const upsertDraftSchema = z.object({
  patientName: z.string().max(150).optional(),
  currentSection: z.number().int().min(1).max(11),
  formData: z.record(z.any()),               // section data blob
  completionPct: z.number().int().min(0).max(100).optional(),
});

export type UpsertDraftInput = z.infer<typeof upsertDraftSchema>;
