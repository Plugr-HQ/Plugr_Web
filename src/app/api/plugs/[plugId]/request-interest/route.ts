// src/app/api/plugs/[plugId]/request-interest/route.ts
// POST — "let me know when booking opens" for one Plug, submitted from the gated
// Request-this-Plug modal. Proxies to the backend's public POST /plugs/:id/request-interest.
//
// No token: the person leaving details has no account, which is the whole point of the capture.
// Validation is duplicated on the backend — this layer only shapes the error message.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, { params }: { params: Promise<{ plugId: string }> }) {
  const { plugId } = await params;

  let body: { email?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!email && !phone) {
    return NextResponse.json({ error: 'Leave an email or a phone number so we can reach you.' }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address, or leave it blank.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/plugs/${encodeURIComponent(plugId)}/request-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(email ? { email } : {}), ...(phone ? { phone } : {}) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = Array.isArray(data?.message) ? data.message.join('; ') : (data?.message ?? data?.error);
      return NextResponse.json({ error: msg ?? 'Could not save that just now.' }, { status: res.status });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('request-interest proxy failed', e);
    return NextResponse.json({ error: 'could not reach the server' }, { status: 502 });
  }
}
