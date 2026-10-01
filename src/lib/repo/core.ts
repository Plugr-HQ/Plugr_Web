// src/lib/repo/core.ts
//
// The core backend — the real product tables, used by /app.
//
//   hack_plugs        -> "PlugProfile" + "User" + "Category"
//   hack_jobs         -> "Job"
//   hack_transactions -> "transactions"
//
// Every SELECT aliases the core columns back to the snake_case names the API already
// returns, so the response shape is identical to the hack_ backend and no UI changed.
//
// Two mappings are worth knowing about:
//
// 1. STATUS. The JobStatus enum has no paid_escrow / released / withdrawn members, so the
//    money state lives in "Job"."escrowStatus" (free text, already indexed by the core
//    schema) and "Job"."status" carries the coarse work state. Job.status answers "how far
//    along is the work", escrowStatus answers "where is the money".
//
// 2. IDENTITY. "Job"."clientId" is a real FK, so booking find-or-creates a "User" keyed on
//    phone. That is why phone is required here.

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

export const source: Source = 'core';

// "Job"."latitude"/"longitude" are NOT NULL, but no screen in this flow collects a location
// yet. Rather than alter a production constraint we store Lagos city centre as an explicit
// placeholder. Swap for real coordinates once booking captures an address.
const PLACEHOLDER_LAT = 6.5244;
const PLACEHOLDER_LNG = 3.3792;

// The core schema splits a job's state across TWO columns (see schema.prisma):
//   "Job"."status"       — JobStatus enum, the work-progress state machine
//   "Job"."escrowStatus" — free text, ONLY the money state: 'locked' | 'released' | 'refunded'
//
// The API's single 5-state lifecycle maps onto that pair. Writing both keeps our rows legible
// to the CTO's WhatsApp/AI backend, which reads the same tables and checks escrowStatus for
// 'locked'/'released' — it would never match an API-vocabulary value like 'paid_escrow'.
//
//   api status    "Job"."status"    "Job"."escrowStatus"
//   requested     PENDING           null        (no money yet)
//   paid_escrow   PLUG_ASSIGNED     locked
//   accepted      PLUG_ACCEPTED     locked
//   completed     COMPLETED         locked      (work done, still in dispute window)
//   released      COMPLETED         released
//
// 'withdrawn' is wallet-level, not a job state — no job is ever set to it (withdrawal creates a
// WITHDRAWAL transaction and debits the wallet), so it isn't in this map.
const STATE_MAP: Record<JobStatus, { work: string; escrow: string | null }> = {
  requested: { work: 'PENDING', escrow: null },
  paid_escrow: { work: 'PLUG_ASSIGNED', escrow: 'locked' },
  accepted: { work: 'PLUG_ACCEPTED', escrow: 'locked' },
  completed: { work: 'COMPLETED', escrow: 'locked' },
  released: { work: 'COMPLETED', escrow: 'released' },
  withdrawn: { work: 'COMPLETED', escrow: 'released' },
};

// Reconstruct the API lifecycle from the two core columns. Kept as one fragment so the
// projection and the listJobs status filter derive it identically.
const STATUS_SQL = `
  case
    when j."escrowStatus" = 'released'                                then 'released'
    when j."escrowStatus" = 'locked' and j.status = 'COMPLETED'       then 'completed'
    when j."escrowStatus" = 'locked' and j.status = 'PLUG_ACCEPTED'   then 'accepted'
    when j."escrowStatus" = 'locked'                                  then 'paid_escrow'
    else 'requested'
  end`;

// ---------------------------------------------------------------- projections

const PLUG_COLS = `
  p.id,
  coalesce(u.name, 'Plug')          as name,
  c.code                            as trade,
  p."photoUrl"                      as photo_url,
  p."averageRating"                 as rating,
  p."jobsCompleted"                 as jobs_completed,
  p."isVerified"                    as verified,
  p."walletBalanceAvailable"        as wallet_balance_available,
  p."walletBalanceLocked"           as wallet_balance_locked,
  p.bio,
  p."workPosts"                     as work_posts,
  p."createdAt"                     as created_at`;

const PLUG_FROM = `
  from "PlugProfile" p
  join "User" u     on u.id = p."userId"
  join "Category" c on c.id = p."categoryId"
  where p."deletedAt" is null`;

