// src/app/api/jobs/[jobId]/complete/route.ts
// POST — Screen 4 "Mark Complete". Only a PLUG_ACCEPTED job can be completed. Logs a
// status-history entry; the client then confirms on Screen 5 to release escrow.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';
import { requireJobParty, UnauthorizedError } from '@/src/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, status, "clientId", "plugId" from "Job" where id = $1',
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

  if (job.status !== 'PLUG_ACCEPTED') {
    return NextResponse.json(
      { error: `job is '${job.status}', expected 'PLUG_ACCEPTED' to mark complete` },
      { status: 400 }
    );
  }

  await q('update "Job" set status = $2 where id = $1', [job.id, 'COMPLETED']);

  await q(
    `insert into "JobStatusHistory" (id, "jobId", "previousStatus", "newStatus", reason)
     values (gen_random_uuid(), $1, $2, $3, $4)`,
    [job.id, job.status, 'COMPLETED', 'marked complete via /complete']
  );

  return NextResponse.json({ completed: true, status: 'COMPLETED' });
}