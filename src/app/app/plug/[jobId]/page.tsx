// src/app/app/plug/[jobId]/page.tsx
// Plug accepts & completes a job. Disconnected: after completing, the Plug waits for the
// client (their own tab) to confirm — no cross-navigation into the client side.

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Check, Wallet } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Divider, Money, StatusChip, PrimaryButton, GoldButton } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';

export default function AppPlugJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const snap = await jsonFetch(`/api/jobs/${jobId}?source=core`);
    setJob(snap.job);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(path: 'accept' | 'complete') {
    setBusy(true); setError(null);
    try { await jsonFetch(`/api/jobs/${jobId}/${path}?source=core`, { method: 'POST' }); await load(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const status = job?.status;
  const doneWork = status === 'completed' || status === 'released' || status === 'withdrawn';

  return (
    <Shell eyebrow="Plug · Job" title="Job request" back="/app/plug">
      {!job && !error && <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
      {error && <Card className="p-4 mb-6 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>}

      {job && (
        <>
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4"><span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Job</span><StatusChip status={status} /></div>
            <p className="text-midnight font-medium leading-relaxed">{job.job_description || 'Job'}</p>
            <Divider className="my-5" />
            <div className="flex items-center justify-between"><span className="text-sm text-slate">From {job.client_name}</span><Money amount={job.amount} size="md" /></div>
          </Card>

          {status === 'paid_escrow' && <GoldButton onClick={() => act('accept')} loading={busy}>{busy ? 'Accepting…' : 'Accept job'}</GoldButton>}
          {status === 'accepted' && <PrimaryButton onClick={() => act('complete')} loading={busy}>{busy ? 'Updating…' : 'Mark as complete'}</PrimaryButton>}

          {doneWork && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-emerald-700 font-bold mb-5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-emerald-500/12"><Check className="w-4 h-4" strokeWidth={3} /></span>
                {status === 'completed' ? 'Marked complete — waiting for client to confirm' : 'Escrow released'}
              </div>
              <Link href={`/app/wallet/${job.plug_id}`}><PrimaryButton><Wallet className="w-4 h-4" /> Open my wallet</PrimaryButton></Link>
            </div>
          )}

          {status === 'requested' && <p className="text-sm text-slate text-center">Waiting for the client to pay into escrow…</p>}
        </>
      )}
    </Shell>
  );
}
