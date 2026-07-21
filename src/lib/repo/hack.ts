// src/lib/repo/hack.ts
//
// The hack_ backend — the frozen buildathon submission, used by /demo.
// These are the exact queries the API routes ran before the repo layer existed; the tables
// already use the snake_case shape the API returns, so there is no mapping to do here.
//
// Nothing in this file should change without a reason to change the demo itself.

import { q, one } from '../db';
import type {
  CreateJobInput,
  CreatePlugInput,
  JobRow,
  JobStatus,
  PlugPatch,
  PlugRow,
  Source,
  TxnRow,
} from './index';

export const source: Source = 'hack';

// ---------------------------------------------------------------- plugs

export async function listPlugs(): Promise<PlugRow[]> {
  return q<PlugRow>('select * from hack_plugs order by rating desc');
}

export async function getPlug(plugId: string): Promise<PlugRow | null> {
  return one<PlugRow>('select * from hack_plugs where id = $1', [plugId]);
}

export async function createPlug(input: CreatePlugInput): Promise<PlugRow> {
  const plug = await one<PlugRow>(
    `insert into hack_plugs
       (name, trade, photo_url, rating, jobs_completed, verified,
        wallet_balance_available, wallet_balance_locked)
     values ($1, $2, $3, 0, 0, false, 0, 0)
     returning *`,
    [`${input.firstName} ${input.lastName}`, input.trade, input.photoUrl ?? null]
  );
  return plug as PlugRow;
}

export async function updatePlug(plugId: string, patch: PlugPatch): Promise<PlugRow | null> {
  const sets: string[] = [];
  const vals: any[] = [];
  const add = (frag: string, v: any) => {
    vals.push(v);
    sets.push(`${frag} = $${vals.length}`);
  };

  if (typeof patch.bio === 'string') add('bio', patch.bio.slice(0, 600));
  if (typeof patch.photoUrl === 'string' || patch.photoUrl === null) add('photo_url', patch.photoUrl);
  if (Array.isArray(patch.workPosts)) add('work_posts', JSON.stringify(patch.workPosts));
  if (typeof patch.verified === 'boolean') add('verified', patch.verified);

  if (!sets.length) return getPlug(plugId);

  vals.push(plugId);
  return one<PlugRow>(
    `update hack_plugs set ${sets.join(', ')} where id = $${vals.length} returning *`,
    vals
  );
}

export async function debitAvailable(plugId: string, amount: number): Promise<void> {
  await q(
    'update hack_plugs set wallet_balance_available = wallet_balance_available - $1 where id = $2',
    [amount, plugId]
  );
}

export async function lockFunds(plugId: string, amount: number): Promise<void> {
  await q('select increment_wallet_locked($1, $2)', [plugId, amount]);
}

export async function unlockFunds(plugId: string, amount: number): Promise<void> {
  await q('select move_locked_to_available($1, $2)', [plugId, amount]);
}

// ---------------------------------------------------------------- jobs

export async function listJobs(statuses?: string[]): Promise<JobRow[]> {
  return statuses?.length
    ? q<JobRow>('select * from hack_jobs where status = any($1) order by created_at desc limit 50', [statuses])
    : q<JobRow>('select * from hack_jobs order by created_at desc limit 50');
}

export async function getJob(jobId: string): Promise<JobRow | null> {
  return one<JobRow>('select * from hack_jobs where id = $1', [jobId]);
}

export async function jobsForPlug(plugId: string): Promise<JobRow[]> {
  return q<JobRow>(
    `select id, plug_id, client_name, client_phone, job_description, amount, status,
            created_at, completed_at, escrow_released_at
     from hack_jobs where plug_id = $1 order by created_at desc`,
    [plugId]
  );
}

export async function createJob(input: CreateJobInput): Promise<JobRow> {
  const job = await one<JobRow>(
    `insert into hack_jobs (plug_id, client_name, client_phone, job_description, amount, status)
     values ($1, $2, $3, $4, $5, 'requested') returning *`,
    [input.plugId, input.clientName, input.clientPhone ?? null, input.jobDescription ?? null, input.amount]
  );
  return job as JobRow;
}

