// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view.
// PATCH — edit the Plug's own profile (PLG-02) and flip ops approval.
//
// Both now proxy to the NestJS backend instead of querying Postgres directly (that direct
// path lived in src/lib/repo/core.ts and required its own DATABASE_URL on Vercel — see
// incident notes from 2026-07-24/25).

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not load plug' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug snapshot failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not load plug' }, { status: 500 });
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
    verified?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const hasUpdate =
    typeof body.bio === 'string' ||
    typeof body.photoUrl === 'string' ||
    body.photoUrl === null ||
    Array.isArray(body.workPosts) ||
    typeof body.verified === 'boolean';

  if (!hasUpdate) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not update plug' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug update failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not update plug' }, { status: 500 });
  }
}