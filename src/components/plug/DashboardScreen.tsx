// src/components/plug/DashboardScreen.tsx
// PLG-01 — Plug Home / Dashboard. Command centre: verification status, earnings, wallet,
// active job, recent jobs.
//
// States: Pending Review (locked, zeroed) · Verified no jobs (empty) · Verified active job
// · Verified jobs done · Wallet lock active (live countdown on the withdraw button).
//
// The lock countdown is UI-driven: when it hits zero the browser calls /unlock, same as the
// client-side confirm screen — Vercel functions can't hold a timer.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Clock, Briefcase, ArrowRight, ShieldCheck, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, Money } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';
import { getPlugId, signOutPlug } from '@/src/app/app/_lib/plugAuth';
import { PlugShell, BadgeChip, JobStatusChip, EmptyState, plugTier } from './PlugChrome';
import { withSource } from '@/src/lib/apiSource';
import { authHeaders } from '@/src/lib/api';

function hhmm(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function DashboardScreen({ base }: { base: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const unlocked = useRef(false);

  const plugId = typeof window !== 'undefined' ? getPlugId() : '';

  const load = useCallback(async () => {
    if (!plugId) return;
    try {
      // jsonFetch tolerates non-JSON responses instead of throwing a raw parse error
      const body = await jsonFetch(withSource(`/api/plugs/${plugId}/dashboard`, base));
      setData(body);
      setLeft(body.lock?.seconds ?? null);
      setError(null);
    } catch (e: any) {
      // Stale session (plug no longer exists) — sign out rather than stranding the user
      // on a dead error card they can't leave.
      if (/plug not found/i.test(e?.message ?? '')) {
        signOutPlug();
        router.replace(`${base}/auth/phone`);
        return;
      }
      setError(e.message);
    }
  }, [plugId, base, router]);

  // no session -> back to phone auth
  useEffect(() => {
    if (!plugId) router.replace(`${base}/auth/phone`);
  }, [plugId, base, router]);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  // wallet lock countdown -> calls /unlock at zero
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    const jobId = data?.lock?.jobId;
    if (left === 0 && jobId && !unlocked.current) {
      unlocked.current = true;
      fetch(withSource(`/api/jobs/${jobId}/unlock`, base), { method: 'POST' }).finally(load);
    }
  }, [left, data?.lock?.jobId, load, base]);

  if (error) {
    return (
      <PlugShell base={base} plug={null}>
        <Card className="p-4 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>
      </PlugShell>
    );
  }

  if (!data) {
    return (
      <PlugShell base={base} plug={null}>
        <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      </PlugShell>
    );
  }

  const { plug, earnings, activeJob, recentJobs, lock } = data;
  const tier = plugTier(plug);
  const pending = !plug.verified; // Pending Review
  const available = Number(plug.wallet_balance_available);
  const locked = Number(plug.wallet_balance_locked);
  const counting = left !== null && left > 0;

  async function simulateApproval() {
    setApproving(true);
    try {
      // NOTE: verification is now the ADMIN-only /verification route on the backend. This
      // plug-side "simulate approval" shortcut will 403 for a PLUG — it stays here only so the
      // call targets the correct split endpoint, not the removed combined PATCH. Real approval
      // belongs to the admin verifications UI (currently a mock). See the token/guards report.
      await fetch(withSource(`/api/plugs/${plug.id}/verification`, base), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ verified: true }),
      });
      await load();
    } finally {
      setApproving(false);
    }
  }

  return (
    <PlugShell base={base} plug={plug}>
      {/* Hero card -> PLG-02 */}
      <Link href={`${base}/plug/profile`} className="block demo-rise">
        <div className="relative overflow-hidden rounded-[22px] bg-midnight p-5">
          <div className="flex items-center gap-4">
            {plug.photo_url ? (
              <img src={plug.photo_url} alt="" className="h-14 w-14 rounded-2xl object-cover shrink-0" />
            ) : (
              <span className="grid place-items-center h-14 w-14 rounded-2xl bg-gold text-midnight font-display text-xl shrink-0">
                {String(plug.name)[0]}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl text-white truncate">{plug.name}</h1>
              <p className="text-sm text-steel-blue capitalize">{plug.trade}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <BadgeChip tier={tier} />
              <ArrowRight className="w-4 h-4 text-steel-blue" />
            </div>
          </div>
        </div>
      </Link>

      {/* Pending Review — features locked */}
      {pending && (
        <Card className="mt-4 p-5 demo-rise demo-rise-1">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-slate/15 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate" />
            </span>
            <div>
              <p className="font-bold text-midnight">Under Review</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">
                Your NIN and face scan are in. Our ops team is confirming your details — you’ll start receiving jobs the
                moment you’re approved.
              </p>
            </div>
          </div>
          <button
            onClick={simulateApproval}
            disabled={approving}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-pill border border-dashed border-gold/40 py-3 text-[13px] font-bold text-midnight hover:border-gold hover:bg-gold/5 disabled:opacity-50 transition-all"
          >
            {approving ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</> : 'Demo: simulate ops approval'}
          </button>
        </Card>
      )}

      {/* Earnings — most prominent after the hero */}
      <div className="mt-4 grid grid-cols-2 gap-3 demo-rise demo-rise-2">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2">This week</p>
          <Money amount={pending ? 0 : earnings.week} size="md" />
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2">Total</p>
          <Money amount={pending ? 0 : earnings.total} size="md" />
        </Card>
      </div>

      {/* Wallet row -> PLG-03 */}
      <Card className="mt-3 p-4 demo-rise demo-rise-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-1.5">
              <WalletIcon className="w-3.5 h-3.5 text-gold" /> Wallet
            </div>
            <Money amount={pending ? 0 : available} size="md" />
            {locked > 0 && !pending && (
              <p className="mt-1 text-[11px] text-slate">
                <span className="tnum font-semibold text-midnight">₦{locked.toLocaleString('en-NG')}</span> locked
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <button
              onClick={() => router.push(`${base}/plug/wallet`)}
              disabled={pending}
              className={cn(
                'rounded-pill px-4 py-2.5 text-[13px] font-bold transition-colors',
                pending ? 'bg-slate/20 text-slate' : 'bg-gold text-midnight hover:bg-gold-light'
              )}
            >
              Withdraw
            </button>
            {counting && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate">
                <Clock className="w-3 h-3" /> Unlocks in <span className="tnum font-semibold">{hhmm(left!)}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Active job */}
      {!pending && activeJob && (
        <Link href={`${base}/plug/${activeJob.id}`} className="mt-6 block demo-rise demo-rise-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2.5">Active job</p>
          <Card className="p-4 hover:border-gold/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center h-11 w-11 rounded-2xl bg-midnight text-white font-display shrink-0">
                {initials(activeJob.client_name)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-midnight truncate">{activeJob.job_description || 'Job'}</p>
                <p className="text-xs text-slate">{activeJob.client_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Money amount={activeJob.amount} size="sm" />
                <JobStatusChip status={activeJob.status} />
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Recent jobs */}
      {!pending && (
        <div className="mt-6 demo-rise demo-rise-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Recent jobs</p>
            {recentJobs.length > 0 && (
              <Link href={`${base}/plug/wallet`} className="text-[11px] font-bold text-gold hover:text-midnight transition-colors">
                See all
              </Link>
            )}
          </div>

          {recentJobs.length === 0 ? (
            <Card className="p-2">
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="Your first job will appear here"
                body="Once a client books you, the job shows up here and the money lands in your wallet."
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {recentJobs.map((j: any) => (
                <Card key={j.id} className="p-4 flex items-center gap-3">
                  <span className="grid place-items-center h-10 w-10 rounded-xl bg-midnight/[0.04] text-midnight text-xs font-bold shrink-0">
                    {initials(j.client_name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-midnight truncate">{j.job_description || 'Job'}</p>
                    <p className="text-[11px] text-slate">{new Date(j.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Money amount={j.amount} size="sm" />
                    <JobStatusChip status={j.status} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </PlugShell>
  );
}

function initials(name?: string) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}
