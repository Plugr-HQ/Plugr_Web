// src/app/api/plugs/register/route.ts
// POST — creates a Plug row at the end of Plug onboarding (PLG-ON-02).
//
// Proxies to the NestJS backend POST /auth/register (returns a real JWT).
//
// Validation stays here so error messages/UX don't change for the caller. NIN is deliberately
// never sent to the backend or persisted — spec forbids exposing raw NIN/BVN, and there's no
// verification service to hand it to yet.

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
    email?: string | null;
    source?: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
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
  // Optional — collected at the very end of onboarding and skippable, so blank is a valid answer
  // and must be sent as undefined (never ''), which would collide on the backend's unique index.
  const email = (body.email ?? '').trim().toLowerCase() || undefined;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'first and last name are required' }, { status: 400 });
  }
  if (!TRADES.includes(trade)) {
    return NextResponse.json({ error: `trade must be one of ${TRADES.join(' | ')}` }, { status: 400 });
  }
  if (nin.length !== 11) {
    return NextResponse.json({ error: 'NIN must be 11 digits' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'phone is required to register a Plug' }, { status: 400 });
  }
  // Only validate the shape when one was actually given — skipping stays valid.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'enter a valid email address, or skip it' }, { status: 400 });
  }

  // Proxy to the NestJS backend, forwarding location data.
  try {
    const backendRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name: `${firstName} ${lastName}`,
        role: 'PLUG',
        ...(email ? { email } : {}),
        trade,
        photoUrl: body.photoUrl ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        address: body.address ?? null,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not create plug' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('plug register failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not create plug' }, { status: 500 });
  }
}