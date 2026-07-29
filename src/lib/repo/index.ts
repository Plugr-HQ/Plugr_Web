// src/lib/repo/index.ts
//
// One API, two storage backends.
//
//   /demo  -> in-memory static fixtures (src/lib/repo/demo.ts + demoData.ts) — NO database
//   /app   -> "PlugProfile" / "User" / "Category" / "Job" / "transactions"  (core product)
//
// The hack_ tables /demo used to read were dropped in a DB reset, so the 'hack' source is now
// served entirely from in-memory fixtures — no DB calls on the /demo path. The DB-backed
// hack.ts is kept on disk for reference but is no longer wired to getRepo.
//
// Both backends return the SAME row shapes (snake_case), so every API response stays
// byte-compatible and no UI component changed. The core backend maps columns in SQL (core.ts).
//
// Default source is 'hack'. That is deliberate: if a call site is ever missed, it serves the
// in-memory demo fixtures rather than silently touching the production core tables.

import * as demo from './demo';
import * as core from './core';

export type Source = 'hack' | 'core';

/** The escrow lifecycle, identical across both backends. */
export type JobStatus =
  | 'requested'
  | 'paid_escrow'
  | 'accepted'
  | 'completed'
  | 'released'
  | 'withdrawn';

export interface PlugRow {
  id: string;
  name: string;
  trade: string;
  photo_url: string | null;
  rating: number;
  jobs_completed: number;
  verified: boolean;
  wallet_balance_available: number;
  wallet_balance_locked: number;
  bio: string | null;
  work_posts: unknown;
  created_at: string;
}

export interface JobRow {
  id: string;
  plug_id: string | null;
  client_name: string;
  client_phone: string | null;
  job_description: string | null;
  amount: number;
  status: JobStatus;
  created_at: string;
  completed_at: string | null;
  escrow_released_at: string | null;
}

export interface TxnRow {
  id: string;
  job_id: string | null;
  alatpay_transaction_id: string | null;
  alatpay_virtual_account: string | null;
  amount: number;
  type: 'collection' | 'release' | 'withdrawal';
  status: 'pending' | 'successful' | 'failed';
  raw_webhook_payload: unknown;
  created_at: string;
}

export interface CreateJobInput {
  plugId: string;
  clientName: string;
  clientPhone?: string | null;
  jobDescription?: string | null;
  amount: number;
}

export interface CreatePlugInput {
  firstName: string;
  lastName: string;
  trade: string;
  photoUrl?: string | null;
  phone?: string | null;
}

export interface PlugPatch {
  bio?: string;
  photoUrl?: string | null;
  workPosts?: unknown;
  verified?: boolean;
}

/** Every operation the API routes need, implemented once per backend. */
export interface Repo {
  readonly source: Source;

  // plugs
  listPlugs(): Promise<PlugRow[]>;
  getPlug(plugId: string): Promise<PlugRow | null>;
  createPlug(input: CreatePlugInput): Promise<PlugRow>;
  updatePlug(plugId: string, patch: PlugPatch): Promise<PlugRow | null>;
  debitAvailable(plugId: string, amount: number): Promise<void>;
  lockFunds(plugId: string, amount: number): Promise<void>;
  unlockFunds(plugId: string, amount: number): Promise<void>;

  // jobs
  listJobs(statuses?: string[]): Promise<JobRow[]>;
  getJob(jobId: string): Promise<JobRow | null>;
  jobsForPlug(plugId: string): Promise<JobRow[]>;
  createJob(input: CreateJobInput): Promise<JobRow>;
  setJobStatus(
    jobId: string,
    status: JobStatus,
    opts?: { completedAt?: Date; escrowReleasedAt?: Date }
  ): Promise<void>;

  // transactions
  txnsForJob(jobId: string): Promise<TxnRow[]>;
  latestAlatpayTxnForJob(jobId: string): Promise<TxnRow | null>;
  findReusableCollection(jobId: string): Promise<TxnRow | null>;
  findTxnByAlatpayId(alatpayTransactionId: string): Promise<TxnRow | null>;
  insertPendingCollection(input: {
    jobId: string;
    alatpayTransactionId: string | null;
    virtualAccount: string | null;
    amount: number;
    raw: unknown;
  }): Promise<void>;
  upsertCollection(input: {
    alatpayTransactionId: string;
    jobId: string | null;
    amount: number;
    status: 'pending' | 'successful';
    raw: unknown;
  }): Promise<void>;
  insertOrphanPayload(raw: unknown): Promise<void>;
  insertRelease(jobId: string, amount: number): Promise<void>;
  insertWithdrawal(amount: number): Promise<TxnRow | null>;
  listWithdrawals(limit?: number): Promise<TxnRow[]>;
}

// The 'hack' source now resolves to the in-memory demo fixtures (no DB); 'core' is unchanged.
const REPOS: Record<Source, Repo> = { hack: demo, core };

export function getRepo(source: Source = 'hack'): Repo {
  return REPOS[source] ?? REPOS.hack;
}

/**
 * Resolve the backend from the request.
 *
 * Accepts `?source=core` on any method, or a `source` field in a JSON body that the caller
 * has already parsed. Anything unrecognised falls back to 'hack' — see the note at the top
 * of this file about why that is the safe default.
 */
export function resolveSource(request: Request, bodySource?: unknown): Source {
  const fromQuery = new URL(request.url).searchParams.get('source');
  const raw = String(bodySource ?? fromQuery ?? '').toLowerCase();
  return raw === 'core' ? 'core' : 'hack';
}

export { demo, core };
