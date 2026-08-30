// src/app/api/plugs/signup/route.ts
// POST — creates a Plug account from the single-page signup form (Part A).
//
// Deliberately SEPARATE from /api/plugs/register, which is the old end-of-onboarding endpoint and
// still requires an 11-digit NIN. This one requires a password and NO NIN, because identity
// verification now happens after signup, from the profile-completion screen.
//
// Both proxy to the same backend POST /auth/register. Leaving the old route untouched means the
// previous flow keeps working while this one is rolled out — see the note at the bottom about
// retiring it.
//
// NIN is not accepted here at all. Not "accepted and ignored" — absent. There is nowhere for it
// to go and nothing to verify it against at this point in the flow.

import { NextResponse } from 'next/server';

const TRADES = ['electrician', 'plumber', 'furniture'];
const MIN_PASSWORD = 8; // must match the backend's @MinLength(8) and the form's own check
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
    email?: string | null;
    trade?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const firstName = (body.firstName ?? '').trim();
  const lastName = (body.lastName ?? '').trim();
  const phone = (body.phone ?? '').trim();
  const password = body.password ?? '';
  const trade = (body.trade ?? '').trim().toLowerCase();
  // Optional — blank must travel as undefined, never '', which would collide on the backend's
  // unique email index across every Plug who skipped it.
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'a valid email address is required' }, { status: 400 });
  }

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'first and last name are required' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'a WhatsApp number is required' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `password must be at least ${MIN_PASSWORD} characters` },
      { status: 400 }
    );
  }
  if (!TRADES.includes(trade)) {
    return NextResponse.json({ error: `trade must be one of ${TRADES.join(' | ')}` }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'enter a valid email address, or leave it blank' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        password,
        name: `${firstName} ${lastName}`,
        role: 'PLUG',
        trade,
        ...(email ? { email } : {}),
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        address: body.address ?? null,
      }),
    });

    const data = await backendRes.json().catch(() => ({} as any));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not create your account' },
        { status: backendRes.status }
      );
    }

    // Returns { accessToken, refreshToken, user, plug } — the form stores the session from this
    // and goes straight into the app. No second sign-in step.
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('plug signup failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not create your account' }, { status: 500 });
  }
}

// FOLLOW-UP (not done here, deliberately): once this flow is confirmed live, /api/plugs/register
// and the six-step OnboardingProfileScreen it serves become dead weight. Removing them is a
// separate change — deleting a working signup path in the same commit that introduces its
// replacement leaves no way back if this one misbehaves on real traffic.