// "Job" has no completedAt column; "updatedAt" is the closest honest stand-in and is only
// surfaced once the work has actually reached COMPLETED.
const JOB_COLS = `
  j.id,
  j."plugId"                                   as plug_id,
  coalesce(cu.name, 'Client')                  as client_name,
  cu.phone                                     as client_phone,
  coalesce(j.description, j.title)             as job_description,
  coalesce(j."escrowAmount", j.price, 0)       as amount,
  ${STATUS_SQL}                           as status,
  j."createdAt"                                as created_at,
  case when j.status = 'COMPLETED' then j."updatedAt" end as completed_at,
  j."escrowReleasedAt"                         as escrow_released_at`;

const JOB_FROM = `
  from "Job" j
  left join "User" cu on cu.id = j."clientId"
  where j."deletedAt" is null`;

const TXN_COLS = `
  id,
  "jobId"                   as job_id,
  "alatpayTransactionId"    as alatpay_transaction_id,
  "alatpayVirtualAccount"   as alatpay_virtual_account,
  amount,
  lower(type::text)         as type,
  lower(status::text)       as status,
  "rawWebhookPayload"       as raw_webhook_payload,
  "createdAt"               as created_at`;

// ---------------------------------------------------------------- plugs

export async function listPlugs(): Promise<PlugRow[]> {
  return q<PlugRow>(`select ${PLUG_COLS} ${PLUG_FROM} order by p."averageRating" desc`);
}

export async function getPlug(plugId: string): Promise<PlugRow | null> {
  return one<PlugRow>(`select ${PLUG_COLS} ${PLUG_FROM} and p.id = $1`, [plugId]);
}

export async function createPlug(input: CreatePlugInput): Promise<PlugRow> {
  const phone = (input.phone ?? '').trim();
  if (!phone) {
    // "User"."phone" is NOT NULL UNIQUE — there is no honest way to create a Plug without it.
    throw new Error('phone is required to register a Plug against the core tables');
  }

  const category = await one<{ id: string }>('select id from "Category" where code = $1', [input.trade]);
  if (!category) {
    throw new Error(`no Category with code '${input.trade}' — run sql/core_schema_additions.sql`);
  }

  const user = await one<{ id: string }>(
    `insert into "User" (id, phone, name, role, status, "createdAt", "updatedAt")
     values (gen_random_uuid(), $1, $2, 'PLUG', 'ACTIVE', now(), now())
     on conflict (phone) do update
       set name = excluded.name, role = 'PLUG', "updatedAt" = now()
     returning id`,
    [phone, `${input.firstName} ${input.lastName}`]
  );

  const profile = await one<{ id: string }>(
    `insert into "PlugProfile"
       (id, "userId", status, "isVerified", "averageRating", "categoryId",
        "jobsCompleted", "walletBalanceAvailable", "walletBalanceLocked",
        "photoUrl", "workPosts", "createdAt", "updatedAt")
     values (gen_random_uuid(), $1, 'ACTIVE', false, 0, $2, 0, 0, 0, $3, '[]'::jsonb, now(), now())
     on conflict ("userId") do update
       set "categoryId" = excluded."categoryId",
           "photoUrl"   = excluded."photoUrl",
           "updatedAt"  = now()
     returning id`,
    [user!.id, category.id, input.photoUrl ?? null]
  );

  return (await getPlug(profile!.id)) as PlugRow;
}

export async function updatePlug(plugId: string, patch: PlugPatch): Promise<PlugRow | null> {
  const sets: string[] = ['"updatedAt" = now()'];
  const vals: any[] = [];
  const add = (frag: string, v: any) => {
    vals.push(v);
    sets.push(`${frag} = $${vals.length}`);
  };

  if (typeof patch.bio === 'string') add('bio', patch.bio.slice(0, 600));
  if (typeof patch.photoUrl === 'string' || patch.photoUrl === null) add('"photoUrl"', patch.photoUrl);
  if (Array.isArray(patch.workPosts)) add('"workPosts"', JSON.stringify(patch.workPosts));
  if (typeof patch.verified === 'boolean') add('"isVerified"', patch.verified);

  if (vals.length === 0) return getPlug(plugId);

  vals.push(plugId);
  const updated = await one<{ id: string }>(
    `update "PlugProfile" set ${sets.join(', ')} where id = $${vals.length} returning id`,
    vals
  );
  return updated ? getPlug(updated.id) : null;
}

