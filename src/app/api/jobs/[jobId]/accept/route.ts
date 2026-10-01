// src/app/api/jobs/[jobId]/accept/route.ts
// POST — Screen 4 "Accept". Only a 'paid_escrow' job can be accepted (money confirmed held).

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
  if (job.status !== 'paid_escrow') {
    return NextResponse.json(
      { error: `job is '${job.status}', expected 'paid_escrow' to accept` },
      { status: 400 }
    );
  }

  await repo.setJobStatus(job.id, 'accepted');
  return NextResponse.json({ accepted: true, status: 'accepted' });
}
