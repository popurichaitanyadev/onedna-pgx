import { query, queryOne } from '../../db/pool.js';
import type { UpsertDraftInput } from './drafts.validators.js';

// PRD §6.3 — list with reference, patient name, dates, completion %
export async function listDrafts(userId: string) {
  return query(
    `select id,
            id as "formReferenceId",
            patient_name as "patientName",
            created_at   as "dateCreated",
            updated_at   as "lastUpdated",
            completion_pct as "completionPct",
            current_section as "currentSection"
       from form_drafts
      where user_id = $1
      order by updated_at desc`,
    [userId]
  );
}

export async function getDraft(userId: string, id: string) {
  return queryOne(
    `select id, patient_name as "patientName", current_section as "currentSection",
            form_data as "formData", completion_pct as "completionPct",
            created_at as "createdAt", updated_at as "updatedAt"
       from form_drafts
      where id = $1 and user_id = $2`,
    [id, userId]
  );
}

export async function createDraft(userId: string, input: UpsertDraftInput) {
  return queryOne(
    `insert into form_drafts (user_id, patient_name, current_section, form_data, completion_pct)
     values ($1, $2, $3, $4, $5)
     returning id, patient_name as "patientName", current_section as "currentSection",
               form_data as "formData", completion_pct as "completionPct"`,
    [userId, input.patientName ?? null, input.currentSection, input.formData, input.completionPct ?? 0]
  );
}

export async function updateDraft(userId: string, id: string, input: UpsertDraftInput) {
  return queryOne(
    `update form_drafts
        set patient_name = $1, current_section = $2, form_data = $3, completion_pct = $4
      where id = $5 and user_id = $6
      returning id, patient_name as "patientName", current_section as "currentSection",
                form_data as "formData", completion_pct as "completionPct"`,
    [input.patientName ?? null, input.currentSection, input.formData, input.completionPct ?? 0, id, userId]
  );
}

export async function deleteDraft(userId: string, id: string) {
  const row = await queryOne(
    `delete from form_drafts where id = $1 and user_id = $2 returning id`,
    [id, userId]
  );
  return !!row;
}