export async function setJobStatus(
  jobId: string,
  status: JobStatus,
  opts?: { completedAt?: Date; escrowReleasedAt?: Date }
): Promise<void> {
  const sets = ['status = $2'];
  const vals: any[] = [jobId, status];
  if (opts?.completedAt) {
    vals.push(opts.completedAt.toISOString());
    sets.push(`completed_at = $${vals.length}`);
  }
  if (opts?.escrowReleasedAt) {
    vals.push(opts.escrowReleasedAt.toISOString());
    sets.push(`escrow_released_at = $${vals.length}`);
  }
  await q(`update hack_jobs set ${sets.join(', ')} where id = $1`, vals);
}

// ---------------------------------------------------------------- transactions

export async function txnsForJob(jobId: string): Promise<TxnRow[]> {
  return q<TxnRow>('select * from hack_transactions where job_id = $1 order by created_at asc', [jobId]);
}

export async function latestAlatpayTxnForJob(jobId: string): Promise<TxnRow | null> {
  return one<TxnRow>(
    `select * from hack_transactions
     where job_id = $1 and alatpay_transaction_id is not null
     order by created_at desc limit 1`,
    [jobId]
  );
}

export async function findReusableCollection(jobId: string): Promise<TxnRow | null> {
  return one<TxnRow>(
    `select * from hack_transactions
     where job_id = $1 and type = 'collection' and status = 'pending'
       and alatpay_virtual_account is not null
     order by created_at desc limit 1`,
    [jobId]
  );
}

export async function findTxnByAlatpayId(alatpayTransactionId: string): Promise<TxnRow | null> {
  return one<TxnRow>('select * from hack_transactions where alatpay_transaction_id = $1', [
    alatpayTransactionId,
  ]);
}

export async function insertPendingCollection(input: {
  jobId: string;
  alatpayTransactionId: string | null;
  virtualAccount: string | null;
  amount: number;
  raw: unknown;
}): Promise<void> {
  await q(
    `insert into hack_transactions
       (job_id, alatpay_transaction_id, alatpay_virtual_account, amount, type, status, raw_webhook_payload)
     values ($1, $2, $3, $4, 'collection', 'pending', $5)`,
    [input.jobId, input.alatpayTransactionId, input.virtualAccount, input.amount, input.raw ?? null]
  );
}

export async function upsertCollection(input: {
  alatpayTransactionId: string;
  jobId: string | null;
  amount: number;
  status: 'pending' | 'successful';
  raw: unknown;
}): Promise<void> {
  await q(
    `insert into hack_transactions
       (alatpay_transaction_id, job_id, amount, type, status, raw_webhook_payload)
     values ($1, $2, $3, 'collection', $4, $5)
     on conflict (alatpay_transaction_id) where alatpay_transaction_id is not null
     do update set status = excluded.status,
                   job_id = excluded.job_id,
                   amount = excluded.amount,
                   raw_webhook_payload = excluded.raw_webhook_payload`,
    [input.alatpayTransactionId, input.jobId, input.amount, input.status, input.raw ?? null]
  );
}

export async function insertOrphanPayload(raw: unknown): Promise<void> {
  await q(
    "insert into hack_transactions (type, status, raw_webhook_payload) values ('collection', 'pending', $1)",
    [raw ?? null]
  );
}

export async function insertRelease(jobId: string, amount: number): Promise<void> {
  await q(
    "insert into hack_transactions (job_id, amount, type, status) values ($1, $2, 'release', 'successful')",
    [jobId, amount]
  );
}

export async function insertWithdrawal(amount: number): Promise<TxnRow | null> {
  return one<TxnRow>(
    "insert into hack_transactions (job_id, amount, type, status) values (null, $1, 'withdrawal', 'pending') returning *",
    [amount]
  );
}

export async function listWithdrawals(limit?: number): Promise<TxnRow[]> {
  return limit
    ? q<TxnRow>("select * from hack_transactions where type = 'withdrawal' order by created_at desc limit $1", [limit])
    : q<TxnRow>("select * from hack_transactions where type = 'withdrawal' order by created_at desc");
}
