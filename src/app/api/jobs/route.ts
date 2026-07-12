// src/app/api/jobs/route.ts
// GET  — list recent jobs (optionally ?status=paid_escrow,accepted), for the Plug view.
// POST — create a job (Screen: Book). Inserts a hack_jobs row at status 'requested'; the
// returned id becomes the ALATPay orderId so the payment can be correlated back.

import { NextResponse } from 'next/server';
import { q, one } from '@/src/lib/hackDb';

export async function GET(request: Request) {
  const statusParam = new URL(request.url).searchParams.get('status');
  try {
    const jobs = statusParam
      ? await q(
          'select * from hack_jobs where status = any($1) order by created_at desc limit 50',
          [statusParam.split(',').map((s) => s.trim())]
        )
      : await q('select * from hack_jobs order by created_at desc limit 50');
    return NextResponse.json({ jobs });
  } catch (e) {
    console.error('list jobs failed', e);
    return NextResponse.json({ error: 'could not list jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    plugId?: string;
    clientName?: string;
    clientPhone?: string;
    jobDescription?: string;
    amount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const { plugId, clientName, jobDescription } = body;
  const amount = Number(body.amount);

  if (!plugId || !clientName || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'plugId, clientName and a positive amount are required' },
      { status: 400 }
    );
  }

  try {
    const job = await one(
      `insert into hack_jobs (plug_id, client_name, client_phone, job_description, amount, status)
       values ($1, $2, $3, $4, $5, 'requested') returning *`,
      [plugId, clientName, body.clientPhone ?? null, jobDescription ?? null, amount]
    );
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    console.error('create job failed', e);
    return NextResponse.json({ error: 'could not create job' }, { status: 500 });
  }
}
