// src/app/api/plugs/register/route.ts
// POST — creates a real Plug row at the end of Plug onboarding (PLG-ON-02).
//
// The new Plug starts unverified so PLG-01 opens in the spec's "Pending Review" state until
// ops approval. Rating/jobs start at 0 — a new Plug has no record yet; the trust record
// compounds from here.
//
// Static segment, so it resolves ahead of /api/plugs/[plugId] and doesn't touch the
// pre-existing mock collection route at /api/plugs.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

const TRADES = ['electrician', 'plumber', 'furniture'];

export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    trade?: string;
    photoUrl?: string | null;
    nin?: string;
    phone?: string;
    source?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const source = resolveSource(request, body.source);
  const repo = getRepo(source);

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
  // The core tables key a Plug to a real "User" row, which requires a phone. The hack_ demo
  // tables store the Plug standalone, so phone stays optional there.
  if (source === 'core' && !phone) {
    return NextResponse.json({ error: 'phone is required to register a Plug' }, { status: 400 });
  }

  try {
    const plug = await repo.createPlug({
      firstName,
      lastName,
      trade,
      photoUrl: body.photoUrl ?? null,
      phone: phone || null,
    });

    // NIN is deliberately NOT persisted — the spec forbids exposing raw NIN/BVN anywhere,
    // and there's no verification service to hand it to yet.
    return NextResponse.json({ plug }, { status: 201 });
  } catch (e: any) {
    console.error('plug register failed', e);
    const message = String(e?.message ?? '');
    if (message.includes('phone is required') || message.includes('no Category')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'could not create plug' }, { status: 500 });
  }
}
