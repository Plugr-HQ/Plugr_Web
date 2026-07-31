// src/app/api/admin/plugs/route.ts
// Same-origin proxy for the assign flow's candidate list. Forwards to the backend GET /plugs
// (?categoryCode) so an admin can pick a plug in the job's category. GET /plugs is public on the
// backend, but we forward the bearer if present to stay consistent with the other admin proxies.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const url = new URL(request.url);
  const categoryCode = url.searchParams.get('categoryCode');

  const qs = new URLSearchParams();
  if (categoryCode) qs.set('categoryCode', categoryCode);

  try {
    const backendRes = await fetch(`${API_URL}/plugs?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: auth ? { Authorization: auth } : undefined,
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not load plugs' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ plugs: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('admin plugs proxy failed', e);
    return NextResponse.json({ error: 'could not load plugs' }, { status: 502 });
  }
}
