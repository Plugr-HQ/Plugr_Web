// src/app/api/jobs/deeplink/[token]/route.ts
// GET — same-origin proxy for the WhatsApp "View on Dashboard" deep link.
//
// Unlike every other /api/plug/* route this forwards NO bearer token: the signed, short-lived
// token in the path IS the authorization (the backend's JobDeepLinkGuard verifies it and reads
// jobId/plugId out of the payload). A Plug tapping this straight from WhatsApp has no web session
// yet, which is the whole point of the deep link.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const res = await fetch(`${API_URL}/jobs/deeplink/${encodeURIComponent(token)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Surface the backend's own wording — it distinguishes an expired link from an invalid one,
      // which is exactly what the person tapping it needs to know.
      const raw = data?.message ?? data?.error;
      return NextResponse.json(
        { error: Array.isArray(raw) ? raw.join('; ') : raw ?? 'This link could not be opened.' },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('job deeplink proxy failed', e);
    return NextResponse.json({ error: 'could not reach the server' }, { status: 502 });
  }
}
