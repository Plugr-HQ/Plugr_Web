// src/app/app/plug/page.tsx
// Plug dashboard — incoming jobs paid into escrow, waiting on the Plug.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Money, StatusChip } from '@/src/app/demo/_components/ui';
import { jsonFetch, getDemoIdentity } from '@/src/app/demo/_lib/demo';

export default function AppPlugHome() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(getDemoIdentity().name || '');
    jsonFetch('/api/jobs?status=paid_escrow,accepted,completed')
      .then((d) => setJobs(d.jobs ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell eyebrow="Plug · Dashboard" title={name ? `Hi, ${name.split(' ')[0]}` : 'Your jobs'} subtitle="Jobs paid into escrow, waiting on you." back="/">
      {loading && <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
      {error && <Card className="p-4 mb-6"><p className="text-sm text-slate">{error}</p></Card>}
      {!loading && !error && jobs.length === 0 && <Card className="p-6 text-center"><p className="text-sm text-slate">No active jobs yet. When a client books & pays, it shows here.</p></Card>}

      <div className="space-y-3 mb-8">
        {jobs.map((job, i) => (
          <Link key={job.id} href={`/app/plug/${job.id}`} className={cn('block group', `demo-rise demo-rise-${Math.min(i + 1, 4)}`)}>
            <Card className="p-4 transition-all group-hover:border-gold/40 group-hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-midnight truncate">{job.job_description || 'Job'}</p>
                  <div className="flex items-center gap-2.5 mt-1.5"><span className="text-xs text-slate">{job.client_name}</span><StatusChip status={job.status} /></div>
                </div>
                <div className="text-right shrink-0"><Money amount={job.amount} size="sm" /><ChevronRight className="w-5 h-5 text-slate/50 group-hover:text-gold transition-colors ml-auto mt-1" /></div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {jobs[0]?.plug_id && (
        <Link href={`/app/wallet/${jobs[0].plug_id}`} className="flex items-center justify-center gap-2 w-full rounded-pill bg-white border border-midnight/10 text-midnight font-bold py-3.5 hover:border-gold transition-colors">
          <Wallet className="w-5 h-5 text-gold" /> Open wallet
        </Link>
      )}
    </Shell>
  );
}
