// src/app/demo/pay/[jobId]/page.tsx
// Screen 3 — Pay into escrow. Generates a REAL ALATPay virtual account for the job
// amount, shows the account to transfer to, then polls /api/jobs/[jobId]/check-status
// (which pulls the transaction status from ALATPay) until it flips to 'paid_escrow'.
// This is the poll-based fallback for the webhook — no fake "mark as paid", the money
// movement is real; we just re-query ALATPay instead of waiting for a pushed webhook.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Copy, Check, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Shell } from '../../_components/Shell';
import { Card, Divider, Money, PrimaryButton, GhostButton } from '../../_components/ui';
import { jsonFetch } from '../../_lib/demo';

export default function PayPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [va, setVa] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  // Generate the virtual account once on mount.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const snap = await jsonFetch(`/api/jobs/${jobId}`);
        setJob(snap.job);
        if (snap.job?.status === 'paid_escrow') {
          setPaid(true);
          return;
        }
        const { virtualAccount } = await jsonFetch(`/api/jobs/${jobId}/pay`, { method: 'POST' });
        setVa(virtualAccount);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [jobId]);

  // Poll ALATPay (via check-status) to confirm payment — the webhook fallback.
  const poll = useCallback(async () => {
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/check-status`);
      if (res.status === 'paid_escrow') setPaid(true);
    } catch {
      /* transient — keep polling */
    }
  }, [jobId]);

  // Start polling only once the virtual account has rendered; stop as soon as it's paid.
  useEffect(() => {
    if (paid || !va) return;
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [paid, va, poll]);

  function copy() {
    if (!va?.accountNumber) return;
    navigator.clipboard?.writeText(String(va.accountNumber));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Shell eyebrow="Step 3 · Pay" title="Pay into escrow" back="/demo/browse">
      {/* Escrow trust banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-white border border-midnight/[0.06] p-4 mb-6 demo-card-shadow">
        <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0">
          <ShieldCheck className="w-5 h-5 text-gold" />
        </span>
        <p className="text-[13px] leading-relaxed text-slate">
          <span className="font-bold text-midnight">Escrow protected.</span> ALATPay holds your transfer — it’s only
          released to the Plug when you confirm the job is done.
        </p>
      </div>

      {job && (
        <div className="flex items-baseline justify-between mb-6 px-1">
          <span className="text-sm text-slate">Amount to pay</span>
          <Money amount={job.amount} size="lg" />
        </div>
      )}

      {error && (
        <Card className="p-4 mb-6 border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {paid ? (
        <Card className="p-7 text-center">
          <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </span>
          <h3 className="font-display text-2xl text-midnight">Payment confirmed</h3>
          <p className="mt-1.5 text-sm text-slate">Funds are safely held in escrow.</p>
          <div className="mt-6 space-y-2">
            <PrimaryButton onClick={() => router.push(`/demo/plug/${jobId}`)}>
              Switch to Plug view <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
            <GhostButton onClick={() => router.push(`/demo/receipt/${jobId}`)}>View receipt</GhostButton>
          </div>
        </Card>
      ) : va ? (
        <Card className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Transfer to this account</p>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-display text-[2rem] leading-none text-midnight tnum tracking-wide break-all">
                {va.accountNumber ?? '—'}
              </div>
              <div className="mt-2 text-sm text-slate">{va.bankName ?? 'Bank pending'}</div>
            </div>
            <button
              onClick={copy}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-midnight/10 px-3 py-2 text-[13px] font-bold text-midnight hover:border-gold hover:text-gold transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {va.accountName && <p className="mt-3 text-xs text-slate">Account name · {va.accountName}</p>}

          <Divider className="my-5" />

          <div className="flex items-center gap-2.5 text-sm text-midnight">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            <span className="font-medium">Waiting for your transfer…</span>
          </div>
          <p className="mt-2 text-xs text-slate/80">
            We’re polling ALATPay every 3s — this flips on its own. Account valid 24h; on stage, pay from the pre-funded
            test account.
          </p>
        </Card>
      ) : (
        !error && (
          <div className="flex items-center gap-2 text-slate text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Generating virtual account…
          </div>
        )
      )}
    </Shell>
  );
}
