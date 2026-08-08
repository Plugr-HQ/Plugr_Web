// src/app/app/withdraw/[plugId]/page.tsx
// Plug withdrawal — deducts available, records a PENDING payout (honest: no faked transfer).

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Check } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Label, TextInput, Money, GoldButton, PrimaryButton } from '@/src/components/ui';
import { jsonFetch, naira } from '@/src/lib/net';

export default function AppWithdraw() {
  const { plugId } = useParams<{ plugId: string }>();
  const router = useRouter();
  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jsonFetch(`/api/plugs/${plugId}?source=core`).then((d) => { const a = Number(d.plug?.wallet_balance_available ?? 0); setAvailable(a); setAmount(String(a)); }).catch((e) => setError(e.message));
  }, [plugId]);

  async function withdraw() {
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > available) return setError('Enter an amount within your available balance.');
    setBusy(true);
    try { await jsonFetch(`/api/plugs/${plugId}/withdraw?source=core`, { method: 'POST', body: JSON.stringify({ amount: amt }) }); setDone(true); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <Shell eyebrow="Plug · Withdraw" title="Withdraw to bank" back={`/app/wallet/${plugId}`}>
      {done ? (
        <Card className="p-7 text-center">
          <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-gold/15"><Clock className="w-8 h-8 text-gold" /></span>
          <h3 className="font-display text-2xl text-midnight">Withdrawal processing</h3>
          <p className="mt-2 text-sm text-slate leading-relaxed"><span className="font-bold text-midnight">{naira(amount)}</span> is queued for payout. ALATPay settlements are bank-initiated, so this stays <span className="font-bold text-midnight">pending</span> — we don’t fake a completed transfer.</p>
          <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check className="w-4 h-4" strokeWidth={3} /> Deducted from available balance</div>
          <div className="mt-6"><PrimaryButton onClick={() => router.push(`/app/wallet/${plugId}`)}>Back to wallet</PrimaryButton></div>
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-6"><Label className="mb-2">Available to withdraw</Label><Money amount={available} size="lg" /></Card>
          <div className="mb-6">
            <Label className="mb-2">Amount</Label>
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-gold/90">₦</span><TextInput value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="pl-9 font-display text-xl tnum" /></div>
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <GoldButton onClick={withdraw} loading={busy} disabled={available <= 0}>{busy ? 'Processing…' : `Withdraw ${amount ? naira(amount) : ''}`}</GoldButton>
        </>
      )}
    </Shell>
  );
}
