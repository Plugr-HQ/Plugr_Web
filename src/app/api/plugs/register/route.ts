// src/app/api/plugs/register/route.ts
// POST — creates a real hack_plugs row at the end of Plug onboarding (PLG-ON-02).
//
// The new Plug starts unverified (verified = false) so PLG-01 opens in the spec's
// "Pending Review" state until ops approval. Rating/jobs start at 0 — a new Plug has no
// record yet; the trust record compounds from here.
//
// Static segment, so it resolves ahead of /api/plugs/[plugId] and doesn't touch the
// pre-existing mock collection route at /api/plugs.

import { NextResponse } from 'next/server';
import { one } from '@/src/lib/hackDb';

const TRADES = ['electrician', 'plumber', 'furniture'];

export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    trade?: string;
    photoUrl?: string | null;
    nin?: string;
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

  try {
    const plug = await one(
      `insert into hack_plugs
         (name, trade, photo_url, rating, jobs_completed, verified,
          wallet_balance_available, wallet_balance_locked)
       values ($1, $2, $3, 0, 0, false, 0, 0)
       returning *`,
      [`${firstName} ${lastName}`, trade, body.photoUrl ?? null]
    );

    // NIN is deliberately NOT persisted — the spec forbids exposing raw NIN/BVN anywhere,
    // and there's no verification service to hand it to yet.
    return NextResponse.json({ plug }, { status: 201 });
  } catch (e) {
    console.error('plug register failed', e);
    return NextResponse.json({ error: 'could not create plug' }, { status: 500 });
  }
}
