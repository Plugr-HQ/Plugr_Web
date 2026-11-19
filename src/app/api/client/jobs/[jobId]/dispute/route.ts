// src/app/api/client/jobs/[jobId]/dispute/route.ts
// POST — the client raises an issue with the job. Proxies to backend POST /escrow/:jobId/dispute
// (a party to the job, or ADMIN). Inside the complaint window it also freezes the held payment.

import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!reason) return NextResponse.json({ error: 'Tell us what went wrong.' }, { status: 400 });
  return proxyToBackend(request, {
    path: `/escrow/${jobId}/dispute`,
    method: 'POST',
    body: { reason: reason.slice(0, 1000) },
    fallbackError: 'Could not raise the issue.',
  });
}
