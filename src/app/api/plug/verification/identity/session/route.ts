// src/app/api/plug/verification/identity/session/route.ts
// POST — start a Didit identity verification session for the signed-in Plug. Proxies to the NestJS
// backend POST /verification/identity/session, which holds DIDIT_API_KEY and creates the session
// server-side. The browser only ever receives { url, sessionId }; no Didit secret passes through here.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/verification/identity/session`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: '{}',
      // Covers the backend's own 15s Didit call plus a cold start, then gives up.
      signal: AbortSignal.timeout(30_000),
    });
    const data = await backendRes.json().catch(() => ({} as any));
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not start identity verification' },
        { status: backendRes.status },
      );
    }
    // Only what the client needs to open the flow.
    return NextResponse.json({ url: data.url, sessionId: data.sessionId });
  } catch (e) {
    console.error('identity session failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not start identity verification' }, { status: 500 });
  }
}
