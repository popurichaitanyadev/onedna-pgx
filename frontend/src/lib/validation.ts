import { z } from 'zod';
import { SECTIONS, type FormData, type FieldDef } from './form-schema';
import { getFieldSchema } from './zod-schema';

function isEmpty(v: any) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

function fieldVisible(field: FieldDef, data: FormData): boolean {
  if (!field.conditionalOn) return true;
  const cur = data[field.conditionalOn.key];
  if (Array.isArray(cur)) return cur.includes(field.conditionalOn.value);
  return cur === field.conditionalOn.value;
}

export function validateSection(sectionId: number, data: FormData): Record<string, string> {
  const section = SECTIONS.find((s) => s.id === sectionId);
  const errors: Record<string, string> = {};
  if (!section) return errors;

  const shape: Record<string, z.ZodTypeAny> = {};
  const input: Record<string, any> = {};

  for (const f of section.fields) {
    if (!fieldVisible(f, data)) continue;
    shape[f.key] = getFieldSchema(f);
    input[f.key] = data[f.key];
  }

  if (Object.keys(shape).length === 0) return errors;

  const result = z.object(shape).safeParse(input);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (key && !errors[key]) errors[key] = issue.message;
    }
  }

  return errors;
}

export function validateAll(data: FormData): Record<number, Record<string, string>> {
  const out: Record<number, Record<string, string>> = {};
  for (const s of SECTIONS) {
    const e = validateSection(s.id, data);
    if (Object.keys(e).length) out[s.id] = e;
  }
  return out;
}

export function computeBmi(height: any, weight: any): string | undefined {
  const h = parseFloat(height), w = parseFloat(weight);
  if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
  return undefined;
}

export function completionPct(data: FormData): number {
  let required = 0, filled = 0;
  for (const s of SECTIONS) {
    for (const f of s.fields) {
      if (!f.required || !fieldVisible(f, data)) continue;
      required++;
      if (!isEmpty(data[f.key])) filled++;
    }
  }
  if (required === 0) return 0;
  return Math.round((filled / required) * 100);
}

export function sectionStatus(sectionId: number, data: FormData): 'not-started' | 'in-progress' | 'completed' {
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return 'not-started';
  const visible = section.fields.filter((f) => fieldVisible(f, data));
  if (visible.length === 0) return 'completed';
  const touched = visible.filter((f) => !isEmpty(data[f.key]));
  if (touched.length === 0) return 'not-started';
  const errs = validateSection(sectionId, data);
  return Object.keys(errs).length === 0 ? 'completed' : 'in-progress';
}
