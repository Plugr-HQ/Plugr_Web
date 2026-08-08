// src/lib/repo/index.ts
//
// One API, one storage backend: the real product tables.
//
//   /app   -> "PlugProfile" / "User" / "Category" / "Job" / "transactions"  (core product)
//
// Rows are snake_case; the core backend maps columns in SQL (core.ts).

import * as core from './core';

export type Source = 'core';

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

const REPOS: Record<Source, Repo> = { core };

export function getRepo(source: Source = 'core'): Repo {
  return REPOS[source] ?? REPOS.core;
}

/**
 * Resolve the backend from the request. There is only one backend (core), so this always
 * returns 'core'; the signature is kept so call sites read intentionally.
 */
export function resolveSource(_request: Request, _bodySource?: unknown): Source {
  return 'core';
}

export { core };
