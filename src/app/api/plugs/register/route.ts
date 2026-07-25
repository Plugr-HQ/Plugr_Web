// src/app/api/plugs/register/route.ts
// POST — creates a real Plug row at the end of Plug onboarding (PLG-ON-02).
//
// This proxies to the NestJS backend's POST /auth/register instead of writing to Postgres
// directly (that direct-write path lived in src/lib/repo/core.ts and required its own
// DATABASE_URL on Vercel, which went out of sync with the real Supabase password
// independently of everything else — see incident notes from 2026-07-24).
//
// Validation stays here so error messages/UX don't change for the caller.
// NIN is still deliberately NOT sent to the backend or persisted anywhere —
// spec forbids exposing raw NIN/BVN, and there's no verification service to
// hand it to yet.

import { NextResponse } from 'next/server';

const TRADES = ['electrician', 'plumber', 'furniture'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    trade?: string;
    photoUrl?: string | null;
    nin?: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const firstName = (body.firstName ?? '').trim();
  const lastName = (body.lastName ?? '').trim();
  const trade = (body.trade ?? '').trim().toLowerCase();
  const nin = (body.nin ?? '').replace(/\D/g, '');
  const phone = (body.phone ?? '').trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'first and last name are required' }, { status: 400 });
  }
  if (!TRADES.includes(trade)) {
    return NextResponse.json({ error: `trade must be one of ${TRADES.join(' | ')}` }, { status: 400 });
  }
  // Any 11 digits pass until the NIMC/NIN verification service is wired in.
  if (nin.length !== 11) {
    return NextResponse.json({ error: 'NIN must be 11 digits' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'phone is required to register a Plug' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name: `${firstName} ${lastName}`,
        role: 'PLUG',
        trade,
        photoUrl: body.photoUrl ?? null,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not create plug' },
        { status: backendRes.status }
      );
    }

    // data = { accessToken, refreshToken, user, plug }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('plug register failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not create plug' }, { status: 500 });
  }
}