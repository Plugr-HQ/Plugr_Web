// src/app/api/plugs/[plugId]/verification/route.ts
// PATCH — ops verification toggle (`verified`). Proxies to the NestJS backend's
// PATCH /plugs/:id/verification (guarded ADMIN only), forwarding the caller's token.
//
// Split out of the old combined PATCH /plugs/:id. There is no admin-facing UI wired to this
// yet — the admin "verifications" tab is currently a static mock (see the token/guards report).
// The only current caller is DashboardScreen's "simulate approval" shortcut, which will 403
// because it runs as a PLUG; real approval needs an admin caller.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let body: { verified?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  if (typeof body.verified !== 'boolean') {
    return NextResponse.json({ error: 'verified (boolean) is required' }, { status: 400 });
  }

  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ verified: body.verified }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not update verification' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug verification update failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not update verification' }, { status: 500 });
  }
}
