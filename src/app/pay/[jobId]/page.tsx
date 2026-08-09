// src/app/pay/[jobId]/page.tsx
// Public, login-free escrow payment page — the target of the WhatsApp pay-link. A client who
// booked through the bot lands here, confirms the agreed amount (bot-booked jobs carry no
// price), and pays into a real ALATPay virtual account. Reuses the same /pay + /check-status
// endpoints and webhook as the in-app flow; nothing here needs an app session.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Copy, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { PlugrWordmark, Card, Divider, Money, GoldButton, TextInput, Label } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';

export default function GuestPayPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [plug, setPlug] = useState<any>(null);
  const [va, setVa] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [waited, setWaited] = useState(0);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const loaded = useRef(false);

  const startPayment = useCallback(async (amount?: number) => {
    setStarting(true);
    setError(null);
    try {
      const body = amount && amount > 0 ? JSON.stringify({ amount }) : undefined;
      const { virtualAccount } = await jsonFetch(`/api/jobs/${jobId}/pay?source=core`, {
        method: 'POST',
        ...(body ? { body } : {}),
      });
      setVa(virtualAccount);
    } catch (e: any) {
      setError(e?.message ?? 'Could not start payment.');
    } finally {
      setStarting(false);
    }
  }, [jobId]);

  // Load the job. If it already carries an amount (or is already paid), act immediately;
  // otherwise wait for the client to confirm the agreed amount.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const snap = await jsonFetch(`/api/jobs/${jobId}?source=core`);
        setJob(snap.job);
        setPlug(snap.plug);
        if (snap.job?.status === 'paid_escrow') { setPaid(true); return; }
        if (Number(snap.job?.amount) > 0) startPayment(Number(snap.job.amount));
      } catch (e: any) {
        setError(e?.message ?? 'Could not load this job.');
      }
    })();
  }, [jobId, startPayment]);

  const poll = useCallback(async () => {
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status?source=core`);
      if (res.status === 'paid_escrow') setPaid(true);
    } catch { /* keep polling */ }
  }, [jobId]);

  useEffect(() => {
    if (paid || !va) return;
    poll();
    const id = setInterval(poll, 3000);
    const t = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => { clearInterval(id); clearInterval(t); };
  }, [paid, va, poll]);

  function copy() {
    if (!va?.accountNumber) return;
    navigator.clipboard?.writeText(String(va.accountNumber));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  async function checkNow() {
    if (checking) return;
    setChecking(true); setCheckMsg(null);
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status?source=core`);
      if (res.status === 'paid_escrow') { setPaid(true); return; }
      setCheckMsg('No transfer confirmed yet. Bank transfers can take a minute — we’ll keep checking automatically.');
    } catch {
      setCheckMsg('Couldn’t reach the payment provider just now — we’ll keep retrying.');
    } finally { setChecking(false); }
  }

  const amountNum = Math.round(Number(amountInput.replace(/[^\d]/g, '')) || 0);
  const needsAmount = !va && !paid && !!job && !(Number(job?.amount) > 0);

  return (
    <main className="min-h-screen bg-bone text-midnight font-body antialiased flex justify-center">
      <div className="w-full max-w-110 min-h-screen flex flex-col px-6 pt-10 pb-12">
        <a href="/" className="mx-auto"><PlugrWordmark className="h-7 text-midnight" /></a>

        <div className="mt-10">
          <div className="flex items-start gap-3 rounded-2xl bg-white border border-midnight/[0.06] p-4 mb-6 card-shadow">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0"><ShieldCheck className="w-5 h-5 text-gold" /></span>
            <p className="text-[13px] leading-relaxed text-slate"><span className="font-bold text-midnight">Escrow protected.</span> Your transfer is held securely and only released to the artisan once you confirm the job is done.</p>
          </div>

          {plug?.name && (
            <div className="flex items-center justify-between mb-6 px-1">
              <span className="text-sm text-slate">Booking</span>
              <span className="text-sm font-bold text-midnight capitalize">{plug.name}{plug.trade ? ` · ${plug.trade}` : ''}</span>
            </div>
          )}

          {error && <Card className="p-4 mb-6 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>}

          {paid ? (
            <Card className="p-7 text-center">
              <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></span>
              <h3 className="font-display text-2xl text-midnight">Payment confirmed</h3>
              <p className="mt-1.5 text-sm text-slate">Your funds are held safely in escrow. We’ve notified your artisan — you can head back to WhatsApp to coordinate the job.</p>
            </Card>
          ) : needsAmount ? (
            <Card className="p-6">
              <Label className="mb-2">Agreed amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate font-bold">₦</span>
                <TextInput
                  value={amountInput ? Number(amountNum).toLocaleString('en-NG') : ''}
                  onChange={(e) => setAmountInput(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  autoFocus
                  className="pl-8 tnum text-lg"
                />
              </div>
              <p className="mt-2 text-xs text-slate/80">Enter the amount you agreed with your artisan. It’s held in escrow — not released until you confirm the job.</p>
              <GoldButton className="mt-5" disabled={amountNum < 100 || starting} onClick={() => startPayment(amountNum)}>
                {starting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</> : 'Continue to payment'}
              </GoldButton>
            </Card>
          ) : va ? (
            <Card className="p-6">
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-sm text-slate">Amount</span>
                <Money amount={job?.amount} size="md" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Transfer to this account</p>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-display text-[2rem] leading-none text-midnight tnum tracking-wide break-all">{va.accountNumber ?? '—'}</div>
                  <div className="mt-2 text-sm text-slate">{va.bankName ?? 'Bank pending'}</div>
                </div>
                <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-midnight/10 px-3 py-2 text-[13px] font-bold text-midnight hover:border-gold hover:text-gold transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {va.accountName && <p className="mt-3 text-xs text-slate">Account name · {va.accountName}</p>}
              <Divider className="my-5" />
              <div className="flex items-center gap-2.5 text-sm text-midnight">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span className="font-medium">Waiting for your transfer…</span>
              </div>
              <p className="mt-2 text-xs text-slate/80">
                The moment your transfer settles this flips automatically, no refresh needed.
                {waited > 25 ? ' Bank settlement can take a minute or two.' : ''}
                {waited > 0 ? ` (${waited}s)` : ''}
              </p>
              <button
                onClick={checkNow}
                disabled={checking}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-pill bg-midnight text-white font-bold py-3.5 text-sm hover:bg-deep-blue disabled:opacity-50 transition-colors"
              >
                {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'I’ve sent the transfer'}
              </button>
              {checkMsg && <p className="mt-2 text-xs text-slate leading-relaxed">{checkMsg}</p>}
            </Card>
          ) : (
            !error && <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          )}
        </div>
      </div>
    </main>
  );
}
