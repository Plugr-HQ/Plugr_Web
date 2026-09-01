// src/app/api/plugs/nin/route.ts
// POST — submits a Plug's NIN for encrypted storage pending verification. Proxies to the
// NestJS backend POST /plugs/nin, which is JwtAuthGuard-protected and reads req.user.id.
// The caller's Authorization header must be forwarded through unchanged — an unauthenticated
// or expired-token request must reach the backend as unauthenticated too, never silently
// succeed against nobody.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
    let body: { nin?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
    }

    const nin = (body.nin ?? '').trim();
    if (!/^\d{11}$/.test(nin)) {
        return NextResponse.json({ error: 'NIN must be exactly 11 digits' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    try {
        const backendRes = await fetch(`${API_URL}/plugs/nin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: authHeader },
            body: JSON.stringify({ nin }),
        });

        const data = await backendRes.json().catch(() => ({} as any));

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data?.message ?? data?.error ?? 'could not submit NIN' },
                { status: backendRes.status }
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('nin submission failed (backend proxy)', e);
        return NextResponse.json({ error: 'could not submit NIN' }, { status: 500 });
    }
}