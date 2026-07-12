// src/app/api/plugs/[plugId]/withdraw/route.ts
// Screen 7. ALATPay exposes no merchant-triggerable payout endpoint, so this stays honest:
// deduct from available balance and record a PENDING withdrawal ("Processing" in the UI).
// Do NOT fabricate a completed bank transfer. Next 16: await params.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let amount: number;
  try {
    amount = Number((await request.json())?.amount);
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'a positive amount is required' }, { status: 400 });
  }

  const plug = await one('select id, wallet_balance_available from hack_plugs where id = $1', [plugId]);
  if (!plug) {
    return NextResponse.json({ error: 'plug not found' }, { status: 404 });
  }
  if (Number(plug.wallet_balance_available) < amount) {
    return NextResponse.json({ error: 'insufficient available balance' }, { status: 400 });
  }

  await q('update hack_plugs set wallet_balance_available = wallet_balance_available - $1 where id = $2', [
    amount,
    plug.id,
  ]);

  const withdrawal = await one(
    "insert into hack_transactions (job_id, amount, type, status) values (null, $1, 'withdrawal', 'pending') returning *",
    [amount]
  );

  return NextResponse.json({ withdrawal, status: 'pending' });
}
