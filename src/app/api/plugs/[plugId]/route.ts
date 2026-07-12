// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view. Sits alongside the existing mock /api/plugs (different segment). Next 16:
// await params.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  try {
    const plug = await one('select * from hack_plugs where id = $1', [plugId]);
    if (!plug) {
      return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    }

    const withdrawals = await q(
      "select * from hack_transactions where type = 'withdrawal' order by created_at desc"
    );

    return NextResponse.json({ plug, withdrawals: withdrawals ?? [] });
  } catch (e) {
    console.error('plug snapshot failed', e);
    return NextResponse.json({ error: 'could not load plug' }, { status: 500 });
  }
}
