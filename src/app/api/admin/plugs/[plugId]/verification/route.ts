// src/app/api/admin/plugs/[plugId]/verification/route.ts
// Same-origin proxy for the admin approve/revoke action. Forwards to the backend
// PATCH /plugs/:id/verification (ADMIN-guarded) with { verified }. Approval flips the plug to
// verified + ACTIVE so they become bookable; revoke pulls them back offline.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> },
) {
  const { plugId } = await params;
  const auth = request.headers.get('authorization');

  let body: { verified?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}/verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({ verified: !!body.verified }),
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not update verification' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    console.error('admin verification proxy failed', e);
    return NextResponse.json({ error: 'could not update verification' }, { status: 502 });
  }
}
