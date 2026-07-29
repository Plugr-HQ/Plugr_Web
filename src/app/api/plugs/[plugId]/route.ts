// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view.
//
// Source-branched (matches the withdraw proxy):
//   core (/app)  -> proxy to the guarded NestJS backend GET /plugs/:id, forwarding the token.
//   hack (/demo) -> local hack_ repo only, so demo traffic never reaches the guarded backend.
//
// PATCH moved out: the old combined PATCH /plugs/:id was split into
//   PATCH /plugs/:id/profile      (PLUG + ownership)  -> ./profile/route.ts
//   PATCH /plugs/:id/verification (ADMIN)             -> ./verification/route.ts

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  const source = resolveSource(request);

  // hack (/demo): serve from the local repo — never touches the guarded backend.
  if (source !== 'core') {
    try {
      const repo = getRepo('hack');
      const plug = await repo.getPlug(plugId);
      if (!plug) {
        return NextResponse.json({ error: 'plug not found' }, { status: 404 });
      }
      const withdrawals = await repo.listWithdrawals();
      return NextResponse.json({ plug, withdrawals: withdrawals ?? [] });
    } catch (e) {
      console.error('plug snapshot failed (hack repo)', e);
      return NextResponse.json({ error: 'could not load plug' }, { status: 500 });
    }
  }

  // core (/app): forward to the backend, passing the caller's bearer token for the guards.
  const auth = request.headers.get('authorization');
  try {
    const backendRes = await fetch(`${API_URL}/plugs/${plugId}`, {
      method: 'GET',
      cache: 'no-store',
      headers: auth ? { Authorization: auth } : undefined,
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'could not load plug' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('plug snapshot failed (backend proxy)', e);
    return NextResponse.json({ error: 'could not load plug' }, { status: 500 });
  }
}
