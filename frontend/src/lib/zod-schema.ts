import { z } from 'zod';
import type { FieldDef } from './form-schema';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BP_RE = /^\d{2,3}\s*\/\s*\d{2,3}$/;
const PHONE_RE = /^[+\d\s\-(). ]{7,20}$/;

interface Range { min?: number; max?: number; minMsg?: string; maxMsg?: string }

const CLINICAL_RANGES: Record<string, Range> = {
  age:            { min: 0,     max: 120,    maxMsg: 'Enter a valid age (0–120)' },
  height:         { min: 50,    max: 250,    minMsg: 'Height must be ≥ 50 cm',   maxMsg: 'Height must be ≤ 250 cm' },
  weight:         { min: 1,     max: 300,    minMsg: 'Weight must be > 0 kg',     maxMsg: 'Weight must be ≤ 300 kg' },
  bmi:            { min: 5,     max: 80 },
  waistCirc:      { min: 30,    max: 200 },
  heartRate:      { min: 30,    max: 250,    minMsg: 'Heart rate must be ≥ 30 bpm', maxMsg: 'Heart rate must be ≤ 250 bpm' },
  spo2:           { min: 70,    max: 100,    minMsg: 'SpO2 must be ≥ 70%',         maxMsg: 'SpO2 must be ≤ 100%' },
  hba1c:          { min: 3,     max: 20,     maxMsg: 'HbA1c must be ≤ 20%' },
  fpg:            { min: 20,    max: 600 },
  ppg:            { min: 20,    max: 800 },
  fastingInsulin: { min: 0,     max: 500 },
  homaIr:         { min: 0,     max: 100 },
  cPeptide:       { min: 0,     max: 20 },
  totalChol:      { min: 50,    max: 600 },
  ldl:            { min: 10,    max: 500 },
  hdl:            { min: 10,    max: 200 },
  triglycerides:  { min: 20,    max: 3000 },
  ast:            { min: 0,     max: 5000 },
  alt:            { min: 0,     max: 5000 },
  creatinine:     { min: 0.1,   max: 30 },
  egfr:           { min: 0,     max: 200 },
  tsh:            { min: 0.001, max: 200 },
  vitD:           { min: 0,     max: 400 },
  vitB12:         { min: 0,     max: 5000 },
  hsCrp:          { min: 0,     max: 300 },
  albumin:        { min: 1,     max: 6 },
  uricAcid:       { min: 0,     max: 30 },
  dailySteps:     { min: 0,     max: 100_000 },
};

function makeNumberSchema(key: string, label: string, required: boolean): z.ZodTypeAny {
  const range = CLINICAL_RANGES[key];
  return z.any().superRefine((val, ctx) => {
    const empty = val === '' || val === undefined || val === null;
    if (empty) {
      if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
      return;
    }
    const n = Number(val);
    if (isNaN(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a valid number` });
      return;
    }
    if (range?.min !== undefined && n < range.min) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: range.minMsg ?? `${label} must be ≥ ${range.min}` });
    }
    if (range?.max !== undefined && n > range.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: range.maxMsg ?? `${label} must be ≤ ${range.max}` });
    }
  });
}

export function getFieldSchema(field: FieldDef): z.ZodTypeAny {
  const { key, label, type, required, options } = field;

  if (type === 'number') return makeNumberSchema(key, label, !!required);

  if (type === 'email') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) {
        if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email is required' });
        return;
      }
      if (!EMAIL_RE.test(s)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid email address' });
    });
  }

  if (type === 'tel') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) {
        if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
        return;
      }
      if (!PHONE_RE.test(s)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number (7–20 digits)' });
    });
  }

  if (type === 'checkbox-group') {
    return z.any().superRefine((v, ctx) => {
      const arr = Array.isArray(v) ? v : [];
      if (required && arr.length === 0)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} — select at least one option` });
    });
  }

  if (type === 'radio' || type === 'select') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) {
        if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
        return;
      }
      if (options && !options.includes(s))
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label}: invalid selection` });
    });
  }

  // Special text validators
  if (key === 'bloodPressure') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) {
        if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Blood Pressure is required' });
        return;
      }
      if (!BP_RE.test(s)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Format as systolic/diastolic, e.g. 120/80' });
    });
  }

  if (key === 'fullName') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full Name is required' }); return; }
      if (s.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full Name must be at least 2 characters' });
      if (s.length > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full Name must be 100 characters or less' });
    });
  }

  if (key === 'kitId') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kit ID is required' }); return; }
      if (s.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kit ID must be at least 3 characters' });
    });
  }

  if (key === 'signature') {
    return z.any().superRefine((v, ctx) => {
      const s = String(v ?? '').trim();
      if (!s) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Signature is required' }); return; }
      if (s.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please type your full name as signature' });
    });
  }

  // Default: text, date, datetime, time, textarea
  return z.any().superRefine((v, ctx) => {
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (empty && required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
  });
}
