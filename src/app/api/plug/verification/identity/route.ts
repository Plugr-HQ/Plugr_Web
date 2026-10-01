// src/app/api/plug/verification/identity/route.ts
// GET — the signed-in Plug's identity verification status. Proxies to the NestJS backend
// GET /verification/identity (JwtAuthGuard + PLUG role; resolves the Plug from the token).
// The Authorization header is forwarded unchanged: an unauthenticated request must reach the
// backend as unauthenticated, never silently succeed against nobody.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/verification/identity`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      // Never leave the Plug on a spinner if the backend is unreachable or cold.
      signal: AbortSignal.timeout(15_000),
    });
    const data = await backendRes.json().catch(() => ({} as any));
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not load verification status' },
        { status: backendRes.status },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('identity status failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not load verification status' }, { status: 500 });
  }
}
