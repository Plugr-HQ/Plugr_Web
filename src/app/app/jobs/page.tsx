// src/app/app/jobs/page.tsx
// "My Jobs" — a logged-in client's job history. Calls the real backend (GET /jobs) via
// src/lib/api.ts, which carries the stored access token; the backend scopes the result to
// req.user itself (JobsController -> findUserJobs), so no clientId/phone is passed here.
//
// Requires a real login (api.auth.login / accessToken in localStorage) — there is no offline
// fallback on this screen.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Money } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { api, getToken } from '@/src/lib/api';
import { JobListSkeleton } from '@/src/components/Skeleton';

type Job = {
  id: string;
  status: string;
  title: string;
  description?: string | null;
  address?: string | null;
  price?: number | null;
  escrowAmount?: number | null;
  createdAt: string;
  category?: { name?: string; code?: string } | null;
  plug?: { user?: { name?: string } } | null;
};

// JobStatus enum values as they come off the backend (job-state-machine.ts).
const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', cls: 'bg-slate/15 text-slate', icon: Clock },
  SEARCHING_PLUG: { label: 'Finding a Plug', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  PLUG_ASSIGNED: { label: 'Plug Assigned', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  CLIENT_ACCEPTED: { label: 'Accepted', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  PLUG_ACCEPTED: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

const ACTIVE = new Set(['PENDING', 'SEARCHING_PLUG', 'PLUG_ASSIGNED', 'CLIENT_ACCEPTED', 'PLUG_ACCEPTED', 'IN_PROGRESS']);

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-slate/15 text-slate', icon: Clock };
  const Icon = meta.icon;
  return (
    <div className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase', meta.cls)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </div>
  );
}

export default function MyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/app/auth/login');
      return;
    }
    api.jobs
      .getAll()
      .then((data) => setJobs(data.jobs ?? data))
      .catch((e) => setError(e?.message ?? 'Could not load your jobs.'));
  }, [router]);

  const active = jobs?.filter((j) => ACTIVE.has(j.status)) ?? [];
  const history = jobs?.filter((j) => !ACTIVE.has(j.status)) ?? [];

  return (
    <Shell eyebrow="Your account" title="My Jobs" subtitle="Everything you've booked on Plugr." back="/app/browse">
      {error && (
        <Card className="p-5 mb-6 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Shared skeleton rather than the hand-rolled placeholder cards that used to sit here —
          those rendered the literal word "Loading..." inside each card. */}
      {!jobs && !error && <JobListSkeleton />}

      {jobs && jobs.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate">You haven't booked a job yet.</p>
        </Card>
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">Active</h2>
          <div className="space-y-3">
            {active.map((job) => (
              <JobRow key={job.id} job={job} onClick={() => router.push(`/app/confirm/${job.id}`)} />
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">History</h2>
          <Card className="divide-y divide-bone">
            {history.map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/app/receipt/${job.id}`)}
                className="w-full p-4 flex items-center justify-between hover:bg-bone/40 transition-colors text-left"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-pitch-black truncate">{job.title}</h4>
                  <p className="text-[10px] text-slate mt-0.5">
                    {job.plug?.user?.name ?? 'Unassigned'} · {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={job.status} />
                  <ChevronRight className="w-4 h-4 text-slate" />
                </div>
              </button>
            ))}
          </Card>
        </div>
      )}
    </Shell>
  );
}

function JobRow({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h4 className="font-bold text-pitch-black truncate">{job.title}</h4>
          <p className="text-[10px] text-slate font-medium mt-0.5">
            {job.category?.name ?? job.category?.code ?? 'Service'}
            {job.plug?.user?.name ? ` · ${job.plug.user.name}` : ''}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-bone">
        <Money amount={job.escrowAmount ?? job.price} size="sm" />
        <button
          onClick={onClick}
          className="bg-pitch-black text-white px-4 py-2 rounded-pill text-xs font-bold hover:bg-gold hover:text-pitch-black transition-colors flex items-center gap-1"
        >
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
}
