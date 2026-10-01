// src/app/api/admin/jobs/[jobId]/assign/route.ts
// Same-origin proxy for PATCH /jobs/:id/assign (ADMIN-only). Forwards the bearer token and the
// { plugId } body to the backend and mirrors its status. Crucially it surfaces the backend's
// actual validation message (plug not ACTIVE, category mismatch, job already assigned, illegal
// state transition) rather than a generic error, so the admin sees why an assignment failed.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { plugId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }
  if (!body.plugId) {
    return NextResponse.json({ error: 'plugId is required' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/jobs/${jobId}/assign`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ plugId: body.plugId }),
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      // Nest sends { message: string | string[], error, statusCode } — flatten and pass it through.
      const raw = data && (data.message ?? data.error);
      const message = Array.isArray(raw) ? raw.join('; ') : raw;
      return NextResponse.json(
        { error: message ?? 'could not assign plug' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ job: data });
  } catch (e) {
    console.error('admin assign proxy failed', e);
    return NextResponse.json({ error: 'could not assign plug' }, { status: 502 });
  }
}
