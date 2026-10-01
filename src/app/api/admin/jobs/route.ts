// src/app/api/admin/jobs/route.ts
// Same-origin proxy for the admin Dispatch Queue job list. Forwards the caller's bearer token
// to the ADMIN-guarded backend GET /jobs (?status,&page,&limit) and mirrors its status — same
// token-forwarding convention as /api/admin/verify and the plug dashboard proxy.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const qs = new URLSearchParams();
  for (const key of ['status', 'page', 'limit'] as const) {
    const v = url.searchParams.get(key);
    if (v) qs.set(key, v);
  }

  try {
    const backendRes = await fetch(`${API_URL}/jobs?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: auth },
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not load jobs' },
        { status: backendRes.status },
      );
    }

    // Backend returns a bare array; wrap it for a stable client contract.
    return NextResponse.json({ jobs: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('admin jobs proxy failed', e);
    return NextResponse.json({ error: 'could not load jobs' }, { status: 502 });
  }
}
