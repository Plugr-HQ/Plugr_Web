// src/app/api/plug/jobs/[jobId]/quote/route.ts
// PATCH — Plug submits a price quote. Proxies to backend PATCH /jobs/:id/quote (PLUG-only).
// Backend body is { materialsAmount: number, labourAmount: number } (SubmitQuoteDto, both >= 0;
// the ₦500 floor is a cross-field rule enforced in JobsService.submitQuote, not the DTO).
// Backend returns { job, flaggedForReview } (a quote whose TOTAL exceeds ₦200k is held for admin
// review, not rejected). Valid from IN_DISCUSSION / VISIT_DONE / QUOTED; other states get a 400.

import { NextResponse } from 'next/server';
import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  let body: { materialsAmount?: unknown; labourAmount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const materialsAmount = Number(body.materialsAmount);
  const labourAmount = Number(body.labourAmount);

  if (!Number.isFinite(materialsAmount) || materialsAmount < 0) {
    return NextResponse.json({ error: 'materialsAmount (a non-negative number) is required' }, { status: 400 });
  }
  if (!Number.isFinite(labourAmount) || labourAmount < 0) {
    return NextResponse.json({ error: 'labourAmount (a non-negative number) is required' }, { status: 400 });
  }

  return backendPatch(`/jobs/${jobId}/quote`, request.headers.get('authorization'), { materialsAmount, labourAmount });
}