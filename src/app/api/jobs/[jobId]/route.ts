// src/app/api/jobs/[jobId]/route.ts
// GET — full snapshot of a job: the job row, its Plug, and its transaction trail.
// Used for the Screen-3 payment poll and the Receipt screen. Next 16: await params.

import { NextResponse } from 'next/server';
import { q, one } from '@/src/lib/hackDb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    const job = await one('select * from hack_jobs where id = $1', [jobId]);
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 });
    }

    const [plug, transactions] = await Promise.all([
      one('select * from hack_plugs where id = $1', [job.plug_id]),
      q('select * from hack_transactions where job_id = $1 order by created_at asc', [job.id]),
    ]);

    return NextResponse.json({ job, plug, transactions: transactions ?? [] });
  } catch (e) {
    console.error('job snapshot failed', e);
    return NextResponse.json({ error: 'could not load job' }, { status: 500 });
  }
}
