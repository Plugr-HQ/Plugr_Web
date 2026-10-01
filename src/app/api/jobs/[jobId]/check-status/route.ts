// src/app/api/jobs/[jobId]/check-status/route.ts
// GET — poll-based fallback for the ALATPay webhook. Pulls the transaction status directly
// from ALATPay via confirmTransaction() and performs the same transition the webhook would:
// on 'completed', flip the job -> 'paid_escrow' and upsert the collection tx to 'successful'.
// The webhook route stays intact — both are idempotent. Next 16: await params.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';
import { confirmTransaction, AlatPayError } from '@/src/lib/alatpay';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  const job = await repo.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (job.status === 'paid_escrow') {
    return NextResponse.json({ status: 'paid_escrow', note: 'already paid' });
  }

  const { searchParams } = new URL(request.url);
  const simulate = searchParams.get('simulate') === 'true';

  if (simulate) {
    const mockTxId = `sim_${job.id}_${Date.now()}`;
    await repo.upsertCollection({
      alatpayTransactionId: mockTxId,
      jobId: job.id,
      amount: Number(job.amount ?? 0),
      status: 'successful',
      raw: { simulated: true },
    });
    await repo.setJobStatus(job.id, 'paid_escrow');
    return NextResponse.json({ status: 'paid_escrow', verified: true, simulated: true });
  }

  const tx = await repo.latestAlatpayTxnForJob(job.id);
  if (!tx?.alatpay_transaction_id) {
    return NextResponse.json({ status: job.status, note: 'no alatpay transaction id yet' });
  }

  const alatpayTransactionId = tx.alatpay_transaction_id;

  // Query ALATPay. Its status endpoint returns 200 + status "completed" once the transfer
  // settles, and 404 + "Transaction Pending." while it's still awaiting/settling. The
  // "pending" case is NOT an error — it means the VA has the transaction and we keep waiting.
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
    // Not settled yet — tell the UI whether ALATPay has at least seen the transaction.
    return NextResponse.json({ status: job.status, alatpay });
  }

  // Same transition the webhook performs on success (idempotent upsert on the txn id).
  await repo.upsertCollection({
    alatpayTransactionId,
    jobId: job.id,
    amount: Number(job.amount ?? result?.data?.amount ?? result?.amount ?? 0),
    status: 'successful',
    raw: result ?? null,
  });

  await repo.setJobStatus(job.id, 'paid_escrow');

  return NextResponse.json({ status: 'paid_escrow', verified: true, alatpay: 'completed' });
}
