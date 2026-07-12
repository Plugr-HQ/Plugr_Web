// src/app/api/jobs/[jobId]/unlock/route.ts
// Called by the client-side countdown when it hits zero (Screen 5 -> wallet). The UI owns
// the timer — no server-side setTimeout. Idempotency guard prevents a double-credit.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one('select id, plug_id, amount, status from hack_jobs where id = $1', [jobId]);
  if (!job || job.status !== 'released') {
    return NextResponse.json({ error: 'job not eligible for unlock' }, { status: 400 });
  }

  // If this job's amount is no longer in the Plug's locked balance, it already unlocked.
  const plug = await one('select wallet_balance_locked from hack_plugs where id = $1', [job.plug_id]);
  if (!plug || Number(plug.wallet_balance_locked) < Number(job.amount)) {
    return NextResponse.json({ unlocked: true, note: 'already unlocked' });
  }

  await q('select move_locked_to_available($1, $2)', [job.plug_id, job.amount]);
  return NextResponse.json({ unlocked: true });
}
