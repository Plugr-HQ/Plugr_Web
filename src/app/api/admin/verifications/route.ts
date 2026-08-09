// src/app/api/admin/verifications/route.ts
// Same-origin proxy for the /ad-minn Verifications queue. Forwards to the backend
// GET /plugs/pending (ADMIN-guarded) — plugs still awaiting approval (isVerified = false).

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  try {
    const backendRes = await fetch(`${API_URL}/plugs/pending`, {
      method: 'GET',
      cache: 'no-store',
      headers: auth ? { Authorization: auth } : undefined,
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: (data && (data.message ?? data.error)) ?? 'could not load verifications' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ plugs: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('admin verifications proxy failed', e);
    return NextResponse.json({ error: 'could not load verifications' }, { status: 502 });
  }
}
