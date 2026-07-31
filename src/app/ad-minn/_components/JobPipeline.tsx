// src/app/ad-minn/_components/JobPipeline.tsx
// Job Pipeline — jobs across ALL statuses with a status filter and a manual status-override for
// edge cases (bot flow broke, a job needs to be force-advanced or cancelled). Same table/proxy/
// pagination conventions as DispatchQueue; reuses the same GET /jobs proxy (no status filter =>
// all statuses). The override calls PATCH /jobs/:id/status via /api/admin/jobs/:id/status and
// surfaces the JobStateMachine's real error — the client never pre-judges which transitions are
// legal, so it can't drift from backend truth.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, X, Inbox } from 'lucide-react';
import { authHeaders, clearToken } from '@/src/lib/api';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 20;
const LOGIN_PATH = '/ad-minn/login';

// The full JobStatus enum (mirrors the backend). Used for the filter and the override target —
// NOT to decide validity: the backend state machine is the sole authority on legal transitions.
const STATUSES = [
  'PENDING',
  'SEARCHING_PLUG',
  'PLUG_ASSIGNED',
  'CLIENT_ACCEPTED',
  'PLUG_ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
] as const;

type JobStatus = (typeof STATUSES)[number];

type JobRow = {
  id: string;
  status: JobStatus;
  title?: string | null;
  address?: string | null;
  escrowAmount?: number | null;
  createdAt: string;
  client?: { name?: string | null; phone?: string | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
  plug?: { user?: { name?: string | null } | null } | null;
};

function formatMoney(v?: number | null): string {
  if (v == null) return '—';
  return `₦${Number(v).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusPill(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    SEARCHING_PLUG: 'bg-gold/10 text-gold',
    PLUG_ASSIGNED: 'bg-blue-100 text-blue-700',
    CLIENT_ACCEPTED: 'bg-indigo-100 text-indigo-700',
    PLUG_ACCEPTED: 'bg-purple-100 text-purple-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-200 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

const prettyStatus = (s: string) => s.replace(/_/g, ' ');

export function JobPipeline() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | JobStatus>('ALL');
  const [overrideJob, setOverrideJob] = useState<JobRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const adminFetch = useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const res = await fetch(input, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers || {}) },
      });
      if (res.status === 401) {
        clearToken();
        router.replace(LOGIN_PATH);
        throw new Error('unauthorized');
      }
      return res;
    },
    [router],
  );

  const loadJobs = useCallback(
    async (targetPage: number, status: 'ALL' | JobStatus) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
        if (status !== 'ALL') qs.set('status', status);
        const res = await adminFetch(`/api/admin/jobs?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Could not load jobs.');
        const rows: JobRow[] = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(rows);
        setPage(targetPage);
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'unauthorized') return;
        setError(e?.message || 'Could not load jobs.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [adminFetch],
  );

  useEffect(() => {
    void loadJobs(1, statusFilter);
  }, [loadJobs, statusFilter]);

  const onOverridden = useCallback(
    (newStatus: string) => {
      setOverrideJob(null);
      setToast(`Status updated to ${prettyStatus(newStatus)}.`);
      setTimeout(() => setToast(null), 4000);
      // Refetch the current page so the row reflects the new status (and drops out if a filter
      // no longer matches it).
      void loadJobs(page, statusFilter);
    },
    [loadJobs, page, statusFilter],
  );

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-2 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="pipeline-status" className="text-xs font-bold uppercase tracking-wider text-slate">
            Status
          </label>
          <select
            id="pipeline-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | JobStatus)}
            className="rounded-pill border border-bone bg-bone px-4 py-2 text-sm font-bold text-midnight focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {prettyStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => loadJobs(page, statusFilter)}
          disabled={loading}
          className="flex items-center gap-2 rounded-pill border border-bone bg-white px-3 py-1.5 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-card border border-bone bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-bone/50 text-xs font-bold uppercase tracking-wider text-slate">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Plug</th>
              <th className="px-6 py-4">Escrow</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bone">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
                  <p className="text-sm text-slate">Loading jobs…</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                  <p className="text-sm font-bold text-red-600">{error}</p>
                  <button
                    onClick={() => loadJobs(page, statusFilter)}
                    className="mt-3 rounded-pill bg-midnight px-4 py-2 text-xs font-bold text-white hover:bg-midnight/90"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bone">
                    <Inbox className="h-6 w-6 text-slate/50" />
                  </div>
                  <h3 className="font-bold text-midnight">No jobs</h3>
                  <p className="text-sm text-slate">
                    {statusFilter === 'ALL'
                      ? 'There are no jobs yet.'
                      : `No jobs in ${prettyStatus(statusFilter)}.`}
                  </p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="transition-colors hover:bg-bone/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bone text-xs font-bold text-midnight">
                        {(job.client?.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-midnight">
                          {job.client?.name ?? 'Unknown'}
                        </p>
                        <p className="truncate text-xs text-slate">{job.client?.phone ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-slate">
                    {job.category?.name ?? job.category?.code ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate">{job.plug?.user?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-midnight">{formatMoney(job.escrowAmount)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        statusPill(job.status),
                      )}
                    >
                      {prettyStatus(job.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate">{formatDate(job.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setOverrideJob(job)}
                      className="rounded-pill border border-bone px-4 py-2 text-xs font-bold text-midnight transition-colors hover:bg-bone"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && (jobs.length > 0 || page > 1) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate">Page {page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => loadJobs(page - 1, statusFilter)}
              disabled={page <= 1}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => loadJobs(page + 1, statusFilter)}
              disabled={!hasNext}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {overrideJob && (
        <OverrideModal
          job={overrideJob}
          adminFetch={adminFetch}
          onClose={() => setOverrideJob(null)}
          onOverridden={onOverridden}
        />
      )}
    </div>
  );
}

function OverrideModal({
  job,
  adminFetch,
  onClose,
  onOverridden,
}: {
  job: JobRow;
  adminFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onOverridden: (newStatus: string) => void;
}) {
  // Offer every status except the current one. The backend decides which are actually reachable;
  // an illegal choice comes back as the state machine's own error.
  const targets = STATUSES.filter((s) => s !== job.status);
  const [target, setTarget] = useState<JobStatus | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!target || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/jobs/${job.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: target, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Surface the real reason (e.g. "State transfer from [X] to [Y] is not allowed").
        setError(data?.error || 'Status update failed.');
        return;
      }
      onOverridden(target);
    } catch (e: any) {
      if (e?.message === 'unauthorized') return;
      setError(e?.message || 'Status update failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-midnight/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-card bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-bone px-6 py-4">
          <div>
            <h3 className="font-display text-lg text-midnight">Override status</h3>
            <p className="text-sm text-slate">
              {job.client?.name ?? 'Job'} · currently{' '}
              <span className="font-bold">{prettyStatus(job.status)}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate hover:bg-bone hover:text-midnight">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="override-target" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate">
              New status
            </label>
            <select
              id="override-target"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as JobStatus);
                setError(null);
              }}
              className="w-full rounded-card border border-bone bg-bone px-4 py-2.5 text-sm font-bold text-midnight focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="" disabled>
                Select a status…
              </option>
              {targets.map((s) => (
                <option key={s} value={s}>
                  {prettyStatus(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="override-reason" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate">
              Reason <span className="font-normal normal-case text-slate/60">(optional, logged)</span>
            </label>
            <textarea
              id="override-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this being overridden?"
              className="w-full resize-none rounded-card border border-bone bg-bone px-4 py-2.5 text-sm text-midnight focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-bone px-6 py-4">
          <button onClick={onClose} className="rounded-pill px-4 py-2 text-sm font-bold text-slate hover:text-midnight">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!target || submitting}
            className="flex items-center gap-2 rounded-pill bg-midnight px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-midnight/90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Updating…' : 'Apply override'}
          </button>
        </div>
      </div>
    </div>
  );
}
