// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view. Proxies to the NestJS backend (GET /plugs/:id), forwarding the caller's token.
//
// PATCH moved out: the old combined PATCH /plugs/:id was split on the backend into
//   PATCH /plugs/:id/profile      (PLUG + ownership)  -> ./profile/route.ts
//   PATCH /plugs/:id/verification (ADMIN)             -> ./verification/route.ts

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  // Forward the caller's bearer token so the backend's guards can authorize.
  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}`, {
      method: 'GET',
      cache: 'no-store',
      headers: auth ? { Authorization: auth } : undefined,
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
