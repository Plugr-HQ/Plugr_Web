// src/app/api/jobs/[jobId]/accept/route.ts
// POST — Screen 4 "Accept". Only a job whose escrow is locked (money confirmed held)
// can be accepted by the plug.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, status, "escrowStatus" from "Job" where id = $1',
    [jobId]
  );
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (job.escrowStatus !== 'locked') {
    return NextResponse.json(
      { error: `escrow is '${job.escrowStatus}', expected 'locked' to accept` },
      { status: 400 }
    );
  }

  await q('update "Job" set status = $2 where id = $1', [job.id, 'PLUG_ACCEPTED']);
  return NextResponse.json({ accepted: true, status: 'PLUG_ACCEPTED' });
}