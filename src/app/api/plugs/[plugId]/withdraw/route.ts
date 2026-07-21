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

  const repo = getRepo(resolveSource(request, body.source));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'a positive amount is required' }, { status: 400 });
  }

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
