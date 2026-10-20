// src/app/api/jobs/[jobId]/check-status/route.ts
// GET — poll-based fallback for the payment webhooks. Anchor jobs (anchorDepositAccountId set) run
// the shared ledger sync in src/lib/anchorCollections.ts, the same one the Anchor webhook runs.
// Legacy ALATPay jobs pull the transaction status from ALATPay via confirmTransaction() and perform
// the same transition the ALATPay webhook would: on 'completed', flip the job -> 'paid_escrow' and
// upsert the collection tx to 'successful'. All paths are idempotent. Next 16: await params.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';
import { confirmTransaction, AlatPayError } from '@/src/lib/alatpay';
import { AnchorError, ANCHOR_ENV } from '@/src/lib/anchor';
import { syncAnchorCollections } from '@/src/lib/anchorCollections';

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
  if (simulate && ANCHOR_ENV === 'production') {
    return NextResponse.json({ error: 'simulate is only available in sandbox' }, { status: 403 });
  }

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

  // Anchor job: read the account's ledger — the same sync the Anchor webhook runs, so whichever
  // sees the payment first records it. The `alatpay` field name is kept because the pay pages read
  // it as a generic "transfer seen" flag: 'pending' = money has landed but doesn't cover the job yet.
  if (job.anchor_deposit_account_id) {
    try {
      const r = await syncAnchorCollections(repo, job, job.anchor_deposit_account_id, { source: 'check-status' });
      if (r.credited) {
        return NextResponse.json({ status: 'paid_escrow', verified: true, provider: 'anchor' });
      }
      return NextResponse.json({
        status: job.status,
        provider: 'anchor',
        alatpay: r.credits ? 'pending' : 'unknown',
        paid: r.paidNaira,
        amount: Number(job.amount ?? 0),
      });
    } catch (err) {
      console.warn('check-status: Anchor ledger read failed', err instanceof AnchorError ? err.context : String(err));
      return NextResponse.json({ status: job.status, provider: 'anchor', alatpay: 'unknown' });
    }
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
