// src/lib/repo/demo.ts
//
// In-memory Repo implementation for the /demo surface — NO database.
//
// Replaces the DB-backed hack.ts (the hack_ tables were dropped in a reset). Every method
// mirrors hack.ts's behaviour exactly, but operates on module-level arrays seeded from
// demoData.ts instead of Postgres. State is process-scoped: shared across requests within a
// running server (so a demo lifecycle progresses correctly), and reset on restart. Nothing
// persists across restarts, which is fine for a demo.
//
// getRepo('hack') is wired to this module in index.ts, so all /demo touchpoints — the browse
// page and the 13 job/plug/webhook routes — use it with no per-route changes.

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
import { SEED_JOBS, SEED_PLUGS, SEED_TXNS } from './demoData';

export const source: Source = 'hack';

// Deep-clone the fixtures into mutable state so mutations never touch the seed constants.
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const plugs: PlugRow[] = clone(SEED_PLUGS);
const jobs: JobRow[] = clone(SEED_JOBS);
const txns: TxnRow[] = clone(SEED_TXNS);

const uuid = (): string =>
  (globalThis.crypto?.randomUUID?.() ??
    'd0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0'));
const nowISO = () => new Date().toISOString();
const byCreatedDesc = (a: { created_at: string }, b: { created_at: string }) =>
  b.created_at.localeCompare(a.created_at);
const byCreatedAsc = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at);

// ---------------------------------------------------------------- plugs

export async function listPlugs(): Promise<PlugRow[]> {
  return [...plugs].sort((a, b) => b.rating - a.rating);
}

export async function getPlug(plugId: string): Promise<PlugRow | null> {
  return plugs.find((p) => p.id === plugId) ?? null;
}

export async function createPlug(input: CreatePlugInput): Promise<PlugRow> {
  const plug: PlugRow = {
    id: uuid(),
    name: `${input.firstName} ${input.lastName}`,
    trade: input.trade,
    photo_url: input.photoUrl ?? null,
    rating: 0,
    jobs_completed: 0,
    verified: false,
    wallet_balance_available: 0,
    wallet_balance_locked: 0,
    bio: null,
    work_posts: [],
    created_at: nowISO(),
  };
  plugs.push(plug);

  // Demo convenience: give a freshly onboarded plug a "waiting" job to accept, so the
  // onboarding -> dashboard -> accept -> complete -> release flow works immediately.
  jobs.push({
    id: uuid(),
    plug_id: plug.id,
    client_name: 'Demo Client',
    client_phone: '08030000000',
    job_description: 'Sample job — accept to see the escrow flow',
    amount: 7500,
    status: 'paid_escrow',
    created_at: nowISO(),
    completed_at: null,
    escrow_released_at: null,
  });

  return plug;
}

export async function updatePlug(plugId: string, patch: PlugPatch): Promise<PlugRow | null> {
  const plug = plugs.find((p) => p.id === plugId);
  if (!plug) return null;
  if (typeof patch.bio === 'string') plug.bio = patch.bio.slice(0, 600);
  if (typeof patch.photoUrl === 'string' || patch.photoUrl === null) plug.photo_url = patch.photoUrl;
  if (Array.isArray(patch.workPosts)) plug.work_posts = patch.workPosts;
  if (typeof patch.verified === 'boolean') plug.verified = patch.verified;
  return plug;
}

export async function debitAvailable(plugId: string, amount: number): Promise<void> {
  const plug = plugs.find((p) => p.id === plugId);
  if (plug) plug.wallet_balance_available = Number(plug.wallet_balance_available) - amount;
}

// Mirrors increment_wallet_locked(): locked += amount.
export async function lockFunds(plugId: string, amount: number): Promise<void> {
  const plug = plugs.find((p) => p.id === plugId);
  if (plug) plug.wallet_balance_locked = Number(plug.wallet_balance_locked) + amount;
}

// Mirrors move_locked_to_available(): locked -= amount, available += amount, jobs_completed += 1.
export async function unlockFunds(plugId: string, amount: number): Promise<void> {
  const plug = plugs.find((p) => p.id === plugId);
  if (!plug) return;
  plug.wallet_balance_locked = Number(plug.wallet_balance_locked) - amount;
  plug.wallet_balance_available = Number(plug.wallet_balance_available) + amount;
  plug.jobs_completed = Number(plug.jobs_completed) + 1;
}

// ---------------------------------------------------------------- jobs

export async function listJobs(statuses?: string[]): Promise<JobRow[]> {
  let rows = [...jobs];
  if (statuses?.length) rows = rows.filter((j) => statuses.includes(j.status));
  return rows.sort(byCreatedDesc).slice(0, 50);
}

export async function getJob(jobId: string): Promise<JobRow | null> {
  return jobs.find((j) => j.id === jobId) ?? null;
}

