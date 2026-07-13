// src/app/app/confirm/[jobId]/page.tsx
// Client confirms completion -> escrow release + 60s UI countdown -> unlock. Disconnected:
// ends at the client receipt (the Plug sees the funds in their own tab).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Divider, Money, GoldButton, GhostButton } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';

const LOCK_SECONDS = 60;

export default function AppConfirmPage() {
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
    try { await jsonFetch(`/api/jobs/${jobId}/unlock`, { method: 'POST' }); } catch {}
    setPhase('done');
  }, [jobId]);

  const beginCountdown = useCallback((releasedAtIso: string) => {
    const releasedAt = new Date(releasedAtIso).getTime();
    const left = Math.max(0, Math.round((releasedAt + LOCK_SECONDS * 1000 - Date.now()) / 1000));
    setRemaining(left);
    setPhase(left > 0 ? 'counting' : 'done');
    if (left === 0) fireUnlock();
  }, [fireUnlock]);

  useEffect(() => {
    jsonFetch(`/api/jobs/${jobId}`).then((snap) => {
      setJob(snap.job);
      if (snap.job?.status === 'released' && snap.job.escrow_released_at) beginCountdown(snap.job.escrow_released_at);
    }).catch((e) => setError(e.message));
  }, [jobId, beginCountdown]);

  useEffect(() => {
    if (phase !== 'counting') return;
    if (remaining <= 0) { fireUnlock(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining, fireUnlock]);

  async function confirm() {
    setBusy(true); setError(null);
    try {
      const res = await jsonFetch(`/api/jobs/${jobId}/release`, { method: 'POST' });
      setRemaining(res.lockSeconds ?? LOCK_SECONDS);
      setPhase('counting');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const R = 52, C = 2 * Math.PI * R;
  const progress = phase === 'counting' ? remaining / LOCK_SECONDS : 0;

  return (
    <Shell eyebrow="Confirm" title="Confirm completion" back={`/app/pay/${jobId}`}>
      {error && <Card className="p-4 mb-6 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>}

      {job && phase === 'confirm' && (
        <Card className="p-6 mb-6">
          <p className="text-midnight font-medium leading-relaxed">{job.job_description || 'Job'}</p>
          <Divider className="my-5" />
          <div className="flex items-center justify-between"><span className="text-sm text-slate">In escrow</span><Money amount={job.amount} size="md" /></div>
        </Card>
      )}

      {phase === 'confirm' && (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-white border border-midnight/[0.06] p-4 mb-6 demo-card-shadow">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0"><ShieldCheck className="w-5 h-5 text-gold" /></span>
            <p className="text-[13px] leading-relaxed text-slate">Only confirm once the Plug has completed the work. Production opens a 24-hour dispute window — <span className="font-bold text-midnight">compressed to 60 seconds here.</span></p>
          </div>
          <GoldButton onClick={confirm} loading={busy} disabled={!job}>{busy ? 'Releasing…' : 'Confirm — job is done'}</GoldButton>
        </>
      )}

      {phase === 'counting' && (
        <div className="text-center py-4">
          <div className="relative mx-auto h-32 w-32">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(15,31,61,0.08)" strokeWidth="8" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-gold)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-4xl text-midnight tnum">{remaining}</span>
          </div>
          <h3 className="mt-6 font-display text-xl text-midnight">Releasing to the Plug’s wallet</h3>
          <p className="mt-1.5 text-sm text-slate">Available in {remaining}s.</p>
        </div>
      )}

      {phase === 'done' && (
        <Card className="p-7 text-center">
          <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></span>
          <h3 className="font-display text-2xl text-midnight">Job complete</h3>
          <p className="mt-1.5 text-sm text-slate">Escrow released. Thanks for using Plugr.</p>
          <div className="mt-6 space-y-2">
            <PrimaryButtonLink href={`/app/receipt/${jobId}`} router={router} label="View receipt" />
            <GhostButton onClick={() => router.push('/app/browse')}>Book another Plug</GhostButton>
          </div>
        </Card>
      )}
    </Shell>
  );
}

function PrimaryButtonLink({ href, router, label }: { href: string; router: ReturnType<typeof useRouter>; label: string }) {
  return <GoldButton onClick={() => router.push(href)}>{label} <ArrowRight className="w-4 h-4" /></GoldButton>;
}
