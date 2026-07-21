// src/app/api/plugs/[plugId]/dashboard/route.ts
// GET — everything PLG-01 (Home) and PLG-03 (Wallet) need in one call:
//   plug, earnings (week / month / all), active job, recent jobs, wallet lock state.
//
// Earnings count a job once escrow is released to the Plug (status 'released'), which is the
// point the money is actually theirs. Locked vs available comes from the wallet columns.
//
// Lock window: the demo compresses the real ~24h dispute hold to 60s (established earlier),
// measured from escrow_released_at.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

const LOCK_SECONDS = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  const repo = getRepo(resolveSource(request));

  try {
    const plug = await repo.getPlug(plugId);
    if (!plug) return NextResponse.json({ error: 'plug not found' }, { status: 404 });

    const jobs = await repo.jobsForPlug(plugId);

    const earned = jobs.filter((j) => j.status === 'released' || j.status === 'withdrawn');
    const since = (days: number) => Date.now() - days * 864e5;
    const sum = (rows: typeof jobs) => rows.reduce((t, j) => t + Number(j.amount || 0), 0);

    const earnings = {
      week: sum(earned.filter((j) => new Date(j.escrow_released_at ?? j.created_at).getTime() >= since(7))),
      month: sum(earned.filter((j) => new Date(j.escrow_released_at ?? j.created_at).getTime() >= since(30))),
      total: sum(earned),
    };

    // "In progress" = paid into escrow and not yet released.
    const activeJob =
      jobs.find((j) => ['paid_escrow', 'accepted', 'completed'].includes(j.status)) ?? null;

    // Countdown until the locked balance frees up (drives PLG-01/PLG-03 lock states).
    const lastReleased = jobs.find((j) => j.status === 'released' && j.escrow_released_at);
    let unlocksInSeconds: number | null = null;
    if (Number(plug.wallet_balance_locked) > 0 && lastReleased?.escrow_released_at) {
      const readyAt = new Date(lastReleased.escrow_released_at).getTime() + LOCK_SECONDS * 1000;
      unlocksInSeconds = Math.max(0, Math.round((readyAt - Date.now()) / 1000));
    }

    const withdrawals = await repo.listWithdrawals(20);

    return NextResponse.json({
      plug,
      earnings,
      activeJob,
      recentJobs: jobs.slice(0, 3),
      allJobs: jobs,
      withdrawals: withdrawals ?? [],
      lock: { seconds: unlocksInSeconds, lockSeconds: LOCK_SECONDS, jobId: lastReleased?.id ?? null },
    });
  } catch (e) {
    console.error('plug dashboard failed', e);
    return NextResponse.json({ error: 'could not load dashboard' }, { status: 500 });
  }
}
