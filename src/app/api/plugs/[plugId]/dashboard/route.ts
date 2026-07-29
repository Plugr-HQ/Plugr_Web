// src/app/api/plugs/[plugId]/dashboard/route.ts
// GET — proxies to the NestJS backend's GET /plugs/:id/dashboard instead of querying
// Postgres directly (that direct-query path lived in src/lib/repo/core.ts and required its
// own DATABASE_URL on Vercel — see incident notes from 2026-07-24/25).
//
// Response shape is unchanged: { plug, earnings, activeJob, recentJobs, allJobs,
// withdrawals, lock } — DashboardScreen.tsx needs no changes.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  // Forward the caller's bearer token so the backend's JwtAuthGuard/RolesGuard/ownership guard
  // can authorize. The client attaches it via authHeaders(); this proxy passes it through.
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