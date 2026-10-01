// src/app/api/admin/disputes/route.ts
// Same-origin proxy for the admin Flags queue. Forwards the bearer token to the ADMIN-guarded
// backend GET /disputes (?status, ?all, &page, &limit) and mirrors its status. Defaults (no
// params) to OPEN, matching the backend. Same convention as the other /api/admin/* proxies.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const qs = new URLSearchParams();
  for (const key of ['status', 'all', 'page', 'limit'] as const) {
    const v = url.searchParams.get(key);
    if (v) qs.set(key, v);
  }

  try {
    const backendRes = await fetch(`${API_URL}/disputes?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: auth },
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not load disputes' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ disputes: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('admin disputes proxy failed', e);
    return NextResponse.json({ error: 'could not load disputes' }, { status: 502 });
  }
}
