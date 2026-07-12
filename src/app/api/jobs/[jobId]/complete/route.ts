// src/app/api/jobs/[jobId]/complete/route.ts
// POST — Screen 4 "Mark Complete". Only an 'accepted' job can be completed. Sets
// completed_at; the client then confirms on Screen 5 to release escrow.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one('select id, status from hack_jobs where id = $1', [jobId]);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (job.status !== 'accepted') {
    return NextResponse.json(
      { error: `job is '${job.status}', expected 'accepted' to mark complete` },
      { status: 400 }
    );
  }

  await q("update hack_jobs set status = 'completed', completed_at = now() where id = $1", [job.id]);
  return NextResponse.json({ completed: true, status: 'completed' });
}
