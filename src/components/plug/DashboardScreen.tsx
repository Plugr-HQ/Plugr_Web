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
import { Loader2, Clock, Briefcase, ArrowRight, ShieldCheck, Wallet as WalletIcon, LogOut } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, Money } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import { apiFetch } from '@/src/lib/api-client';
import { getPlugId, signOutPlug, getPlugDraft } from '@/src/app/app/_lib/plugAuth';
import { CompleteProfileDialog, profilePromptDismissed } from './CompleteProfileDialog';
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

// --- M1 active job -----------------------------------------------------------------------
// The legacy dashboard payload can't represent an M1 assignment: it maps every job through a
// six-value escrow vocabulary where a PLUG_ASSIGNED job with no escrow collapses to 'requested',
// and its activeJob only accepts paid_escrow/accepted/completed — so a real admin assignment was
// never surfaced here. We read the untouched M1 rows from /api/plug/jobs instead (same bearer-
// forwarding proxy as the rest of /api/plug/jobs/*) and prefer them for the Active job slot.

/** M1 JobStatus values that mean "in flight" — the Plug still has something to do. Mirrors the
 *  job-card's vocabulary; terminal states (COMPLETED/RELEASED/CANCELLED/EXPIRED) are excluded,
 *  as is SEARCHING_PLUG (no longer assigned to this Plug). */
const M1_ACTIVE_STATUSES = new Set([
  'PLUG_ASSIGNED', 'IN_DISCUSSION', 'VISIT_PENDING', 'VISIT_DONE', 'QUOTED', 'QUOTE_ACCEPTED',
  'ESCROW_HELD', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'DISPUTED',
]);

/** Short labels for the chip. The shared JobStatusChip only knows the legacy lowercase set and
 *  would render a raw enum name, so M1 rows get their own labels here (same wording as the card). */
const M1_STATUS_LABEL: Record<string, string> = {
  PLUG_ASSIGNED: 'New assignment', IN_DISCUSSION: 'In discussion', VISIT_PENDING: 'Visit requested',
  VISIT_DONE: 'Visit done', QUOTED: 'Quote sent', QUOTE_ACCEPTED: 'Quote accepted',
  ESCROW_HELD: 'In escrow', EN_ROUTE: 'En route', ARRIVED: 'Arrived', IN_PROGRESS: 'In progress',
  AWAITING_CONFIRM: 'Awaiting confirm', DISPUTED: 'Disputed',
};

