// src/app/app/wallet/[plugId]/page.tsx
// Plug wallet — available vs locked, polled live.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, Clock, Wallet as WalletIcon } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Money, GoldButton } from '@/src/components/ui';
import { jsonFetch, naira } from '@/src/lib/net';

export default function AppWallet() {
  const { plugId } = useParams<{ plugId: string }>();
  const router = useRouter();
  const [plug, setPlug] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await jsonFetch(`/api/plugs/${plugId}?source=core`); setPlug(d.plug); setWithdrawals(d.withdrawals ?? []); }
    catch (e: any) { setError(e.message); }
  }, [plugId]);

  useEffect(() => { load(); const id = setInterval(load, 3000); return () => clearInterval(id); }, [load]);

  const available = Number(plug?.wallet_balance_available ?? 0);
  const locked = Number(plug?.wallet_balance_locked ?? 0);

  return (
    <Shell eyebrow="Plug · Wallet" title={plug?.name ? `${plug.name.split(' ')[0]}’s wallet` : 'Wallet'} back="/app/plug">
      {error && <Card className="p-4 mb-6"><p className="text-sm text-slate">{error}</p></Card>}

      <Card className="relative overflow-hidden p-6 mb-4">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
        <div className="flex items-center gap-2 text-slate mb-3"><span className="grid place-items-center h-7 w-7 rounded-full bg-gold/15"><WalletIcon className="w-4 h-4 text-gold" /></span><span className="text-[11px] font-bold uppercase tracking-[0.14em]">Total balance</span></div>
        <Money amount={available + locked} size="xl" />
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4"><div className="flex items-center gap-1.5 text-xs text-slate mb-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Available</div><Money amount={available} size="md" /></Card>
        <Card className="p-4"><div className="flex items-center gap-1.5 text-xs text-slate mb-2"><Lock className="w-3.5 h-3.5 text-gold" /> Locked</div><Money amount={locked} size="md" /></Card>
      </div>

      {locked > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-gold/[0.08] border border-gold/20 p-4 mb-6"><Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" /><p className="text-[13px] text-midnight leading-relaxed">Locked earnings release to Available after the dispute window — <span className="font-bold">60s during early access.</span></p></div>
      )}

      <div className="mb-8"><GoldButton onClick={() => router.push(`/app/withdraw/${plugId}`)} disabled={available <= 0}>Withdraw to bank</GoldButton></div>

      {withdrawals.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-3">Withdrawals</p>
          <div className="space-y-2.5">
            {withdrawals.map((w) => (
              <Card key={w.id} className="p-4 flex items-center justify-between">
                <div><div className="font-display text-midnight tnum">{naira(w.amount)}</div><div className="text-[11px] text-slate mt-0.5">{new Date(w.created_at).toLocaleString()}</div></div>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold/15 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8a5a08]"><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{w.status}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
