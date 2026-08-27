// src/app/api/plug/jobs/[jobId]/quote/route.ts
// PATCH — Plug submits a price quote. Proxies to backend PATCH /jobs/:id/quote (PLUG-only).
// Backend body is a single { amount: number } (SubmitQuoteDto, >= ₦500). There is NO
// materials/labour split on the backend — the card sums those client-side into `amount`.
// Backend returns { job, flaggedForReview } (a quote over ₦200k is held for admin review, not
// rejected). Valid from IN_DISCUSSION / VISIT_DONE / QUOTED; other states get a 400.

import { NextResponse } from 'next/server';
import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  let body: { amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'amount (a number) is required' }, { status: 400 });
  }

  return backendPatch(`/jobs/${jobId}/quote`, request.headers.get('authorization'), { amount });
}