function M1StatusChip({ status }: { status: string }) {
  const urgent = status === 'PLUG_ASSIGNED';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]',
        urgent ? 'bg-gold/15 text-[#8a5a08]' : 'bg-emerald-500/12 text-emerald-700',
      )}
    >
      {M1_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function DashboardScreen({ base }: { base: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [m1Job, setM1Job] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  // Seeded from sessionStorage on mount (not in the initializer) so server and first client
  // render agree — reading storage during render is a hydration mismatch.
  const [promptDismissed, setPromptDismissed] = useState(true);

  useEffect(() => {
    setPromptDismissed(profilePromptDismissed());
  }, []);
  const unlocked = useRef(false);

  const plugId = typeof window !== 'undefined' ? getPlugId() : '';

  const load = useCallback(async () => {
    if (!plugId) return;
    try {
      // skipAuthRedirect: we own the recovery below. Letting apiFetch bounce to /login on a
      // 401 only cleared the token, not the plug identity in localStorage — so the entry
      // routing kept sending the user straight back here and re-401'd. That loop is what
      // stranded people on "Session expired" with no way out.
      const body = await apiFetch(withSource(`/api/plugs/${plugId}/dashboard`, base), {}, { skipAuthRedirect: true });
      setData(body);
      setLeft(body.lock?.seconds ?? null);
      setError(null);

      // Real M1 jobs (PLUG_ASSIGNED and onwards) — the legacy payload above can't express them.
      // Non-fatal on its own: a failure here must not blank a dashboard that otherwise loaded, so
      // it only clears the M1 slot and leaves the legacy activeJob fallback in place.
      try {
        const jobs = await apiFetch('/api/plug/jobs', {}, { skipAuthRedirect: true });
        const list: any[] = Array.isArray(jobs) ? jobs : (jobs?.jobs ?? []);
        // Most recently updated in-flight job wins (the backend already scopes to this Plug).
        const active = list
          .filter((j) => M1_ACTIVE_STATUSES.has(j?.status))
          .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())[0] ?? null;
        setM1Job(active);
      } catch {
        setM1Job(null);
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      // Dead/expired session, or a plug that no longer exists — sign out FULLY (clears the
      // plug identity AND the token) so the entry routing stops looping the user back here,
      // then send them to re-authenticate.
      if (/session expired|unauthor|plug not found|\b401\b/i.test(msg)) {
        signOutPlug();
        router.replace(`${base}/auth/login`);
        return;
      }
      setError(msg);
    }
  }, [plugId, base, router]);

  // no session -> sign in (NOT signup: these are existing Plugs whose session lapsed)
  useEffect(() => {
    if (!plugId) router.replace(`${base}/auth/login`);
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
      apiFetch(withSource(`/api/jobs/${jobId}/unlock`, base), { method: 'POST' }, { skipAuthRedirect: true }).finally(load);
    }
  }, [left, data?.lock?.jobId, load, base]);

  if (error) {
    return (
      <PlugShell base={base} plug={null}>
        <Card className="p-4 border-red-200 space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => { signOutPlug(); router.replace(`${base}/auth/login`); }}
            className="inline-flex items-center gap-2 rounded-pill border border-midnight/15 bg-white px-4 py-2 text-[13px] font-bold text-midnight hover:bg-bone transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out &amp; sign in again
          </button>
        </Card>
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
  const pending = !plug.verified; // not yet cleared to receive jobs

  // Two very different situations both look like `verified: false`, and telling a Plug their
  // documents are "under review" when they never submitted any is the kind of wrong that makes
  // people stop trusting the app. Signup (Part A) no longer collects NIN, so:
  //
  //   submitted  -> ops are reviewing. Nothing for them to do but wait.
  //   !submitted -> WE are waiting on THEM. Prompt, and point at the verify screen.
  //
  // The signal is the local onboarding draft, which is where the verify screen records the NIN
  // it submitted. LIMITATION, stated plainly: it's per-device. A Plug who verifies on one phone
  // and signs in on another sees the "finish this" prompt again until ops approve them. Nothing
  // breaks — the prompt is only a nudge, and the server-side gate is unaffected either way — but
  // the durable fix is a `verificationSubmittedAt` column on PlugProfile returned by /dashboard.
  const identitySubmitted = Boolean(getPlugDraft().nin);
  const needsIdentity = pending && !identitySubmitted;
  const available = Number(plug.wallet_balance_available);
  const locked = Number(plug.wallet_balance_locked);
  const counting = left !== null && left > 0;

  return (
    <PlugShell base={base} plug={plug}>
      {/* Hero card -> PLG-02 */}
      <Link href={`${base}/plug/profile`} className="block rise">
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

      {/* The "complete your profile" prompt a Plug lands on straight after signup. A nudge only —
          eligibility is enforced server-side (Plugr_Backend plug-eligibility.ts). */}
      {needsIdentity && !promptDismissed && (
        <CompleteProfileDialog base={base} onClose={() => setPromptDismissed(true)} />
      )}

      {/* Not yet cleared for jobs — two distinct reasons, two honest messages. */}
      {pending && (
        <Card className="mt-4 p-5 rise rise-1">
          <div className="flex items-start gap-3">
            <span className={cn(
              'grid place-items-center h-9 w-9 rounded-full shrink-0',
              needsIdentity ? 'bg-gold/20' : 'bg-slate/15'
            )}>
              <ShieldCheck className={cn('w-5 h-5', needsIdentity ? 'text-gold' : 'text-slate')} />
            </span>
            <div>
              <p className="font-bold text-midnight">
                {needsIdentity ? 'Finish setting up your profile' : 'Under Review'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">
                {needsIdentity ? (
                  <>
                    Verify your identity and you&rsquo;ll start receiving jobs. It takes about two minutes.
                  </>
                ) : (
                  <>
                    Your NIN and face scan are in. Our ops team is confirming your details — you&rsquo;ll start
                    receiving jobs the moment you&rsquo;re approved.
                  </>
                )}
              </p>
              {needsIdentity && (
                <Link
                  href={`${base}/onboarding/verify`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-gold px-4 py-2 text-[13px] font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.98]"
                >
                  Verify my identity <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Earnings — most prominent after the hero */}
      <div className="mt-4 grid grid-cols-2 gap-3 rise rise-2">
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
      <Card className="mt-3 p-4 rise rise-3">
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

      {/* Active job — an M1 assignment takes precedence and routes to the M1 job-card
          (/app/plug-job/[jobId]); the legacy card below is only for pre-M1 escrow-flow jobs and
          still points at the legacy page, which is the only thing that understands them. */}
      {!pending && m1Job && (
        <Link href={`${base}/plug-job/${m1Job.id}`} className="mt-6 block rise rise-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2.5">Active job</p>
          <Card className="p-4 hover:border-gold/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center h-11 w-11 rounded-2xl bg-midnight text-white font-display shrink-0">
                {initials(m1Job.client?.name)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-midnight truncate">{m1Job.title || m1Job.description || 'Job'}</p>
                <p className="text-xs text-slate">{m1Job.client?.name ?? 'Client'}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {m1Job.jobAmount != null && <Money amount={Number(m1Job.jobAmount)} size="sm" />}
                <M1StatusChip status={m1Job.status} />
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Legacy escrow-flow active job (pre-M1 rows only) */}
      {!pending && !m1Job && activeJob && (
        <Link href={`${base}/plug/${activeJob.id}`} className="mt-6 block rise rise-4">
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
        <div className="mt-6 rise rise-4">
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
