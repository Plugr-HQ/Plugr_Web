// src/app/ad-minn/_components/Flags.tsx
// Flags — the admin dispute queue. Lists disputes (defaulting to OPEN) and lets an admin resolve
// one. Same table/proxy/pagination conventions as DispatchQueue / JobPipeline.
//
// Resolving a dispute IS the money-movement decision: the backend has no "just close the row"
// call — POST /escrow/:jobId/resolve moves the escrow (release_to_plug / refund_to_client) AND
// marks the Dispute RESOLVED. So the resolve modal shows the escrow amount and who's involved, and
// makes the admin pick release vs refund. Backend errors (e.g. "No open dispute on this job.")
// are surfaced verbatim.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Flag,
  ArrowRightCircle,
  Undo2,
} from 'lucide-react';
import { authHeaders, clearToken } from '@/src/lib/api';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 20;
const LOGIN_PATH = '/ad-minn/login';

type Resolution = 'release_to_plug' | 'refund_to_client';

type UserLite = { id?: string | null; name?: string | null; phone?: string | null };

type DisputeRow = {
  id: string;
  jobId: string;
  raisedByUserId: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string | null;
  createdAt: string;
  job?: {
    id: string;
    escrowAmount?: number | null;
    escrowStatus?: string | null;
    client?: UserLite | null;
    plug?: { user?: UserLite | null } | null;
    category?: { name?: string | null; code?: string | null } | null;
  } | null;
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
    OPEN: 'bg-amber-100 text-amber-700',
    RESOLVED: 'bg-green-100 text-green-700',
    DISMISSED: 'bg-gray-200 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

// Resolve the raiser id to a name using the included relations (client / assigned plug's user).
function raisedBy(d: DisputeRow): { name: string; role: string | null } {
  const id = d.raisedByUserId;
  const client = d.job?.client;
  const plugUser = d.job?.plug?.user;
  if (client?.id && client.id === id) return { name: client.name ?? 'Client', role: 'Client' };
  if (plugUser?.id && plugUser.id === id) return { name: plugUser.name ?? 'Plug', role: 'Plug' };
  return { name: id ? `${id.slice(0, 8)}…` : 'Unknown', role: null };
}

export function Flags() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [filter, setFilter] = useState<'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL'>('OPEN');
  const [resolveDispute, setResolveDispute] = useState<DisputeRow | null>(null);
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

  const loadDisputes = useCallback(
    async (targetPage: number, f: 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL') => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
        if (f === 'ALL') qs.set('all', 'true');
        else qs.set('status', f);
        const res = await adminFetch(`/api/admin/disputes?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Could not load disputes.');
        const rows: DisputeRow[] = Array.isArray(data.disputes) ? data.disputes : [];
        setDisputes(rows);
        setPage(targetPage);
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'unauthorized') return;
        setError(e?.message || 'Could not load disputes.');
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    },
    [adminFetch],
  );

  useEffect(() => {
    void loadDisputes(1, filter);
  }, [loadDisputes, filter]);

  const onResolved = useCallback(
    (resolution: Resolution) => {
      setResolveDispute(null);
      setToast(resolution === 'release_to_plug' ? 'Dispute resolved — funds released to plug.' : 'Dispute resolved — funds refunded to client.');
      setTimeout(() => setToast(null), 4000);
      void loadDisputes(page, filter);
    },
    [loadDisputes, page, filter],
  );

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-2 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="flags-filter" className="text-xs font-bold uppercase tracking-wider text-slate">
            Show
          </label>
          <select
            id="flags-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL')}
            className="rounded-pill border border-bone bg-bone px-4 py-2 text-sm font-bold text-midnight focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <button
          onClick={() => loadDisputes(page, filter)}
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
              <th className="px-6 py-4">Job</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Raised by</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bone">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
                  <p className="text-sm text-slate">Loading disputes…</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                  <p className="text-sm font-bold text-red-600">{error}</p>
                  <button
                    onClick={() => loadDisputes(page, filter)}
                    className="mt-3 rounded-pill bg-midnight px-4 py-2 text-xs font-bold text-white hover:bg-midnight/90"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <Flag className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-midnight">No flags</h3>
                  <p className="text-sm text-slate">
                    {filter === 'OPEN' ? 'No open disputes right now.' : `No ${filter.toLowerCase()} disputes.`}
                  </p>
                </td>
              </tr>
            ) : (
              disputes.map((d) => {
                const rb = raisedBy(d);
                return (
                  <tr key={d.id} className="transition-colors hover:bg-bone/20">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-midnight">{d.job?.client?.name ?? 'Unknown'}</p>
                      <p className="text-xs capitalize text-slate">
                        {d.job?.category?.name ?? d.job?.category?.code ?? '—'} · {formatMoney(d.job?.escrowAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="line-clamp-2 max-w-[16rem] text-sm text-slate">{d.reason}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate">
                      {rb.name}
                      {rb.role && <span className="ml-1 text-xs text-slate/60">({rb.role})</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', statusPill(d.status))}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate">{formatDate(d.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'OPEN' ? (
                        <button
                          onClick={() => setResolveDispute(d)}
                          className="rounded-pill bg-midnight px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-midnight/90"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-slate/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && (disputes.length > 0 || page > 1) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate">Page {page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => loadDisputes(page - 1, filter)}
              disabled={page <= 1}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => loadDisputes(page + 1, filter)}
              disabled={!hasNext}
              className="rounded-pill border border-bone bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-midnight disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {resolveDispute && (
        <ResolveModal
          dispute={resolveDispute}
          adminFetch={adminFetch}
          onClose={() => setResolveDispute(null)}
          onResolved={onResolved}
        />
      )}
    </div>
  );
}

function ResolveModal({
  dispute,
  adminFetch,
  onClose,
  onResolved,
}: {
  dispute: DisputeRow;
  adminFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onResolved: (resolution: Resolution) => void;
}) {
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rb = raisedBy(dispute);
  const clientName = dispute.job?.client?.name ?? 'Client';
  const plugName = dispute.job?.plug?.user?.name ?? null;
  const amount = formatMoney(dispute.job?.escrowAmount);

  async function confirm() {
    if (!resolution || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/escrow/${dispute.jobId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution, resolutionNote: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not resolve the dispute.');
        return;
      }
      onResolved(resolution);
    } catch (e: any) {
      if (e?.message === 'unauthorized') return;
      setError(e?.message || 'Could not resolve the dispute.');
    } finally {
      setSubmitting(false);
    }
  }

  const Option = ({
    value,
    icon,
    title,
    sub,
  }: {
    value: Resolution;
    icon: React.ReactNode;
    title: string;
    sub: string;
  }) => {
    const selected = resolution === value;
    return (
      <button
        onClick={() => {
          setResolution(value);
          setError(null);
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition-colors',
          selected ? 'border-gold bg-gold/5' : 'border-bone hover:bg-bone/40',
        )}
      >
        <span className={cn('shrink-0', selected ? 'text-gold' : 'text-slate')}>{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-midnight">{title}</span>
          <span className="block text-xs text-slate">{sub}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-midnight/40 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-card bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-bone px-6 py-4">
          <div>
            <h3 className="font-display text-lg text-midnight">Resolve dispute</h3>
            <p className="text-sm text-slate">Choose where the escrowed funds go.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate hover:bg-bone hover:text-midnight">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
          {/* Context so the admin decides informed, not blind. */}
          <div className="rounded-card border border-bone bg-bone/40 p-4 text-sm">
            <div className="flex items-center justify-between border-b border-bone pb-2">
              <span className="text-slate">Escrow amount</span>
              <span className="font-bold text-midnight">{amount}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate">Client</span>
              <span className="font-bold text-midnight">{clientName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-bone pb-2">
              <span className="text-slate">Plug</span>
              <span className="font-bold text-midnight">{plugName ?? '— (none assigned)'}</span>
            </div>
            <div className="pt-2">
              <span className="text-slate">Raised by </span>
              <span className="font-bold text-midnight">
                {rb.name}
                {rb.role && <span className="ml-1 font-normal text-slate/70">({rb.role})</span>}
              </span>
              <p className="mt-1 rounded-card bg-white px-3 py-2 text-sm text-midnight">&ldquo;{dispute.reason}&rdquo;</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate">Decision</p>
            <Option
              value="release_to_plug"
              icon={<ArrowRightCircle className="h-5 w-5" />}
              title="Release to plug"
              sub={`Pay the escrowed ${amount} to ${plugName ?? 'the assigned plug'}.`}
            />
            <Option
              value="refund_to_client"
              icon={<Undo2 className="h-5 w-5" />}
              title="Refund to client"
              sub={`Return the escrowed ${amount} to ${clientName}.`}
            />
          </div>

          <div>
            <label htmlFor="resolve-note" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate">
              Resolution note <span className="font-normal normal-case text-slate/60">(optional, logged)</span>
            </label>
            <textarea
              id="resolve-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Why this outcome?"
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
            disabled={!resolution || submitting}
            className="flex items-center gap-2 rounded-pill bg-midnight px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-midnight/90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Resolving…' : 'Confirm resolution'}
          </button>
        </div>
      </div>
    </div>
  );
}
