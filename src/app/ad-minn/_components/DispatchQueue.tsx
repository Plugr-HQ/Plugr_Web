// src/app/ad-minn/_components/DispatchQueue.tsx
// Dispatch Queue — jobs sitting in SEARCHING_PLUG (the state jobs auto-advance to on creation).
// The admin assigns a plug in the job's category or deletes unassigned requests.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star, BadgeCheck, Briefcase, MapPin, Trash2 } from 'lucide-react';
import { authHeaders } from '@/src/lib/api';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { Money } from '@/src/components/ui';
import {
  TableCard, Thead, rowClass, cellClass, Chip, Avatar, FilterBar, RefreshButton,
  Toast, StateRow, Pager, Modal, ModalError, PillButton,
} from './admin-ui';

const PAGE_SIZE = 20;
const LOGIN_PATH = '/ad-minn/login';

type JobRow = {
  id: string;
  status: string;
  address?: string | null;
  escrowAmount?: number | null;
  createdAt: string;
  client?: { name?: string | null; phone?: string | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
};

type PlugRow = { id: string; name?: string | null; trade?: string | null; rating?: number | null; verified?: boolean | null };

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

  // Deletion states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminFetch = useCallback(
    async (input: string, init?: RequestInit): Promise<any> => {
      return apiFetch(
        input,
        {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...(init?.headers || {}),
          },
        },
        { redirectTo: LOGIN_PATH }
      );
    },
    [],
  );

  const loadJobs = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminFetch(`/api/admin/jobs?status=SEARCHING_PLUG&page=${targetPage}&limit=${PAGE_SIZE}`);
        const rows: JobRow[] = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(rows);
        setPage(targetPage);
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'Session expired') return;
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

  const onAssigned = useCallback((jobId: string, plugName: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setAssignJob(null);
    setToast(`Assigned to ${plugName}. Job moved out of the queue.`);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleDeleteJob = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await adminFetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setToast('Job deleted successfully.');
      setConfirmDeleteId(null);
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      if (e?.message === 'Session expired') return;
      setToast(e?.message || 'Failed to delete job.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast>{toast}</Toast>}

      <FilterBar>
        <p className="flex items-center gap-2 text-sm text-slate">
          Jobs waiting for a plug
          <Chip tone="gold">Searching</Chip>
        </p>
        <RefreshButton loading={loading} onClick={() => loadJobs(page)} />
      </FilterBar>

      <TableCard>
        <Thead cols={[{ label: 'Client' }, { label: 'Category' }, { label: 'Address' }, { label: 'Escrow' }, { label: 'Created' }, { label: 'Action', right: true }]} />
        <tbody>
          {loading ? (
            <StateRow colSpan={6} variant="loading" title="Loading dispatch queue…" />
          ) : error ? (
            <StateRow colSpan={6} variant="error" title={error} icon={<Briefcase className="h-6 w-6" />} onRetry={() => loadJobs(page)} />
          ) : jobs.length === 0 ? (
            <StateRow colSpan={6} variant="empty" title="Queue clear" body="No jobs are waiting for a plug right now." icon={<Briefcase className="h-6 w-6" />} />
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className={rowClass}>
                <td className={cellClass}>
                  <div className="flex items-center gap-3">
                    <Avatar name={job.client?.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-pitch-black">{job.client?.name ?? 'Unknown'}</p>
                      <p className="truncate text-xs text-slate">{job.client?.phone ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className={cn(cellClass, 'text-sm capitalize text-slate')}>{job.category?.name ?? job.category?.code ?? '—'}</td>
                <td className={cellClass}>
                  <span className="flex items-center gap-1.5 text-sm text-slate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/50" />
                    <span className="line-clamp-1 max-w-52">{job.address ?? '—'}</span>
                  </span>
                </td>
                <td className={cellClass}>{job.escrowAmount == null ? <span className="text-sm text-slate">—</span> : <Money amount={job.escrowAmount} size="sm" />}</td>
                <td className={cn(cellClass, 'whitespace-nowrap text-sm text-slate')}>{formatDate(job.createdAt)}</td>
                <td className={cn(cellClass, 'text-right')}>
                  <div className="flex items-center justify-end gap-2">
                    {confirmDeleteId === job.id ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-50 p-1 pl-3">
                        <span className="text-xs font-bold text-red-600">Delete job?</span>
                        <button
                          disabled={deletingId === job.id}
                          onClick={() => handleDeleteJob(job.id)}
                          className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-full bg-slate/10 px-2.5 py-1 text-xs font-bold text-pitch-black hover:bg-slate/20"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          title="Delete Job"
                          onClick={() => setConfirmDeleteId(job.id)}
                          className="rounded-full p-2 text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <PillButton variant="primary" className="px-4 py-2 text-xs" onClick={() => setAssignJob(job)}>
                          Assign plug
                        </PillButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      {!loading && !error && (jobs.length > 0 || page > 1) && (
        <Pager page={page} hasNext={hasNext} onPrev={() => loadJobs(page - 1)} onNext={() => loadJobs(page + 1)} />
      )}

      {assignJob && <AssignModal job={assignJob} adminFetch={adminFetch} onClose={() => setAssignJob(null)} onAssigned={onAssigned} />}
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
  adminFetch: (input: string, init?: RequestInit) => Promise<any>; // <-- Change Promise<Response> to Promise<any>
  onClose: () => void;
  onAssigned: (jobId: string, plugName: string) => void;
}){
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
        const data = await adminFetch(`/api/admin/plugs?categoryCode=${encodeURIComponent(categoryCode)}`);
        if (!cancelled) setPlugs(Array.isArray(data.plugs) ? data.plugs : []);
      } catch (e: any) {
        if (e?.message === 'Session expired') return;
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
      await adminFetch(`/api/admin/jobs/${job.id}/assign`, { method: 'PATCH', body: JSON.stringify({ plugId: selectedId }) });
      onAssigned(job.id, plugs.find((p) => p.id === selectedId)?.name ?? 'plug');
    } catch (e: any) {
      if (e?.message === 'Session expired') return;
      setAssignError(e?.message || 'Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Assign a plug"
      sub={`${job.client?.name ?? 'Job'} · ${job.category?.name ?? job.category?.code ?? 'category'}`}
      onClose={onClose}
      footer={
        <>
          <PillButton variant="ghost" onClick={onClose}>Cancel</PillButton>
          <PillButton variant="primary" loading={submitting} disabled={!selectedId} onClick={confirm}>
            {submitting ? 'Assigning…' : 'Confirm assignment'}
          </PillButton>
        </>
      }
    >
      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
          <p className="text-sm text-slate">Finding plugs in this category…</p>
        </div>
      ) : loadError ? (
        <ModalError>{loadError}</ModalError>
      ) : plugs.length === 0 ? (
        <div className="py-10 text-center">
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-slate/30" />
          <p className="text-sm font-bold text-pitch-black">No plugs in this category</p>
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
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                    selected ? 'border-gold bg-gold/5 ring-4 ring-gold/10' : 'border-pitch-black/10 hover:bg-bone/60',
                  )}
                >
                  <Avatar name={plug.name} tone={selected ? 'gold' : 'bone'} />
                  <div className="min-w-0 grow">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-pitch-black">{plug.name ?? 'Unnamed'}</span>
                      {plug.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
                    </span>
                    <span className="text-xs capitalize text-slate">{plug.trade ?? '—'}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-pitch-black">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {(plug.rating ?? 0).toFixed(1)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {assignError && <div className="mt-4"><ModalError>{assignError}</ModalError></div>}
    </Modal>
  );
}