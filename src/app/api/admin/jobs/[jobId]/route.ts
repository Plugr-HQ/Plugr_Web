// src/app/api/admin/jobs/[jobId]/route.ts
// DELETE — same-origin proxy for the Dispatch Queue's bin button (ADMIN-only).
//
// This route did not exist: the button called DELETE /api/admin/jobs/:id, Next matched no handler
// and returned its HTML 404 page, so the UI could only report a generic "Failed to delete job".
// The backend had no delete endpoint either — both layers are now in place.
//
// The delete is a SOFT delete on the backend (sets deletedAt). Jobs with escrow locked/released or
// a held visit fee are refused there, and that refusal is passed through verbatim so the admin sees
// why — the money still needs settling — instead of a generic failure.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/jobs/${jobId}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: auth },
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      // Nest sends { message: string | string[], error, statusCode } — flatten and pass it through.
      const raw = data && (data.message ?? data.error);
      const message = Array.isArray(raw) ? raw.join('; ') : raw;
      return NextResponse.json(
        { error: message ?? 'could not delete job' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ job: data });
  } catch (e) {
    console.error('admin delete-job proxy failed', e);
    return NextResponse.json({ error: 'could not delete job' }, { status: 502 });
  }
}