export async function jobsForPlug(plugId: string): Promise<JobRow[]> {
  return jobs.filter((j) => j.plug_id === plugId).sort(byCreatedDesc);
}

export async function createJob(input: CreateJobInput): Promise<JobRow> {
  const job: JobRow = {
    id: uuid(),
    plug_id: input.plugId,
    client_name: input.clientName,
    client_phone: input.clientPhone ?? null,
    job_description: input.jobDescription ?? null,
    amount: input.amount,
    status: 'requested',
    created_at: nowISO(),
    completed_at: null,
    escrow_released_at: null,
  };
  jobs.push(job);
  return job;
}

export async function setJobStatus(
  jobId: string,
  status: JobStatus,
  opts?: { completedAt?: Date; escrowReleasedAt?: Date }
): Promise<void> {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;
  job.status = status;
  if (opts?.completedAt) job.completed_at = opts.completedAt.toISOString();
  if (opts?.escrowReleasedAt) job.escrow_released_at = opts.escrowReleasedAt.toISOString();
}

// ---------------------------------------------------------------- transactions

export async function txnsForJob(jobId: string): Promise<TxnRow[]> {
  return txns.filter((t) => t.job_id === jobId).sort(byCreatedAsc);
}

export async function latestAlatpayTxnForJob(jobId: string): Promise<TxnRow | null> {
  return (
    txns
      .filter((t) => t.job_id === jobId && t.alatpay_transaction_id != null)
      .sort(byCreatedDesc)[0] ?? null
  );
}

export async function findReusableCollection(jobId: string): Promise<TxnRow | null> {
  return (
    txns
      .filter(
        (t) =>
          t.job_id === jobId &&
          t.type === 'collection' &&
          t.status === 'pending' &&
          t.alatpay_virtual_account != null
      )
      .sort(byCreatedDesc)[0] ?? null
  );
}

export async function findTxnByAlatpayId(alatpayTransactionId: string): Promise<TxnRow | null> {
  return txns.find((t) => t.alatpay_transaction_id === alatpayTransactionId) ?? null;
}

export async function insertPendingCollection(input: {
  jobId: string;
  alatpayTransactionId: string | null;
  virtualAccount: string | null;
  amount: number;
  raw: unknown;
}): Promise<void> {
  txns.push({
    id: uuid(),
    job_id: input.jobId,
    alatpay_transaction_id: input.alatpayTransactionId,
    alatpay_virtual_account: input.virtualAccount,
    amount: input.amount,
    type: 'collection',
    status: 'pending',
    raw_webhook_payload: input.raw ?? null,
    created_at: nowISO(),
  });
}

export async function upsertCollection(input: {
  alatpayTransactionId: string;
  jobId: string | null;
  amount: number;
  status: 'pending' | 'successful';
  raw: unknown;
}): Promise<void> {
  const existing = txns.find((t) => t.alatpay_transaction_id === input.alatpayTransactionId);
  if (existing) {
    existing.status = input.status;
    existing.job_id = input.jobId;
    existing.amount = input.amount;
    existing.raw_webhook_payload = input.raw ?? null;
    return;
  }
  txns.push({
    id: uuid(),
    job_id: input.jobId,
    alatpay_transaction_id: input.alatpayTransactionId,
    alatpay_virtual_account: null,
    amount: input.amount,
    type: 'collection',
    status: input.status,
    raw_webhook_payload: input.raw ?? null,
    created_at: nowISO(),
  });
}

export async function insertOrphanPayload(raw: unknown): Promise<void> {
  txns.push({
    id: uuid(),
    job_id: null,
    alatpay_transaction_id: null,
    alatpay_virtual_account: null,
    amount: 0,
    type: 'collection',
    status: 'pending',
    raw_webhook_payload: raw ?? null,
    created_at: nowISO(),
  });
}

export async function insertRelease(jobId: string, amount: number): Promise<void> {
  txns.push({
    id: uuid(),
    job_id: jobId,
    alatpay_transaction_id: null,
    alatpay_virtual_account: null,
    amount,
    type: 'release',
    status: 'successful',
    raw_webhook_payload: null,
    created_at: nowISO(),
  });
}

export async function insertWithdrawal(amount: number): Promise<TxnRow | null> {
  const txn: TxnRow = {
    id: uuid(),
    job_id: null,
    alatpay_transaction_id: null,
    alatpay_virtual_account: null,
    amount,
    type: 'withdrawal',
    status: 'pending',
    raw_webhook_payload: null,
    created_at: nowISO(),
  };
  txns.push(txn);
  return txn;
}

export async function listWithdrawals(limit?: number): Promise<TxnRow[]> {
  const rows = txns.filter((t) => t.type === 'withdrawal').sort(byCreatedDesc);
  return limit ? rows.slice(0, limit) : rows;
}
