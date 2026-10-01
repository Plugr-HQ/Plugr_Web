// src/app/api/admin/escrow/[jobId]/resolve/route.ts
// Same-origin proxy for POST /escrow/:jobId/resolve (ADMIN-only) — the dispute resolution.
//
// Keyed by jobId (not disputeId): the backend resolves the OPEN dispute on that job. Resolution
// is the money-movement decision — 'release_to_plug' or 'refund_to_client' — and there is no
// separate "just close the dispute row" call; this single endpoint moves the funds AND marks the
// Dispute RESOLVED. Forwards { resolution, resolutionNote? } and surfaces the backend's real error
// (e.g. "No open dispute on this job.") rather than a generic one.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { resolution?: string; resolutionNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }
  if (body.resolution !== 'release_to_plug' && body.resolution !== 'refund_to_client') {
    return NextResponse.json(
      { error: 'resolution must be release_to_plug or refund_to_client' },
      { status: 400 },
    );
  }

  try {
    const backendRes = await fetch(`${API_URL}/escrow/${jobId}/resolve`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ resolution: body.resolution, resolutionNote: body.resolutionNote }),
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      const raw = data && (data.message ?? data.error);
      const message = Array.isArray(raw) ? raw.join('; ') : raw;
      return NextResponse.json(
        { error: message ?? 'could not resolve dispute' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('admin resolve proxy failed', e);
    return NextResponse.json({ error: 'could not resolve dispute' }, { status: 502 });
  }
}
