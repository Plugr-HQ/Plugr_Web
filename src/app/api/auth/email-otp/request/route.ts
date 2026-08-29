// src/app/api/auth/email-otp/request/route.ts
// POST — sends the inline email-verification code shown under the email field on Plug signup.
// Proxies to the NestJS backend POST /auth/email/otp/request.
//
// The 503 the backend returns when no email provider is configured is passed through UNCHANGED:
// the signup form keys off that exact status to degrade to "we'll confirm it later" instead of
// pretending the address was verified.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'enter a valid email address' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/email/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await backendRes.json().catch(() => ({} as any));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not send the code' },
        { status: backendRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('email otp request failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not send the code' }, { status: 500 });
  }
}
