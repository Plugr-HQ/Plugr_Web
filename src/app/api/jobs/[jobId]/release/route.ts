// src/app/api/jobs/[jobId]/release/route.ts
// Screen 5 "Confirm Completion". Moves the job amount into the Plug's LOCKED balance now,
// then a 60-second demo timer (compressed from the real 24hr dispute window) unlocks it.
//
// No server-side timer — the UI owns the countdown and calls /unlock at zero (Vercel
// serverless can't persist a timer). We only return unlocksAt/lockSeconds for the UI.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

const DEMO_LOCK_SECONDS = 60;

// Releasable once paid into escrow. Our screen order marks the job 'completed' before the
// client confirms, so accept both post-payment states.
const RELEASABLE_STATUSES = ['completed', 'paid_escrow'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  const job = await repo.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (!RELEASABLE_STATUSES.includes(job.status)) {
    return NextResponse.json(
      { error: `job is in status '${job.status}', expected one of ${RELEASABLE_STATUSES.join(' | ')}` },
      { status: 400 }
    );
  }
  if (!job.plug_id) {
    return NextResponse.json({ error: 'job has no plug assigned' }, { status: 400 });
  }

  // Move funds into the Plug's locked balance now.
  await repo.lockFunds(job.plug_id, Number(job.amount));

  const releasedAt = new Date();
  const unlocksAt = new Date(releasedAt.getTime() + DEMO_LOCK_SECONDS * 1000);

  await repo.setJobStatus(job.id, 'released', { escrowReleasedAt: releasedAt });
  await repo.insertRelease(job.id, Number(job.amount));

  return NextResponse.json({
    released: true,
    unlocksAt: unlocksAt.toISOString(),
    lockSeconds: DEMO_LOCK_SECONDS,
  });
}