export async function debitAvailable(plugId: string, amount: number): Promise<void> {
  await q(
    `update "PlugProfile"
     set "walletBalanceAvailable" = "walletBalanceAvailable" - $1, "updatedAt" = now()
     where id = $2`,
    [amount, plugId]
  );
}

export async function lockFunds(plugId: string, amount: number): Promise<void> {
  await q('select increment_wallet_locked_core($1, $2)', [plugId, amount]);
}

export async function unlockFunds(plugId: string, amount: number): Promise<void> {
  await q('select move_locked_to_available_core($1, $2)', [plugId, amount]);
}

// ---------------------------------------------------------------- jobs

export async function listJobs(statuses?: string[]): Promise<JobRow[]> {
  return statuses?.length
    ? q<JobRow>(
        `select ${JOB_COLS} ${JOB_FROM} and ${STATUS_SQL} = any($1)
         order by j."createdAt" desc limit 50`,
        [statuses]
      )
    : q<JobRow>(`select ${JOB_COLS} ${JOB_FROM} order by j."createdAt" desc limit 50`);
}

export async function getJob(jobId: string): Promise<JobRow | null> {
  return one<JobRow>(`select ${JOB_COLS} ${JOB_FROM} and j.id = $1`, [jobId]);
}

export async function jobsForPlug(plugId: string): Promise<JobRow[]> {
  return q<JobRow>(`select ${JOB_COLS} ${JOB_FROM} and j."plugId" = $1 order by j."createdAt" desc`, [
    plugId,
  ]);
}

export async function createJob(input: CreateJobInput): Promise<JobRow> {
  const phone = (input.clientPhone ?? '').trim();
  if (!phone) {
    throw new Error('clientPhone is required to book against the core tables');
  }

  const plug = await one<{ categoryId: string }>(
    'select "categoryId" from "PlugProfile" where id = $1 and "deletedAt" is null',
    [input.plugId]
  );
  if (!plug) throw new Error('plug not found');

  // Find-or-create the client. Never overwrite an existing user's name — a returning client
  // booking again should not have their profile rewritten by a booking form.
  const client = await one<{ id: string }>(
    `insert into "User" (id, phone, name, role, status, "createdAt", "updatedAt")
     values (gen_random_uuid(), $1, $2, 'CLIENT', 'ACTIVE', now(), now())
     on conflict (phone) do update set "updatedAt" = now()
     returning id`,
    [phone, input.clientName]
  );

  const description = input.jobDescription ?? null;
  const title = (description ?? 'Plugr job').slice(0, 80);

  // New job = 'requested' = work PENDING, no escrow yet (escrowStatus null).
  const created = await one<{ id: string }>(
    `insert into "Job"
       (id, "clientId", "plugId", "categoryId", status, title, description,
        latitude, longitude, price, "escrowAmount", "escrowStatus", "createdAt", "updatedAt")
     values (gen_random_uuid(), $1, $2, $3, 'PENDING', $4, $5, $6, $7, $8, $8, null, now(), now())
     returning id`,
    [client!.id, input.plugId, plug.categoryId, title, description, PLACEHOLDER_LAT, PLACEHOLDER_LNG, input.amount]
  );

  return (await getJob(created!.id)) as JobRow;
}

export async function setJobStatus(
  jobId: string,
  status: JobStatus,
  opts?: { completedAt?: Date; escrowReleasedAt?: Date }
): Promise<void> {
  const map = STATE_MAP[status] ?? STATE_MAP.requested;
  // Write BOTH columns: the work-state enum and the money-state string, per the CTO's model.
  const sets = [`status = $2::"JobStatus"`, `"escrowStatus" = $3`, `"updatedAt" = now()`];
  const vals: any[] = [jobId, map.work, map.escrow];

  if (opts?.escrowReleasedAt) {
    vals.push(opts.escrowReleasedAt.toISOString());
    sets.push(`"escrowReleasedAt" = $${vals.length}`);
  }
  // completedAt has no column in "Job" — "updatedAt" (set above) carries it, and JOB_COLS
  // surfaces it as completed_at once status reaches COMPLETED.

  await q(`update "Job" set ${sets.join(', ')} where id = $1`, vals);
}

