import { query, queryOne, withTransaction } from '../../db/pool.js';
import { broadcastSubmission } from '../../ws/hub.js';
import type { CreateSubmissionInput } from './submissions.validators.js';

// PRD §6.4 — transactional: persist submission, delete draft, create
// notification, emit WS event. No partial writes (PRD §7).
export async function createSubmission(
  user: { sub: string; name: string },
  input: CreateSubmissionInput
) {
  const result = await withTransaction(async (client) => {
    // Merge consent + signature into stored form data
    const fullData = { ...input.formData, consent: input.consent, signature: input.signature };

    const refRows = await client.query<{ next_reference_no: string }>('select next_reference_no()');
    const referenceNo = refRows.rows[0].next_reference_no;

    const subRows = await client.query(
      `insert into form_submissions (user_id, reference_no, patient_name, form_data)
       values ($1, $2, $3, $4)
       returning id, reference_no as "referenceNo", patient_name as "patientName", submitted_at as "submittedAt"`,
      [user.sub, referenceNo, input.patientName, fullData]
    );
    const submission = subRows.rows[0];

    // Delete associated draft (PRD §6.3, §6.4)
    if (input.draftId) {
      await client.query(`delete from form_drafts where id = $1 and user_id = $2`, [input.draftId, user.sub]);
    }

    // Notification record
    await client.query(
      `insert into notifications (submission_id, is_read) values ($1, false)`,
      [submission.id]
    );

    return submission;
  });

  // Fire WS event AFTER commit (PRD §6.5)
  broadcastSubmission({
    type: 'FORM_SUBMITTED',
    submissionId: result.id,
    patientName: result.patientName,
    submittedBy: user.name,
    timestamp: result.submittedAt,
  });

  return result;
}

// PRD §6.7 — list all submissions, optional filters
export async function listSubmissions(filters: { userId?: string; from?: string; to?: string }) {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (filters.userId) { where.push(`s.user_id = $${i++}`); params.push(filters.userId); }
  if (filters.from)   { where.push(`s.submitted_at >= $${i++}`); params.push(filters.from); }
  if (filters.to)     { where.push(`s.submitted_at <= $${i++}`); params.push(filters.to); }
  const clause = where.length ? `where ${where.join(' and ')}` : '';

  return query(
    `select s.id,
            s.reference_no as "referenceNo",
            s.patient_name as "patientName",
            u.name         as "submittedBy",
            u.id           as "userId",
            s.submitted_at as "submittedAt"
       from form_submissions s
       join users u on u.id = s.user_id
       ${clause}
      order by s.submitted_at desc`,
    params
  );
}

export async function getSubmission(id: string) {
  return queryOne(
    `select s.id, s.reference_no as "referenceNo", s.patient_name as "patientName",
            s.form_data as "formData", s.submitted_at as "submittedAt",
            u.name as "submittedBy", u.user_id as "submittedByUserId"
       from form_submissions s
       join users u on u.id = s.user_id
      where s.id = $1`,
    [id]
  );
}

// PRD §6.6 — counts grouped by period
export async function getStats() {
  const row = await queryOne<{
    total: string; day: string; week: string; month: string; year: string;
  }>(
    `select
        count(*)                                                          as total,
        count(*) filter (where submitted_at >= date_trunc('day', now()))   as day,
        count(*) filter (where submitted_at >= date_trunc('week', now()))  as week,
        count(*) filter (where submitted_at >= date_trunc('month', now())) as month,
        count(*) filter (where submitted_at >= date_trunc('year', now()))  as year
       from form_submissions`
  );

  // Time series for the bar chart (last 12 months)
  const series = await query(
    `select to_char(date_trunc('month', submitted_at), 'YYYY-MM') as bucket,
            count(*)::int as count
       from form_submissions
      where submitted_at >= now() - interval '12 months'
      group by bucket
      order by bucket`
  );

  return {
    total: Number(row?.total ?? 0),
    day: Number(row?.day ?? 0),
    week: Number(row?.week ?? 0),
    month: Number(row?.month ?? 0),
    year: Number(row?.year ?? 0),
    series,
  };
}
