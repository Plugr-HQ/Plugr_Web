// src/app/api/plugs/[plugId]/dashboard/route.ts
// GET — everything PLG-01 (Home) and PLG-03 (Wallet) need in one call:
//   plug, earnings (week / month / all), active job, recent jobs, wallet lock state.
//
// Proxies to the guarded NestJS backend GET /plugs/:id/dashboard, forwarding the caller's token.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}/dashboard`, {
      method: 'GET',
      cache: 'no-store',
      headers: auth ? { Authorization: auth } : undefined,
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not load dashboard' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug dashboard failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not load dashboard' }, { status: 500 });
  }
}
