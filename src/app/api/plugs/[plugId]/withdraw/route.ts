// src/app/api/plugs/[plugId]/withdraw/route.ts
// Screen 7. ALATPay exposes no merchant-triggerable payout endpoint, so this stays honest:
// deduct from available balance and record a PENDING withdrawal ("Processing" in the UI).
// Do NOT fabricate a completed bank transfer. Next 16: await params.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let body: { amount?: number; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const source = resolveSource(request, body.source);
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'a positive amount is required' }, { status: 400 });
  }

  if (source === 'core') {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Forward the caller's bearer token — withdraw is strict PLUG+ownership on the backend.
    const auth = request.headers.get('authorization');
    try {
      const backendRes = await fetch(`${API_URL}/plugs/${plugId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify({ amount }),
      });

      const data = await backendRes.json();

      if (!backendRes.ok) {
        return NextResponse.json(
          { error: data?.message ?? data?.error ?? 'could not process withdrawal' },
          { status: backendRes.status }
        );
      }

      return NextResponse.json(data);
    } catch (e) {
      console.error('withdrawal backend proxy failed', e);
      return NextResponse.json({ error: 'could not process withdrawal' }, { status: 500 });
    }
  }

  // Fallback for hack (demo) source
  const repo = getRepo(source);
  const plug = await repo.getPlug(plugId);
  if (!plug) {
    return NextResponse.json({ error: 'plug not found' }, { status: 404 });
  }
  if (Number(plug.wallet_balance_available) < amount) {
    return NextResponse.json({ error: 'insufficient available balance' }, { status: 400 });
  }

  await repo.debitAvailable(plug.id, amount);
  const withdrawal = await repo.insertWithdrawal(amount);

  return NextResponse.json({ withdrawal, status: 'pending' });
}