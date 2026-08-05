// src/app/api/plugs/register/route.ts
// POST — creates a Plug row at the end of Plug onboarding (PLG-ON-02).
//
// Source-branched (matches the withdraw proxy):
//   core (/app)  -> proxy to the NestJS backend POST /auth/register (returns a real JWT).
//   hack (/demo) -> local hack_ repo only, so the demo stays isolated and never creates real
//                   backend rows / tokens.
//
// Validation stays here so error messages/UX don't change for the caller. NIN is deliberately
// never sent to the backend or persisted — spec forbids exposing raw NIN/BVN, and there's no
// verification service to hand it to yet.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

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

  const source = resolveSource(request, body.source);

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
  if (nin.length !== 11) {
    return NextResponse.json({ error: 'NIN must be 11 digits' }, { status: 400 });
  }
  if (source === 'core' && !phone) {
    return NextResponse.json({ error: 'phone is required to register a Plug' }, { status: 400 });
  }

  // core (/app): proxy to NestJS backend, forwarding location data
  if (source === 'core') {
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

  // hack (/demo) route
  try {
    const plug = await getRepo('hack').createPlug({
      firstName,
      lastName,
      trade,
      photoUrl: body.photoUrl ?? null,
      phone: phone || null,
    });
    return NextResponse.json({ plug }, { status: 201 });
  } catch (e: any) {
    console.error('plug register failed (hack repo)', e);
    const message = String(e?.message ?? '');
    if (message.includes('phone is required') || message.includes('no Category')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'could not create plug' }, { status: 500 });
  }
}