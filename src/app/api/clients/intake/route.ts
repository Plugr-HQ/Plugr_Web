// src/app/api/clients/intake/route.ts
// POST — records a client from the one-time intake form (Part B).
//
// Proxies to the NestJS backend's POST /clients/intake, which upserts on the WhatsApp number
// (the identifying key). Same shape as the other proxies here: validate at this edge so the
// caller gets a stable error message, then forward.
//
// No auth: clients have no account by design. This is a capture, not a sign-up.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; email?: string | null; address?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  const phone = (body.phone ?? '').trim();
  // Blank must travel as undefined, never '' — the backend's email column is unique and an empty
  // string would collide across every client who skipped it.
  const email = (body.email ?? '').trim().toLowerCase() || undefined;
  const address = (body.address ?? '').trim() || undefined;

  if (!name) {
    return NextResponse.json({ error: 'enter your name' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'a WhatsApp number is required' }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'enter a valid email address, or leave it blank' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/clients/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, ...(email ? { email } : {}), ...(address ? { address } : {}) }),
    });

    const data = await backendRes.json().catch(() => ({} as any));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not record your details' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error('client intake failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not record your details' }, { status: 500 });
  }
}
