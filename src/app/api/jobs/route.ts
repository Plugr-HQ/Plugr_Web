// src/app/api/jobs/route.ts
// GET  — list recent jobs (optionally ?status=paid_escrow,accepted), for the Plug view.
// POST — create a job (Screen: Book). Inserts at status 'requested'; the returned id becomes
// the ALATPay orderId so the payment can be correlated back.
//
// ?source=core targets the real product tables; anything else stays on the hack_ demo tables.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

export async function GET(request: Request) {
  const repo = getRepo(resolveSource(request));
  const statusParam = new URL(request.url).searchParams.get('status');

  try {
    const jobs = await repo.listJobs(statusParam?.split(',').map((s) => s.trim()));
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
    source?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const repo = getRepo(resolveSource(request, body.source));
  const { plugId, clientName, jobDescription } = body;
  const amount = Number(body.amount);

  if (!plugId || !clientName || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'plugId, clientName and a positive amount are required' },
      { status: 400 }
    );
  }

  try {
    const job = await repo.createJob({
      plugId,
      clientName,
      clientPhone: body.clientPhone ?? null,
      jobDescription: jobDescription ?? null,
      amount,
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (e: any) {
    console.error('create job failed', e);
    // The core backend rejects a booking with no phone (User.phone is NOT NULL UNIQUE) —
    // surface that as a 400 rather than a blanket 500.
    const message = String(e?.message ?? '');
    if (message.includes('clientPhone is required') || message.includes('plug not found')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'could not create job' }, { status: 500 });
  }
}
