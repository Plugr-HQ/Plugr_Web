// src/app/api/jobs/[jobId]/unlock/route.ts
// Called by the client-side countdown when it hits zero (Screen 5 -> wallet). The UI owns
// the timer — no server-side setTimeout. Idempotency guard prevents a double-credit.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  const job = await repo.getJob(jobId);
  if (!job || job.status !== 'released' || !job.plug_id) {
    return NextResponse.json({ error: 'job not eligible for unlock' }, { status: 400 });
  }

  // If this job's amount is no longer in the Plug's locked balance, it already unlocked.
  const plug = await repo.getPlug(job.plug_id);
  if (!plug || Number(plug.wallet_balance_locked) < Number(job.amount)) {
    return NextResponse.json({ unlocked: true, note: 'already unlocked' });
  }

  await repo.unlockFunds(job.plug_id, Number(job.amount));
  return NextResponse.json({ unlocked: true });
}
