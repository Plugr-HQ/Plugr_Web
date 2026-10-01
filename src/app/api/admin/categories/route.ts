// src/app/api/admin/categories/route.ts
// Same-origin proxy for the admin Categories tab. Forwards the bearer token to the
// ADMIN-guarded Nest routes GET/POST /admin/categories.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/admin/categories`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: auth },
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not load categories' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('admin categories GET proxy failed', e);
    return NextResponse.json({ error: 'could not load categories' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.text();

  try {
    const backendRes = await fetch(`${API_URL}/admin/categories`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body,
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      const message = Array.isArray(data?.message) ? data.message.join(' ') : (data?.message ?? data?.error);
      return NextResponse.json(
        { error: message || 'could not create category' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('admin categories POST proxy failed', e);
    return NextResponse.json({ error: 'could not create category' }, { status: 502 });
  }
}
