import { PoolClient, QueryResultRow } from 'pg';
import { query, withTransaction } from '../database/connection';
import { syncSlotToCalendar } from './calendar.service';
import { sendEmail } from './email.service';

export type BackgroundJobType = 'email' | 'calendar_sync';

interface BackgroundJobRow extends QueryResultRow {
  id: string;
  job_type: BackgroundJobType;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export async function enqueueBackgroundJob(
  client: PoolClient,
  jobType: BackgroundJobType,
  payload: Record<string, unknown>,
  options: { dedupeKey?: string; maxAttempts?: number } = {}
) {
  const result = await client.query<{ id: string }>(
    `INSERT INTO background_jobs (job_type, payload, dedupe_key, max_attempts)
     VALUES ($1, $2::jsonb, $3, $4)
     RETURNING id`,
    [jobType, JSON.stringify(payload), options.dedupeKey || null, options.maxAttempts || 8]
  );
  return result.rows[0].id;
}

async function claimJob(): Promise<BackgroundJobRow | null> {
  return withTransaction(async client => {
    await client.query(
      `UPDATE background_jobs
          SET status = 'pending', locked_at = NULL, updated_at = NOW()
        WHERE status = 'running'
          AND locked_at < NOW() - INTERVAL '5 minutes'`
    );
    const result = await client.query<BackgroundJobRow>(
      `UPDATE background_jobs
          SET status = 'running', attempts = attempts + 1,
              locked_at = NOW(), updated_at = NOW()
        WHERE id = (
          SELECT id
            FROM background_jobs
           WHERE status = 'pending' AND run_after <= NOW()
           ORDER BY run_after, created_at
           LIMIT 1
           FOR UPDATE SKIP LOCKED
        )
        RETURNING id, job_type, payload, attempts, max_attempts`
    );
    return result.rows[0] || null;
  });
}

async function executeJob(job: BackgroundJobRow) {
  if (job.job_type === 'calendar_sync') {
    const slotId = job.payload.slotId;
    if (typeof slotId !== 'string') throw new Error('Calendar job is missing slotId');
    await syncSlotToCalendar(slotId);
    return;
  }

  const { to, subject, html } = job.payload;
  if (typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
    throw new Error('Email job payload is invalid');
  }
  await sendEmail({ to, subject, html });
}

async function completeJob(jobId: string) {
  await query(
    `UPDATE background_jobs
        SET status = 'completed', completed_at = NOW(), locked_at = NULL,
            last_error = NULL, updated_at = NOW()
      WHERE id = $1`,
    [jobId]
  );
}

async function failJob(job: BackgroundJobRow, error: unknown) {
  const dead = job.attempts >= job.max_attempts;
  const delayMinutes = Math.min(60, Math.max(1, 2 ** Math.min(job.attempts - 1, 6)));
  const message = error instanceof Error ? error.message : String(error);
  await query(
    `UPDATE background_jobs
        SET status = $2,
            run_after = CASE WHEN $2 = 'pending'
              THEN NOW() + ($3 * INTERVAL '1 minute')
              ELSE run_after END,
            locked_at = NULL, last_error = $4, updated_at = NOW()
      WHERE id = $1`,
    [job.id, dead ? 'dead' : 'pending', delayMinutes, message.slice(0, 4000)]
  );
}

export async function processBackgroundJobs(limit = 5) {
  let completed = 0;
  let failed = 0;
  for (let index = 0; index < limit; index += 1) {
    const job = await claimJob();
    if (!job) break;
    try {
      await executeJob(job);
      await completeJob(job.id);
      completed += 1;
    } catch (error) {
      console.error(`Background job ${job.id} failed:`, error);
      await failJob(job, error);
      failed += 1;
    }
  }
  return { completed, failed };
}
