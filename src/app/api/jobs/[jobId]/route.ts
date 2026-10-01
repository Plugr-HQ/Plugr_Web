// src/app/api/jobs/[jobId]/route.ts
// GET — full snapshot of a job: the job row, its Plug, and its transaction trail.
// Used for the Screen-3 payment poll and the Receipt screen. Next 16: await params.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  try {
    const job = await repo.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 });
    }

    const [plug, transactions] = await Promise.all([
      job.plug_id ? repo.getPlug(job.plug_id) : Promise.resolve(null),
      repo.txnsForJob(job.id),
    ]);

    return NextResponse.json({ job, plug, transactions: transactions ?? [] });
  } catch (e) {
    console.error('job snapshot failed', e);
    return NextResponse.json({ error: 'could not load job' }, { status: 500 });
  }
}
