// src/app/api/jobs/[jobId]/complete/route.ts
// POST — Screen 4 "Mark Complete". Only an 'accepted' job can be completed. Sets
// completed_at; the client then confirms on Screen 5 to release escrow.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

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
  if (job.status !== 'accepted') {
    return NextResponse.json(
      { error: `job is '${job.status}', expected 'accepted' to mark complete` },
      { status: 400 }
    );
  }

  await repo.setJobStatus(job.id, 'completed', { completedAt: new Date() });
  return NextResponse.json({ completed: true, status: 'completed' });
}
