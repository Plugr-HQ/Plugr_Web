// src/app/api/jobs/[jobId]/unlock/route.ts
// Called by the client-side countdown when it hits zero (Screen 5 -> wallet). The UI owns
// the timer — no server-side setTimeout. Idempotency guard prevents a double-credit.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';
import { requireJobParty, UnauthorizedError } from '@/src/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, "plugId", amount, status, "escrowStatus", "clientId" from "Job" where id = $1',
    [jobId]
  );
  if (!job || job.escrowStatus !== 'released') {
    return NextResponse.json({ error: 'job not eligible for unlock' }, { status: 400 });
  }

  try {
    await requireJobParty(request, job);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  if (!job.plugId) {
    return NextResponse.json({ error: 'job has no assigned plug' }, { status: 400 });
  }

  // If this job's amount is no longer in the Plug's locked balance, it already unlocked.
  const plug = await one('select "walletBalanceLocked" from "PlugProfile" where id = $1', [job.plugId]);
  if (!plug || Number(plug.walletBalanceLocked) < Number(job.amount)) {
    return NextResponse.json({ unlocked: true, note: 'already unlocked' });
  }

  try {
    await q('select move_locked_to_available($1, $2)', [job.plugId, job.amount]);
  } catch (err) {
    console.error('move_locked_to_available failed', err);
    return NextResponse.json({ error: 'could not unlock funds' }, { status: 409 });
  }

  return NextResponse.json({ unlocked: true });
}