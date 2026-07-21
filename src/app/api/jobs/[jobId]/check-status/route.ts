// src/app/api/jobs/[jobId]/check-status/route.ts
// GET — poll-based fallback for the ALATPay webhook. Pulls the transaction status directly
// from ALATPay via confirmTransaction() and performs the same transition the webhook would:
// on 'completed', flip Job.escrowStatus -> 'locked' and upsert the collection tx to 'SUCCESSFUL'.
// The webhook route stays intact — both are idempotent. Next 16: await params.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';
import { confirmTransaction, AlatPayError } from '@/src/lib/alatpay';
import { requireJobParty, UnauthorizedError } from '@/src/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, amount, status, "escrowStatus", "clientId", "plugId" from "Job" where id = $1',
    [jobId]
  );
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }

  try {
    await requireJobParty(request, job);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  if (job.escrowStatus === 'locked') {
    return NextResponse.json({ status: 'paid_escrow', note: 'already paid' });
  }

  const { searchParams } = new URL(request.url);
  const simulate = searchParams.get('simulate') === 'true';

  if (simulate) {
    const mockTxId = `sim_${job.id}_${Date.now()}`;
    await q(
      `insert into "Transaction"
         (id, "alatpayTransactionId", "jobId", amount, type, status, "rawWebhookPayload")
       values (gen_random_uuid(), $1, $2, $3, 'COLLECTION', 'SUCCESSFUL', $4)
       on conflict ("alatpayTransactionId") where "alatpayTransactionId" is not null
       do update set status = 'SUCCESSFUL'`,
      [mockTxId, job.id, job.amount ?? 0, JSON.stringify({ simulated: true })]
    );
    await q('update "Job" set "escrowStatus" = $2 where id = $1', [job.id, 'locked']);
    return NextResponse.json({ status: 'paid_escrow', verified: true, simulated: true });
  }

  const tx = await one(
    `select id, "alatpayTransactionId", status from "Transaction"
     where "jobId" = $1 and "alatpayTransactionId" is not null
     order by "createdAt" desc limit 1`,
    [job.id]
  );

  if (!tx?.alatpayTransactionId) {
    return NextResponse.json({ status: job.status, note: 'no alatpay transaction id yet' });
  }

  const alatpayTransactionId = tx.alatpayTransactionId;

  let result: any = null;
  let alatpay: 'completed' | 'pending' | 'unknown' = 'unknown';
  try {
    result = await confirmTransaction(alatpayTransactionId);
    const inner = result?.data ?? result ?? {};
    const s = String(inner.status ?? inner.Status ?? inner?.data?.status ?? '').toLowerCase();
    alatpay = s === 'completed' ? 'completed' : 'pending';
  } catch (err) {
    const ctx = err instanceof AlatPayError ? (err.context as any) : null;
    const msg = String(ctx?.message ?? '').toLowerCase();
    alatpay = msg.includes('pending') ? 'pending' : 'unknown';
    if (alatpay === 'unknown') console.warn('check-status: confirm re-query failed', ctx ?? String(err));
  }

  if (alatpay !== 'completed') {
    return NextResponse.json({ status: job.status, alatpay });
  }

  await q(
    `insert into "Transaction"
       (id, "alatpayTransactionId", "jobId", amount, type, status, "rawWebhookPayload")
     values (gen_random_uuid(), $1, $2, $3, 'COLLECTION', 'SUCCESSFUL', $4)
     on conflict ("alatpayTransactionId") where "alatpayTransactionId" is not null
     do update set status = 'SUCCESSFUL',
                   "rawWebhookPayload" = excluded."rawWebhookPayload",
                   amount = excluded.amount`,
    [alatpayTransactionId, job.id, job.amount ?? result?.data?.amount ?? result?.amount ?? 0, result ?? null]
  );

  await q('update "Job" set "escrowStatus" = $2 where id = $1', [job.id, 'locked']);

  return NextResponse.json({ status: 'paid_escrow', verified: true, alatpay: 'completed' });
}