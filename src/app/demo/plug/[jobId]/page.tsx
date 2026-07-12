// src/app/demo/plug/[jobId]/page.tsx
// Screen 4 — Plug: Accept & complete. Two buttons on one screen. Accept moves the job
// paid_escrow -> accepted; Mark Complete moves accepted -> completed. Then the client
// confirms on Screen 5.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Check, ArrowRight } from 'lucide-react';
import { Shell } from '../../_components/Shell';
import { Card, Divider, Money, StatusChip, PrimaryButton, GoldButton } from '../../_components/ui';
import { jsonFetch } from '../../_lib/demo';

export default function PlugJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const snap = await jsonFetch(`/api/jobs/${jobId}`);
    setJob(snap.job);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function act(path: 'accept' | 'complete') {
    setBusy(true);
    setError(null);
    try {
      await jsonFetch(`/api/jobs/${jobId}/${path}`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const status = job?.status;
  const done = status === 'completed' || status === 'released' || status === 'withdrawn';

  return (
    <Shell eyebrow="Step 4 · Plug" title="Job request" back="/demo/plug">
      {!job && !error && (
        <div className="flex items-center gap-2 text-slate text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <Card className="p-4 mb-6 border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {job && (
        <>
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Job</span>
              <StatusChip status={status} />
            </div>
            <p className="text-midnight font-medium leading-relaxed">{job.job_description || 'Job'}</p>
            <Divider className="my-5" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate">From {job.client_name}</span>
              <Money amount={job.amount} size="md" />
            </div>
          </Card>

          {status === 'paid_escrow' && (
            <GoldButton onClick={() => act('accept')} loading={busy}>
              {busy ? 'Accepting…' : 'Accept job'}
            </GoldButton>
          )}

          {status === 'accepted' && (
            <PrimaryButton onClick={() => act('complete')} loading={busy}>
              {busy ? 'Updating…' : 'Mark as complete'}
            </PrimaryButton>
          )}

          {done && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-emerald-700 font-bold mb-5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-emerald-500/12">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
                Work marked complete
              </div>
              <PrimaryButton onClick={() => router.push(`/demo/confirm/${jobId}`)}>
                Switch to client · confirm <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          )}

          {status === 'requested' && (
            <p className="text-sm text-slate text-center">Waiting for the client to pay into escrow…</p>
          )}
        </>
      )}
    </Shell>
  );
}
