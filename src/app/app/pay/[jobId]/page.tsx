// src/app/app/pay/[jobId]/page.tsx
// Client pays into escrow — real ALATPay virtual account, polled until confirmed.
// Disconnected: after payment the client waits for the Plug (separate tab) to complete,
// then confirms. A sandbox "simulate" affordance is available in test environments.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Copy, Check, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Divider, Money, PrimaryButton, GhostButton } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';

export default function AppPayPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [va, setVa] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [alatState, setAlatState] = useState<'idle' | 'pending' | 'unknown'>('idle');
  const [waited, setWaited] = useState(0);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const snap = await jsonFetch(`/api/jobs/${jobId}?source=core`);
        setJob(snap.job);
        if (snap.job?.status === 'paid_escrow') { setPaid(true); return; }
        const { virtualAccount } = await jsonFetch(`/api/jobs/${jobId}/pay?source=core`, { method: 'POST' });
        setVa(virtualAccount);
      } catch (e: any) { setError(e.message); }
    })();
  }, [jobId]);

  const poll = useCallback(async () => {
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status?source=core`);
      if (res.status === 'paid_escrow') setPaid(true);
      else if (res.alatpay) setAlatState(res.alatpay);
    } catch { /* keep polling */ }
  }, [jobId]);

  useEffect(() => {
    if (paid || !va) return;
    poll(); // check immediately, don't wait 3s for the first poll
    const id = setInterval(poll, 3000);
    const t = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => { clearInterval(id); clearInterval(t); };
  }, [paid, va, poll]);

  function copy() {
    if (!va?.accountNumber) return;
    navigator.clipboard?.writeText(String(va.accountNumber));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  // Manual "I've sent the transfer" — forces an immediate re-query of ALATPay instead of
  // waiting for the next 3s tick, and reports back what ALATPay actually says.
  async function checkNow() {
    if (checking) return;
    setChecking(true); setCheckMsg(null);
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status?source=core`);
      if (res.status === 'paid_escrow') { setPaid(true); return; }
      setAlatState(res.alatpay ?? 'unknown');
      setCheckMsg(
        res.alatpay === 'pending'
          ? 'ALATPay has your transaction but it hasn’t settled yet. We’ll keep checking — this flips on its own.'
          : 'No transfer confirmed yet. Bank transfers can take a minute — we’ll keep checking automatically.'
      );
    } catch {
      setCheckMsg('Couldn’t reach ALATPay just now — we’ll keep retrying.');
    } finally { setChecking(false); }
  }

  async function simulate() {
    if (simulating) return;
    setSimulating(true); setError(null);
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status?simulate=true&source=core`);
      if (res.status === 'paid_escrow') setPaid(true);
    } catch (e: any) { setError(e.message); } finally { setSimulating(false); }
  }

  return (
    <Shell eyebrow="Pay" title="Pay into escrow" back="/app/browse">
      <div className="flex items-start gap-3 rounded-2xl bg-white border border-pitch-black/[0.06] p-4 mb-6 card-shadow">
        <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0"><ShieldCheck className="w-5 h-5 text-gold" /></span>
        <p className="text-[13px] leading-relaxed text-slate"><span className="font-bold text-pitch-black">Escrow protected.</span> ALATPay holds your transfer until you confirm the job is done.</p>
      </div>

      {job && (
        <div className="flex items-baseline justify-between mb-6 px-1">
          <span className="text-sm text-slate">Amount to pay</span>
          <Money amount={job.amount} size="lg" />
        </div>
      )}
      {error && <Card className="p-4 mb-6 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>}

      {paid ? (
        <Card className="p-7 text-center">
          <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></span>
          <h3 className="font-display text-2xl text-pitch-black">Payment confirmed</h3>
          <p className="mt-1.5 text-sm text-slate">Funds held in escrow. The Plug will accept and complete the job — you’ll confirm when it’s done.</p>
          <div className="mt-6 space-y-2">
            <PrimaryButton onClick={() => router.push(`/app/confirm/${jobId}`)}>Track & confirm job <ArrowRight className="w-4 h-4" /></PrimaryButton>
            <GhostButton onClick={() => router.push(`/app/receipt/${jobId}`)}>View receipt</GhostButton>
          </div>
        </Card>
      ) : va ? (
        <Card className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Transfer to this account</p>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-display text-[2rem] leading-none text-pitch-black tnum tracking-wide break-all">{va.accountNumber ?? '—'}</div>
              <div className="mt-2 text-sm text-slate">{va.bankName ?? 'Bank pending'}</div>
            </div>
            <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-pitch-black/10 px-3 py-2 text-[13px] font-bold text-pitch-black hover:border-gold hover:text-gold transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {va.accountName && <p className="mt-3 text-xs text-slate">Account name · {va.accountName}</p>}
          <Divider className="my-5" />
          <div className="flex items-center gap-2.5 text-sm text-pitch-black">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            <span className="font-medium">Waiting for your transfer…</span>
            {alatState === 'pending' && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Monitoring</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate/80">
            ALATPay is watching this account — the moment your transfer settles this flips automatically, no refresh needed.
            {waited > 25 ? ' Bank settlement can take a minute or two.' : ''}
            {waited > 0 ? ` (${waited}s)` : ''}
          </p>

          <button
            onClick={checkNow}
            disabled={checking}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-pill bg-pitch-black text-white font-bold py-3.5 text-sm hover:bg-petrol disabled:opacity-50 transition-colors"
          >
            {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'I’ve sent the transfer'}
          </button>
          {checkMsg && <p className="mt-2 text-xs text-slate leading-relaxed">{checkMsg}</p>}

          <Divider className="my-5" />
          <button onClick={simulate} disabled={simulating} className="w-full inline-flex items-center justify-center gap-2 rounded-pill border border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 disabled:opacity-50 transition-all text-[13px] font-bold text-pitch-black py-3">
            {simulating ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating…</> : 'Sandbox: simulate transfer'}
          </button>
        </Card>
      ) : (
        !error && <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Generating virtual account…</div>
      )}
    </Shell>
  );
}
