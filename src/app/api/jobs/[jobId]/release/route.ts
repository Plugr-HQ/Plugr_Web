// src/app/api/jobs/[jobId]/release/route.ts
// Screen 5 "Confirm Completion". Moves the job amount into the Plug's LOCKED balance now,
// then a 60-second demo timer (compressed from the real 24hr dispute window) unlocks it.
//
// No server-side timer — the UI owns the countdown and calls /unlock at zero (Vercel
// serverless can't persist a timer). We only return unlocksAt/lockSeconds for the UI.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

const DEMO_LOCK_SECONDS = 60;

// Releasable once paid into escrow. Our screen order marks the job 'completed' before the
// client confirms, so accept both post-payment states.
const RELEASABLE_STATUSES = ['completed', 'paid_escrow'];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one('select id, plug_id, amount, status from hack_jobs where id = $1', [jobId]);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (!RELEASABLE_STATUSES.includes(job.status)) {
    return NextResponse.json(
      { error: `job is in status '${job.status}', expected one of ${RELEASABLE_STATUSES.join(' | ')}` },
      { status: 400 }
    );
  }

  // Move funds into the Plug's locked balance now.
  await q('select increment_wallet_locked($1, $2)', [job.plug_id, job.amount]);

  const releasedAt = new Date();
  const unlocksAt = new Date(releasedAt.getTime() + DEMO_LOCK_SECONDS * 1000);

  await q("update hack_jobs set status = 'released', escrow_released_at = $2 where id = $1", [
    job.id,
    releasedAt.toISOString(),
  ]);

  await q(
    "insert into hack_transactions (job_id, amount, type, status) values ($1, $2, 'release', 'successful')",
    [job.id, job.amount]
  );

  return NextResponse.json({
    released: true,
    unlocksAt: unlocksAt.toISOString(),
    lockSeconds: DEMO_LOCK_SECONDS,
  });
}
