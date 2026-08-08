// src/app/ad-minn/_components/JobPipeline.tsx
// Job Pipeline — jobs across ALL statuses with a status filter and a manual status-override for
// edge cases. Reuses the GET /jobs proxy (no status => all). Styled on the /app design system.
// The override offers every status and surfaces the JobStateMachine's real error — no client-side
// pre-validation, so the UI can't drift from backend truth.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { authHeaders, clearToken } from '@/src/lib/api';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { Money } from '@/src/components/ui';
import {
  TableCard, Thead, rowClass, cellClass, Chip, Avatar, FilterBar, FilterSelect, RefreshButton,
  FieldLabel, Toast, StateRow, Pager, Modal, ModalError, PillButton, type Tone,
} from './admin-ui';

const PAGE_SIZE = 20;
const LOGIN_PATH = '/ad-minn/login';

const STATUSES = [
  'PENDING', 'SEARCHING_PLUG', 'PLUG_ASSIGNED', 'CLIENT_ACCEPTED', 'PLUG_ACCEPTED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED',
] as const;
type JobStatus = (typeof STATUSES)[number];

const STATUS_TONE: Record<string, Tone> = {
  PENDING: 'neutral',
  SEARCHING_PLUG: 'gold',
  PLUG_ASSIGNED: 'blue',
  CLIENT_ACCEPTED: 'indigo',
  PLUG_ACCEPTED: 'purple',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
  EXPIRED: 'neutral',
};

type JobRow = {
  id: string;
  status: JobStatus;
  escrowAmount?: number | null;
  createdAt: string;
  client?: { name?: string | null; phone?: string | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
  plug?: { user?: { name?: string | null } | null } | null;
};

const prettyStatus = (s: string) => s.replace(/_/g, ' ');
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

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
    async (targetPage: number, status: 'ALL' | JobStatus) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
        if (status !== 'ALL') qs.set('status', status);
        const data = await adminFetch(`/api/admin/jobs?${qs.toString()}`);
        const rows: JobRow[] = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(rows);
        setPage(targetPage);
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'Session expired') return;
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
      void loadJobs(page, statusFilter);
    },
    [loadJobs, page, statusFilter],
  );

  return (
    <div className="space-y-4">
      {toast && <Toast>{toast}</Toast>}

      <FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Status</span>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | JobStatus)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{prettyStatus(s)}</option>
            ))}
          </FilterSelect>
        </div>
        <RefreshButton loading={loading} onClick={() => loadJobs(page, statusFilter)} />
      </FilterBar>

      <TableCard>
        <Thead cols={[{ label: 'Client' }, { label: 'Category' }, { label: 'Plug' }, { label: 'Escrow' }, { label: 'Status' }, { label: 'Created' }, { label: 'Action', right: true }]} />
        <tbody>
          {loading ? (
            <StateRow colSpan={7} variant="loading" title="Loading jobs…" />
          ) : error ? (
            <StateRow colSpan={7} variant="error" title={error} icon={<Inbox className="h-6 w-6" />} onRetry={() => loadJobs(page, statusFilter)} />
          ) : jobs.length === 0 ? (
            <StateRow colSpan={7} variant="empty" title="No jobs" body={statusFilter === 'ALL' ? 'There are no jobs yet.' : `No jobs in ${prettyStatus(statusFilter)}.`} icon={<Inbox className="h-6 w-6" />} />
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className={rowClass}>
                <td className={cellClass}>
                  <div className="flex items-center gap-3">
                    <Avatar name={job.client?.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-midnight">{job.client?.name ?? 'Unknown'}</p>
                      <p className="truncate text-xs text-slate">{job.client?.phone ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className={cn(cellClass, 'text-sm capitalize text-slate')}>{job.category?.name ?? job.category?.code ?? '—'}</td>
                <td className={cn(cellClass, 'text-sm text-slate')}>{job.plug?.user?.name ?? '—'}</td>
                <td className={cellClass}>{job.escrowAmount == null ? <span className="text-sm text-slate">—</span> : <Money amount={job.escrowAmount} size="sm" />}</td>
                <td className={cellClass}><Chip tone={STATUS_TONE[job.status] ?? 'neutral'}>{prettyStatus(job.status)}</Chip></td>
                <td className={cn(cellClass, 'whitespace-nowrap text-sm text-slate')}>{formatDate(job.createdAt)}</td>
                <td className={cn(cellClass, 'text-right')}>
                  <PillButton variant="outline" className="px-4 py-2 text-xs" onClick={() => setOverrideJob(job)}>Override</PillButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      {!loading && !error && (jobs.length > 0 || page > 1) && (
        <Pager page={page} hasNext={hasNext} onPrev={() => loadJobs(page - 1, statusFilter)} onNext={() => loadJobs(page + 1, statusFilter)} />
      )}

      {overrideJob && <OverrideModal job={overrideJob} adminFetch={adminFetch} onClose={() => setOverrideJob(null)} onOverridden={onOverridden} />}
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
      await adminFetch(`/api/admin/jobs/${job.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: target, reason: reason.trim() || undefined }) });
      onOverridden(target);
    } catch (e: any) {
      if (e?.message === 'Session expired') return;
      setError(e?.message || 'Status update failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Override status"
      sub={`${job.client?.name ?? 'Job'} · currently ${prettyStatus(job.status)}`}
      onClose={onClose}
      footer={
        <>
          <PillButton variant="ghost" onClick={onClose}>Cancel</PillButton>
          <PillButton variant="primary" loading={submitting} disabled={!target} onClick={confirm}>
            {submitting ? 'Updating…' : 'Apply override'}
          </PillButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-2xl border border-midnight/[0.06] bg-bone/50 px-4 py-3 text-sm">
          <span className="text-slate">Current</span>
          <Chip tone={STATUS_TONE[job.status] ?? 'neutral'}>{prettyStatus(job.status)}</Chip>
        </div>

        <div>
          <FieldLabel htmlFor="override-target">New status</FieldLabel>
          <FilterSelect
            id="override-target"
            className="w-full rounded-2xl"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as JobStatus);
              setError(null);
            }}
          >
            <option value="" disabled>Select a status…</option>
            {targets.map((s) => (
              <option key={s} value={s}>{prettyStatus(s)}</option>
            ))}
          </FilterSelect>
        </div>

        <div>
          <FieldLabel htmlFor="override-reason" hint="(optional, logged)">Reason</FieldLabel>
          <textarea
            id="override-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is this being overridden?"
            className="w-full resize-none rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow"
          />
        </div>

        {error && <ModalError>{error}</ModalError>}
      </div>
    </Modal>
  );
}
