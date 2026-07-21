// src/app/app/receipt/[jobId]/page.tsx
// Client receipt — full escrow audit trail.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Divider, Money, StatusChip, StatusRail, PrimaryButton, PlugrWordmark, type RailStep } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : null);

export default function AppReceiptPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { jsonFetch(`/api/jobs/${jobId}?source=core`).then(setData).catch((e) => setError(e.message)); }, [jobId]);

  if (error) return <Shell title="Receipt" back="/app/browse"><Card className="p-4 border-red-200"><p className="text-sm text-red-600">{error}</p></Card></Shell>;
  if (!data) return <Shell title="Receipt" back="/app/browse"><div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div></Shell>;

  const { job, plug, transactions } = data;
  const collection = transactions?.find((t: any) => t.type === 'collection' && t.status === 'successful') ?? transactions?.find((t: any) => t.type === 'collection');
  const withdrawal = transactions?.find((t: any) => t.type === 'withdrawal');

  const steps: (RailStep & { done: boolean })[] = [
    { key: 'req', label: 'Job requested', sub: fmt(job.created_at), done: true },
    { key: 'esc', label: 'Paid into escrow · ALATPay', sub: collection?.status === 'successful' ? fmt(collection.created_at) : 'Pending', done: collection?.status === 'successful' },
    { key: 'cmp', label: 'Marked complete', sub: fmt(job.completed_at) ?? 'Pending', done: !!job.completed_at },
    { key: 'rel', label: 'Escrow released', sub: fmt(job.escrow_released_at) ?? 'Pending', done: !!job.escrow_released_at },
    { key: 'wd', label: 'Withdrawal to bank', sub: withdrawal ? `${fmt(withdrawal.created_at)} · ${withdrawal.status}` : 'Not yet', done: !!withdrawal },
  ];
  const activeIndex = steps.findIndex((s) => !s.done);

  return (
    <Shell eyebrow="Receipt" title="Transaction receipt" subtitle={`Job ${String(job.id).slice(0, 8)}…`} back="/app/browse">
      <div className="relative">
        <Card className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6"><PlugrWordmark className="h-5 text-midnight" /><StatusChip status={job.status} /></div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Total</p>
          <div className="mt-1"><Money amount={job.amount} size="xl" /></div>
          <Divider className="my-6" />
          <div className="grid grid-cols-2 gap-5">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-1">Plug</p><p className="font-bold text-midnight">{plug?.name ?? '—'}</p><p className="text-xs text-slate capitalize">{plug?.trade}</p></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-1">Client</p><p className="font-bold text-midnight">{job.client_name}</p><p className="text-xs text-slate">{job.client_phone || '—'}</p></div>
          </div>
          <Divider className="my-6" />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-3">ALATPay reference</p>
          <div className="space-y-2">
            <RefRow label="Virtual account" value={collection?.alatpay_virtual_account} />
            <RefRow label="Transaction ID" value={collection?.alatpay_transaction_id} />
            <RefRow label="Order ID" value={job.id} mono />
          </div>
        </Card>
        <span className="absolute -left-2 bottom-16 h-4 w-4 rounded-full bg-bone" />
        <span className="absolute -right-2 bottom-16 h-4 w-4 rounded-full bg-bone" />
      </div>

      <Card className="p-6 mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-5">Escrow trail</p>
        <StatusRail steps={steps} activeIndex={activeIndex === -1 ? steps.length : activeIndex} />
        <div className="mt-4 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold" /><span className="text-[11px] text-slate">Gold marks real ALATPay money movement.</span></div>
      </Card>

      <div className="mt-6"><PrimaryButton onClick={() => router.push('/app/browse')}>Book another Plug</PrimaryButton></div>
    </Shell>
  );
}

function RefRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate shrink-0">{label}</span>
      <span className={'text-xs text-midnight text-right break-all ' + (mono ? 'font-mono' : 'font-semibold tnum')}>{value || '—'}</span>
    </div>
  );
}
