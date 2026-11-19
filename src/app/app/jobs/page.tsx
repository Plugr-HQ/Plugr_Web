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
import { rungFor } from '@/src/lib/jobStatusLadder';

type Job = {
  id: string;
  status: string;
  title: string;
  description?: string | null;
  address?: string | null;
  price?: number | null;
  escrowAmount?: number | null;
  jobAmount?: number | null;
  createdAt: string;
  category?: { name?: string; code?: string } | null;
  plug?: { user?: { name?: string } } | null;
};

// Status wording comes from the shared ladder (src/lib/jobStatusLadder.ts), in the client's voice —
// the same words the client job page uses. This map used to predate the quote flow: it had no entry
// for QUOTED, AWAITING_CONFIRM and the rest, and fell back to printing the raw enum.
const DONE = new Set(['COMPLETED', 'RELEASED']);
const STOPPED = new Set(['CANCELLED', 'EXPIRED', 'DISPUTED']);
// Everything that isn't finished or stopped is still active.
const isActive = (status: string) => !DONE.has(status) && !STOPPED.has(status);

function StatusBadge({ status }: { status: string }) {
  // The ladder's client wording for ESCROW_HELD is "pay to start" — wrong once they have paid.
  const label = status === 'ESCROW_HELD' ? 'Payment secured' : rungFor(status).canonical;
  const Icon = DONE.has(status) ? CheckCircle2 : STOPPED.has(status) ? XCircle : Clock;
  const cls = DONE.has(status)
    ? 'bg-green-100 text-green-700'
    : STOPPED.has(status)
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  return (
    <div className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase', cls)}>
      <Icon className="w-3 h-3" />
      {label}
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

  const active = jobs?.filter((j) => isActive(j.status)) ?? [];
  const history = jobs?.filter((j) => !isActive(j.status)) ?? [];

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
              <JobRow key={job.id} job={job} onClick={() => router.push(`/app/jobs/${job.id}`)} />
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
                onClick={() => router.push(`/app/jobs/${job.id}`)}
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
        <Money amount={job.jobAmount ?? job.escrowAmount ?? job.price} size="sm" />
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