/**
 * Set the escrow amount for a job. Used by the WhatsApp handoff: bot-booked jobs are created
 * with no price, so the client confirms the agreed amount on the hosted pay page and it's
 * persisted here before the ALATPay virtual account is minted (so the webhook/release use it).
 */
export async function setJobAmount(jobId: string, amount: number): Promise<void> {
  await q(`update "Job" set "escrowAmount" = $2, "updatedAt" = now() where id = $1`, [jobId, amount]);
}

// ---------------------------------------------------------------- transactions

export async function txnsForJob(jobId: string): Promise<TxnRow[]> {
  return q<TxnRow>(`select ${TXN_COLS} from transactions where "jobId" = $1 order by "createdAt" asc`, [
    jobId,
  ]);
}

export async function latestAlatpayTxnForJob(jobId: string): Promise<TxnRow | null> {
  return one<TxnRow>(
    `select ${TXN_COLS} from transactions
     where "jobId" = $1 and "alatpayTransactionId" is not null
     order by "createdAt" desc limit 1`,
    [jobId]
  );
}

export async function findReusableCollection(jobId: string): Promise<TxnRow | null> {
  return one<TxnRow>(
    `select ${TXN_COLS} from transactions
     where "jobId" = $1 and type = 'COLLECTION' and status = 'PENDING'
       and "alatpayVirtualAccount" is not null
     order by "createdAt" desc limit 1`,
    [jobId]
  );
}

export async function findTxnByAlatpayId(alatpayTransactionId: string): Promise<TxnRow | null> {
  return one<TxnRow>(`select ${TXN_COLS} from transactions where "alatpayTransactionId" = $1`, [
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
    `insert into transactions
       (id, "jobId", "alatpayTransactionId", "alatpayVirtualAccount", amount, type, status,
        "rawWebhookPayload", "createdAt")
     values (gen_random_uuid(), $1, $2, $3, $4, 'COLLECTION', 'PENDING', $5, now())`,
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
    `insert into transactions
       (id, "alatpayTransactionId", "jobId", amount, type, status, "rawWebhookPayload", "createdAt")
     values (gen_random_uuid(), $1, $2, $3, 'COLLECTION', $4::"TransactionStatus", $5, now())
     on conflict ("alatpayTransactionId") do update
       set status              = excluded.status,
           "jobId"             = excluded."jobId",
           amount              = excluded.amount,
           "rawWebhookPayload" = excluded."rawWebhookPayload"`,
    [
      input.alatpayTransactionId,
      input.jobId,
      input.amount,
      input.status.toUpperCase(),
      input.raw ?? null,
    ]
  );
}

export async function insertOrphanPayload(raw: unknown): Promise<void> {
  await q(
    `insert into transactions (id, amount, type, status, "rawWebhookPayload", "createdAt")
     values (gen_random_uuid(), 0, 'COLLECTION', 'PENDING', $1, now())`,
    [raw ?? null]
  );
}

export async function insertRelease(jobId: string, amount: number): Promise<void> {
  await q(
    `insert into transactions (id, "jobId", amount, type, status, "createdAt")
     values (gen_random_uuid(), $1, $2, 'RELEASE', 'SUCCESSFUL', now())`,
    [jobId, amount]
  );
}

export async function insertWithdrawal(amount: number): Promise<TxnRow | null> {
  const row = await one<{ id: string }>(
    `insert into transactions (id, "jobId", amount, type, status, "createdAt")
     values (gen_random_uuid(), null, $1, 'WITHDRAWAL', 'PENDING', now())
     returning id`,
    [amount]
  );
  return row ? one<TxnRow>(`select ${TXN_COLS} from transactions where id = $1`, [row.id]) : null;
}

export async function listWithdrawals(limit?: number): Promise<TxnRow[]> {
  return limit
    ? q<TxnRow>(
        `select ${TXN_COLS} from transactions where type = 'WITHDRAWAL' order by "createdAt" desc limit $1`,
        [limit]
      )
    : q<TxnRow>(`select ${TXN_COLS} from transactions where type = 'WITHDRAWAL' order by "createdAt" desc`);
}
