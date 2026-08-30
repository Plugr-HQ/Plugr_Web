// src/app/api/plugs/[plugId]/profile/route.ts
// GET   — public plug profile for the client booking flow. Proxies to the backend's public,
//         unguarded GET /plugs/:id/profile (display fields only, no wallet data). No token
//         needed — a client views a plug before any session exists.
// PATCH — self-service profile edit (bio / photoUrl / workPosts / skills / experience).
//         Proxies to the NestJS backend's PATCH /plugs/:id/profile (guarded PLUG + ownership),
//         forwarding the token.
//
// PATCH was split out of the old combined PATCH /plugs/:id. `verified` is intentionally NOT
// handled here — that lives on ../verification (ADMIN only).

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  try {
    // Public endpoint — no Authorization needed.
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}/profile`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not load plug profile' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug public profile failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not load plug profile' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let body: {
    bio?: string;
    photoUrl?: string | null;
    workPosts?: unknown;
    skills?: unknown;
    experience?: unknown;
    email?: string;
  };
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
  // Skills and work history, edited on PLG-02. This route forwards an explicit allow-list, so a
  // field that isn't named here is dropped SILENTLY — the save appears to succeed and the value
  // never lands. Anything added to the profile editor has to be added here too.
  if (Array.isArray(body.skills)) payload.skills = body.skills;
  if (Array.isArray(body.experience)) payload.experience = body.experience;
  // Optional contact email (Settings). '' is meaningful — it clears the address — so an empty
  // string is forwarded deliberately rather than dropped as "nothing to update".
  if (typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'enter a valid email address, or clear the field' }, { status: 400 });
    }
    payload.email = email;
  }

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
