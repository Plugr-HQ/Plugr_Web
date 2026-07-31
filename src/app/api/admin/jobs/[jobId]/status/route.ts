// src/app/api/admin/jobs/[jobId]/status/route.ts
// Same-origin proxy for PATCH /jobs/:id/status — the manual admin status-override. Forwards the
// bearer token and { status, reason? } to the backend and mirrors its status.
//
// Distinct from the assign proxy: the backend endpoint here takes { status, reason? } (not
// { plugId }) and is validated by the JobStateMachine. We pass the backend's real error through
// (e.g. "State transfer from [PLUG_ASSIGNED] to [COMPLETED] is not allowed") rather than
// pre-judging validity on the client, so the UI never drifts from the state machine's truth.

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

  let body: { status?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }
  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/jobs/${jobId}/status`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ status: body.status, reason: body.reason }),
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      const raw = data && (data.message ?? data.error);
      const message = Array.isArray(raw) ? raw.join('; ') : raw;
      return NextResponse.json(
        { error: message ?? 'could not update status' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ job: data });
  } catch (e) {
    console.error('admin status proxy failed', e);
    return NextResponse.json({ error: 'could not update status' }, { status: 502 });
  }
}
