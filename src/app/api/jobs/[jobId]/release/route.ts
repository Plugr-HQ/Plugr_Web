// src/app/api/jobs/[jobId]/release/route.ts
// Screen 5 "Confirm Completion". Moves the job amount into the Plug's LOCKED balance now,
// then a 60-second demo timer (compressed from the real 24hr dispute window) unlocks it.
//
// No server-side timer — the UI owns the countdown and calls /unlock at zero (Vercel
// serverless can't persist a timer). We only return unlocksAt/lockSeconds for the UI.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';
import { requireJobParty, UnauthorizedError } from '@/src/lib/auth';

const DEMO_LOCK_SECONDS = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, "plugId", amount, status, "escrowStatus", "clientId" from "Job" where id = $1',
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

  // Releasable once escrow is actually holding the funds — regardless of whether
  // the job has separately been marked COMPLETED yet.
  if (job.escrowStatus !== 'locked') {
    return NextResponse.json(
      { error: `escrow is '${job.escrowStatus}', expected 'locked' to release` },
      { status: 400 }
    );
  }
  if (!job.plugId) {
    return NextResponse.json({ error: 'job has no assigned plug' }, { status: 400 });
  }

  // NOTE: this Postgres function still targets hack_plugs internally as of the last
  // grep — do not ship this route until sql/wallet_functions.sql is confirmed updated
  // to write to "PlugProfile" instead.
  await q('select increment_wallet_locked($1, $2)', [job.plugId, job.amount]);

  const releasedAt = new Date();
  const unlocksAt = new Date(releasedAt.getTime() + DEMO_LOCK_SECONDS * 1000);

  await q(
    'update "Job" set "escrowStatus" = $2, "escrowReleasedAt" = $3 where id = $1',
    [job.id, 'released', releasedAt.toISOString()]
  );

  await q(
    `insert into "Transaction" (id, "jobId", amount, type, status)
     values (gen_random_uuid(), $1, $2, 'RELEASE', 'SUCCESSFUL')`,
    [job.id, job.amount]
  );

  return NextResponse.json({
    released: true,
    unlocksAt: unlocksAt.toISOString(),
    lockSeconds: DEMO_LOCK_SECONDS,
  });
}