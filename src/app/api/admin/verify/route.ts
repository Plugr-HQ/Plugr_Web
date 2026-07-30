// src/app/api/admin/verify/route.ts
// Same-origin proxy that validates an admin session server-side.
//
// Forwards the caller's bearer token to the guarded NestJS endpoint POST /auth/admin/bootstrap
// (which is @Roles(ADMIN) and side-effect-free — it just returns a static ack). A 2xx means
// "this is a live admin session"; anything else (401/403/expired/revoked) means "not admin".
// The /admin client guard uses this so protection isn't only a client-side JWT decode, and so a
// backend 401 bounces the user back to login. Proxied (not called direct from the browser) to
// match how the app's other authenticated backend calls forward the token, and to avoid CORS.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/admin/bootstrap`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: auth },
    });

    if (!backendRes.ok) {
      // Mirror the backend's rejection status (401/403) so the client treats it as "not admin".
      return NextResponse.json({ ok: false }, { status: backendRes.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin verify proxy failed', e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
