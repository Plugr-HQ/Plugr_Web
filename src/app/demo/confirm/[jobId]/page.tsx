// src/app/demo/confirm/[jobId]/page.tsx
// Screen 5 — Client confirms completion. This triggers escrow release: funds move into
// the Plug's LOCKED balance immediately, then a visible 60-second countdown (compressed
// from the real 24hr dispute window) unlocks them to AVAILABLE.
//
// The countdown is UI-driven: when it hits zero the browser calls /api/jobs/[jobId]/unlock
// directly. There is NO server-side timer (Vercel serverless can't persist one).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Shell } from '../../_components/Shell';
import { Card, Divider, Money, PrimaryButton, GhostButton, GoldButton } from '../../_components/ui';
import { jsonFetch } from '../../_lib/demo';

const LOCK_SECONDS = 60;

export default function ConfirmPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [phase, setPhase] = useState<'confirm' | 'counting' | 'done'>('confirm');
  const [remaining, setRemaining] = useState(LOCK_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlockedRef = useRef(false);

  const fireUnlock = useCallback(async () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    try {
      await jsonFetch(`/api/jobs/${jobId}/unlock`, { method: 'POST' });
    } catch {
      /* idempotent server-side; ignore */
    }
    setPhase('done');
  }, [jobId]);

  // Compute countdown from an absolute release timestamp so a page reload resumes correctly.
  const beginCountdown = useCallback((releasedAtIso: string) => {
    const releasedAt = new Date(releasedAtIso).getTime();
    const left = Math.max(0, Math.round((releasedAt + LOCK_SECONDS * 1000 - Date.now()) / 1000));
    setRemaining(left);
    setPhase(left > 0 ? 'counting' : 'done');
    if (left === 0) fireUnlock();
  }, [fireUnlock]);

  useEffect(() => {
    jsonFetch(`/api/jobs/${jobId}`)
      .then((snap) => {
        setJob(snap.job);
        if (snap.job?.status === 'released' && snap.job.escrow_released_at) {
          beginCountdown(snap.job.escrow_released_at);
        }
      })
      .catch((e) => setError(e.message));
  }, [jobId, beginCountdown]);

  useEffect(() => {
    if (phase !== 'counting') return;
    if (remaining <= 0) {
      fireUnlock();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining, fireUnlock]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/release`, { method: 'POST' });
      setRemaining(res.lockSeconds ?? LOCK_SECONDS);
      setPhase('counting');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Ring geometry
  const R = 52;
  const C = 2 * Math.PI * R;
  const progress = phase === 'counting' ? remaining / LOCK_SECONDS : 0;

  return (
    <Shell eyebrow="Step 5 · Confirm" title="Confirm completion" back={`/demo/plug/${jobId}`}>
      {error && (
        <Card className="p-4 mb-6 border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {job && phase === 'confirm' && (
        <Card className="p-6 mb-6">
          <p className="text-midnight font-medium leading-relaxed">{job.job_description || 'Job'}</p>
          <Divider className="my-5" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate">In escrow</span>
            <Money amount={job.amount} size="md" />
          </div>
        </Card>
      )}

      {phase === 'confirm' && (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-white border border-midnight/[0.06] p-4 mb-6 demo-card-shadow">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </span>
            <p className="text-[13px] leading-relaxed text-slate">
              Confirming releases escrow to the Plug. Production opens a 24-hour dispute window —{' '}
              <span className="font-bold text-midnight">compressed to 60 seconds for this demo.</span>
            </p>
          </div>
          <GoldButton onClick={confirm} loading={busy} disabled={!job}>
            {busy ? 'Releasing…' : 'Confirm — job is done'}
          </GoldButton>
        </>
      )}

      {phase === 'counting' && (
        <div className="text-center py-4">
          <div className="relative mx-auto h-32 w-32">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(15,31,61,0.08)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-4xl text-midnight tnum">
              {remaining}
            </span>
          </div>
          <h3 className="mt-6 font-display text-xl text-midnight">Funds locked in the Plug’s wallet</h3>
          <p className="mt-1.5 text-sm text-slate">Releasing to available balance in {remaining}s.</p>
        </div>
      )}

      {phase === 'done' && (
        <Card className="p-7 text-center">
          <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </span>
          <h3 className="font-display text-2xl text-midnight">Funds released</h3>
          <p className="mt-1.5 text-sm text-slate">Now available in the Plug’s wallet.</p>
          <div className="mt-6 space-y-2">
            <PrimaryButton onClick={() => router.push(`/demo/wallet/${job?.plug_id}`)}>
              Open Plug wallet <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
            <GhostButton onClick={() => router.push(`/demo/receipt/${jobId}`)}>View receipt</GhostButton>
          </div>
        </Card>
      )}
    </Shell>
  );
}
