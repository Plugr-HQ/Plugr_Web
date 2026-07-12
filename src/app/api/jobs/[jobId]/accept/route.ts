// src/app/api/jobs/[jobId]/accept/route.ts
// POST — Screen 4 "Accept". Only a 'paid_escrow' job can be accepted (money confirmed held).

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
  if (job.status !== 'paid_escrow') {
    return NextResponse.json(
      { error: `job is '${job.status}', expected 'paid_escrow' to accept` },
      { status: 400 }
    );
  }

  await q("update hack_jobs set status = 'accepted' where id = $1", [job.id]);
  return NextResponse.json({ accepted: true, status: 'accepted' });
}
