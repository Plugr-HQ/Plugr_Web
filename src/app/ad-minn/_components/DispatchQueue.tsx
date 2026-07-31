// src/app/ad-minn/_components/DispatchQueue.tsx
// Dispatch Queue — the primary admin view. Lists jobs sitting in SEARCHING_PLUG (the state jobs
// auto-advance to on creation) and lets an admin assign a plug in the job's category.
//
// All backend calls go through the same-origin /api/admin/* proxies (token forwarded server-side),
// matching the gate's /api/admin/verify and the plug-route proxy convention. Table styling follows
// Ramon's PlugsTable (rounded-card, bone header, px-6 py-4 cells, pill badges) so it reads as the
// same surface. A 401 anywhere bounces to the login screen, consistent with the /ad-minn gate.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Loader2,
  MapPin,
  Star,
  BadgeCheck,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { authHeaders, clearToken } from '@/src/lib/api';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 20;
const LOGIN_PATH = '/ad-minn/login';

type JobRow = {
  id: string;
  status: string;
  title?: string | null;
  address?: string | null;
  escrowAmount?: number | null;
  createdAt: string;
  client?: { name?: string | null; phone?: string | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
};

type PlugRow = {
  id: string;
  name?: string | null;
  trade?: string | null;
  rating?: number | null;
  verified?: boolean | null;
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

export function DispatchQueue() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [assignJob, setAssignJob] = useState<JobRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Shared fetch: forwards the bearer token; a 401 means the session died → back to login.
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
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch(
          `/api/admin/jobs?status=SEARCHING_PLUG&page=${targetPage}&limit=${PAGE_SIZE}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Could not load the dispatch queue.');
        const rows: JobRow[] = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(rows);
        setPage(targetPage);
        // No total count from the backend — a full page means there may be more.
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'unauthorized') return; // already redirecting
        setError(e?.message || 'Could not load the dispatch queue.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [adminFetch],
  );

  useEffect(() => {
    void loadJobs(1);
  }, [loadJobs]);

  // Called by the modal on a successful assignment.
  const onAssigned = useCallback((jobId: string, plugName: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setAssignJob(null);
    setToast(`Assigned to ${plugName}. Job moved out of the queue.`);
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-2 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">
          Jobs waiting for a plug{' '}
          <span className="ml-1 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold">
            SEARCHING_PLUG
          </span>
        </p>
        <button
          onClick={() => loadJobs(page)}
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
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4">Escrow</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bone">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
                  <p className="text-sm text-slate">Loading dispatch queue…</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                  <p className="text-sm font-bold text-red-600">{error}</p>
                  <button
                    onClick={() => loadJobs(page)}
                    className="mt-3 rounded-pill bg-midnight px-4 py-2 text-xs font-bold text-white hover:bg-midnight/90"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-midnight">Queue clear</h3>
                  <p className="text-sm text-slate">No jobs are waiting for a plug right now.</p>
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
                  <td className="px-6 py-4 text-sm text-slate">
                    <span className="line-clamp-1 max-w-[12rem]">{job.address ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-midnight">{formatMoney(job.escrowAmount)}</td>
                  <td className="px-6 py-4 text-sm text-slate">{formatDate(job.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                      Searching
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setAssignJob(job)}
                      className="rounded-pill bg-midnight px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-midnight/90"
                    >
                      Assign plug
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — offset based, no total count from the backend. */}
      {!loading && !error && (jobs.length > 0 || page > 1) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate">Page {page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => loadJobs(page - 1)}
              disabled={page <= 1}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => loadJobs(page + 1)}
              disabled={!hasNext}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {assignJob && (
        <AssignModal
          job={assignJob}
          adminFetch={adminFetch}
          onClose={() => setAssignJob(null)}
          onAssigned={onAssigned}
        />
      )}
    </div>
  );
}

function AssignModal({
  job,
  adminFetch,
  onClose,
  onAssigned,
}: {
  job: JobRow;
  adminFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onAssigned: (jobId: string, plugName: string) => void;
}) {
  const [plugs, setPlugs] = useState<PlugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const categoryCode = job.category?.code ?? '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await adminFetch(`/api/admin/plugs?categoryCode=${encodeURIComponent(categoryCode)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Could not load plugs.');
        if (!cancelled) setPlugs(Array.isArray(data.plugs) ? data.plugs : []);
      } catch (e: any) {
        if (e?.message === 'unauthorized') return;
        if (!cancelled) setLoadError(e?.message || 'Could not load plugs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminFetch, categoryCode]);

  async function confirm() {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setAssignError(null);
    try {
      const res = await adminFetch(`/api/admin/jobs/${job.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ plugId: selectedId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Surface the real backend reason (not ACTIVE, already assigned, category mismatch…).
        setAssignError(data?.error || 'Assignment failed.');
        return;
      }
      const plugName = plugs.find((p) => p.id === selectedId)?.name ?? 'plug';
      onAssigned(job.id, plugName);
    } catch (e: any) {
      if (e?.message === 'unauthorized') return;
      setAssignError(e?.message || 'Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-midnight/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-card bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-bone px-6 py-4">
          <div>
            <h3 className="font-display text-lg text-midnight">Assign a plug</h3>
            <p className="text-sm text-slate">
              {job.client?.name ?? 'Job'} ·{' '}
              <span className="capitalize">{job.category?.name ?? job.category?.code ?? 'category'}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate hover:bg-bone hover:text-midnight">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
              <p className="text-sm text-slate">Finding plugs in this category…</p>
            </div>
          ) : loadError ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-400" />
              <p className="text-sm font-bold text-red-600">{loadError}</p>
            </div>
          ) : plugs.length === 0 ? (
            <div className="py-10 text-center">
              <Briefcase className="mx-auto mb-3 h-8 w-8 text-slate/30" />
              <p className="text-sm font-bold text-midnight">No plugs in this category</p>
              <p className="text-sm text-slate">There are no providers registered for this trade yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {plugs.map((plug) => {
                const selected = selectedId === plug.id;
                return (
                  <li key={plug.id}>
                    <button
                      onClick={() => setSelectedId(plug.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition-colors',
                        selected ? 'border-gold bg-gold/5' : 'border-bone hover:bg-bone/40',
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bone text-sm font-bold text-midnight">
                        {(plug.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 grow">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-midnight">{plug.name ?? 'Unnamed'}</span>
                          {plug.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-green-500" />}
                        </div>
                        <span className="text-xs capitalize text-slate">{plug.trade ?? '—'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-midnight">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        {(plug.rating ?? 0).toFixed(1)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {assignError && (
          <div className="mx-6 mb-3 flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{assignError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-bone px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-pill px-4 py-2 text-sm font-bold text-slate hover:text-midnight"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!selectedId || submitting}
            className="flex items-center gap-2 rounded-pill bg-midnight px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-midnight/90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Assigning…' : 'Confirm assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
