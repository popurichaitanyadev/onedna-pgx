import { SECTIONS, type FormData, type FieldDef } from './form-schema';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BP_RE = /^\d{2,3}\s*\/\s*\d{2,3}$/;

function isEmpty(v: any) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

function fieldVisible(field: FieldDef, data: FormData): boolean {
  if (!field.conditionalOn) return true;
  const cur = data[field.conditionalOn.key];
  if (Array.isArray(cur)) return cur.includes(field.conditionalOn.value);
  return cur === field.conditionalOn.value;
}

// Validate a single section; returns map of field key -> error
export function validateSection(sectionId: number, data: FormData): Record<string, string> {
  const section = SECTIONS.find((s) => s.id === sectionId);
  const errors: Record<string, string> = {};
  if (!section) return errors;

  for (const f of section.fields) {
    if (!fieldVisible(f, data)) continue;
    const val = data[f.key];

    if (f.required && isEmpty(val)) {
      errors[f.key] = `${f.label} is required`;
      continue;
    }
    if (isEmpty(val)) continue;

    if (f.type === 'email' && !EMAIL_RE.test(val)) errors[f.key] = 'Enter a valid email';
    if (f.key === 'bloodPressure' && !BP_RE.test(val)) errors[f.key] = 'Format as systolic/diastolic, e.g. 120/80';
    if (f.type === 'number' && isNaN(Number(val))) errors[f.key] = 'Must be a number';
    if (f.key === 'age' && (Number(val) < 0 || Number(val) > 120)) errors[f.key] = 'Enter a valid age';
  }
  return errors;
}

// Section 11 also requires the consent checkbox (handled in UI separately)
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

// Completion % across all required fields (PRD §6.3 drafts listing)
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
  // Section with no schema fields (e.g. section 10 geneVariants table — all optional).
  // Treat as completed so it never blocks allComplete / submission.
  if (visible.length === 0) return 'completed';
  const touched = visible.filter((f) => !isEmpty(data[f.key]));
  if (touched.length === 0) return 'not-started';
  const errs = validateSection(sectionId, data);
  return Object.keys(errs).length === 0 ? 'completed' : 'in-progress';
}
