// src/app/api/plugs/[plugId]/profile/route.ts
// PATCH — self-service profile edit (bio / photoUrl / workPosts). Proxies to the NestJS
// backend's PATCH /plugs/:id/profile (guarded PLUG + ownership), forwarding the caller's token.
//
// Split out of the old combined PATCH /plugs/:id. `verified` is intentionally NOT handled here
// — that lives on ../verification (ADMIN only).

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let body: { bio?: string; photoUrl?: string | null; workPosts?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  // Forward only the self-service fields — never a `verified` flag from this route.
  const payload: Record<string, unknown> = {};
  if (typeof body.bio === 'string') payload.bio = body.bio;
  if (typeof body.photoUrl === 'string' || body.photoUrl === null) payload.photoUrl = body.photoUrl;
  if (Array.isArray(body.workPosts)) payload.workPosts = body.workPosts;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify(payload),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not update profile' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug profile update failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not update profile' }, { status: 500 });
  }
}
