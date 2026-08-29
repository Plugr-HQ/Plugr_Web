// src/app/api/auth/email-otp/verify/route.ts
// POST — confirms the inline email code. Proxies to the NestJS backend POST /auth/email/otp/verify.
//
// Success writes a short-lived server-side marker against the address; /auth/register reads that
// marker to stamp emailVerifiedAt. Nothing this route returns is trusted as proof on its own.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  let body: { email?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const otp = (body.otp ?? '').replace(/\D/g, '');

  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
  if (otp.length !== 6) return NextResponse.json({ error: 'enter the 6-digit code' }, { status: 400 });

  try {
    const backendRes = await fetch(`${API_URL}/auth/email/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await backendRes.json().catch(() => ({} as any));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'incorrect or expired code' },
        { status: backendRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('email otp verify failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not verify the code' }, { status: 500 });
  }
}
