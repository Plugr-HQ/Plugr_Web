// src/app/ad-minn/_components/Flags.tsx
// Flags — the dispute queue. Lists disputes (defaulting to OPEN) and resolves one. Resolving IS
// the money-movement decision: POST /escrow/:jobId/resolve moves the escrow (release/refund) AND
// marks the Dispute RESOLVED — there is no "just close the row" call. Styled on the /app system.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, ArrowRightCircle, Undo2 } from 'lucide-react';
import { authHeaders, clearToken } from '@/src/lib/api';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { Money } from '@/src/components/ui';
import {
  TableCard, Thead, rowClass, cellClass, Chip, FilterBar, FilterSelect, RefreshButton, FieldLabel,
  Toast, StateRow, Pager, Modal, ModalError, PillButton, type Tone,
} from './admin-ui';

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
  createdAt: string;
  job?: {
    id: string;
    escrowAmount?: number | null;
    client?: UserLite | null;
    plug?: { user?: UserLite | null } | null;
    category?: { name?: string | null; code?: string | null } | null;
  } | null;
};

const STATUS_TONE: Record<string, Tone> = { OPEN: 'amber', RESOLVED: 'green', DISMISSED: 'neutral' };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

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

  const loadDisputes = useCallback(
    async (targetPage: number, f: 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL') => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
        if (f === 'ALL') qs.set('all', 'true');
        else qs.set('status', f);
        const data = await adminFetch(`/api/admin/disputes?${qs.toString()}`);
        const rows: DisputeRow[] = Array.isArray(data.disputes) ? data.disputes : [];
        setDisputes(rows);
        setPage(targetPage);
        setHasNext(rows.length === PAGE_SIZE);
      } catch (e: any) {
        if (e?.message === 'Session expired') return;
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
      {toast && <Toast>{toast}</Toast>}

      <FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Show</span>
          <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value as 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL')}>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ALL">All</option>
          </FilterSelect>
        </div>
        <RefreshButton loading={loading} onClick={() => loadDisputes(page, filter)} />
      </FilterBar>

      <TableCard>
        <Thead cols={[{ label: 'Job' }, { label: 'Reason' }, { label: 'Raised by' }, { label: 'Status' }, { label: 'Created' }, { label: 'Action', right: true }]} />
        <tbody>
          {loading ? (
            <StateRow colSpan={6} variant="loading" title="Loading disputes…" />
          ) : error ? (
            <StateRow colSpan={6} variant="error" title={error} icon={<Flag className="h-6 w-6" />} onRetry={() => loadDisputes(page, filter)} />
          ) : disputes.length === 0 ? (
            <StateRow colSpan={6} variant="empty" title="No flags" body={filter === 'OPEN' ? 'No open disputes right now.' : `No ${filter.toLowerCase()} disputes.`} icon={<Flag className="h-6 w-6" />} />
          ) : (
            disputes.map((d) => {
              const rb = raisedBy(d);
              return (
                <tr key={d.id} className={rowClass}>
                  <td className={cellClass}>
                    <p className="text-sm font-bold text-pitch-black">{d.job?.client?.name ?? 'Unknown'}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-slate">
                      {d.job?.category?.name ?? d.job?.category?.code ?? '—'}
                      <span className="text-slate/40">·</span>
                      {d.job?.escrowAmount == null ? <span>—</span> : <Money amount={d.job.escrowAmount} size="sm" className="!text-xs" />}
                    </p>
                  </td>
                  <td className={cellClass}><span className="line-clamp-2 max-w-[16rem] text-sm text-slate">{d.reason}</span></td>
                  <td className={cn(cellClass, 'text-sm text-slate')}>
                    {rb.name}
                    {rb.role && <span className="ml-1 text-xs text-slate/60">({rb.role})</span>}
                  </td>
                  <td className={cellClass}><Chip tone={STATUS_TONE[d.status] ?? 'neutral'}>{d.status}</Chip></td>
                  <td className={cn(cellClass, 'whitespace-nowrap text-sm text-slate')}>{formatDate(d.createdAt)}</td>
                  <td className={cn(cellClass, 'text-right')}>
                    {d.status === 'OPEN' ? (
                      <PillButton variant="primary" className="px-4 py-2 text-xs" onClick={() => setResolveDispute(d)}>Resolve</PillButton>
                    ) : (
                      <span className="text-xs text-slate/50">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableCard>

      {!loading && !error && (disputes.length > 0 || page > 1) && (
        <Pager page={page} hasNext={hasNext} onPrev={() => loadDisputes(page - 1, filter)} onNext={() => loadDisputes(page + 1, filter)} />
      )}

      {resolveDispute && <ResolveModal dispute={resolveDispute} adminFetch={adminFetch} onClose={() => setResolveDispute(null)} onResolved={onResolved} />}
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
  const amount = dispute.job?.escrowAmount;

  async function confirm() {
    if (!resolution || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/escrow/${dispute.jobId}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, resolutionNote: note.trim() || undefined }) });
      onResolved(resolution);
    } catch (e: any) {
      if (e?.message === 'Session expired') return;
      setError(e?.message || 'Could not resolve the dispute.');
    } finally {
      setSubmitting(false);
    }
  }

  const money = amount == null ? 'the escrow' : `₦${Number(amount).toLocaleString('en-NG')}`;

  const Option = ({ value, icon, title, sub }: { value: Resolution; icon: React.ReactNode; title: string; sub: string }) => {
    const selected = resolution === value;
    return (
      <button
        onClick={() => {
          setResolution(value);
          setError(null);
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
          selected ? 'border-gold bg-gold/5 ring-4 ring-gold/10' : 'border-pitch-black/10 hover:bg-bone/60',
        )}
      >
        <span className={cn('shrink-0', selected ? 'text-gold' : 'text-slate')}>{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-pitch-black">{title}</span>
          <span className="block text-xs text-slate">{sub}</span>
        </span>
      </button>
    );
  };

  return (
    <Modal
      title="Resolve dispute"
      sub="Choose where the escrowed funds go."
      onClose={onClose}
      footer={
        <>
          <PillButton variant="ghost" onClick={onClose}>Cancel</PillButton>
          <PillButton variant="primary" loading={submitting} disabled={!resolution} onClick={confirm}>
            {submitting ? 'Resolving…' : 'Confirm resolution'}
          </PillButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Context so the admin decides informed, not blind. */}
        <div className="rounded-2xl border border-pitch-black/[0.06] bg-bone/50 p-4">
          <div className="flex items-center justify-between border-b border-pitch-black/[0.06] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Escrow amount</span>
            {amount == null ? <span className="text-sm font-bold text-pitch-black">—</span> : <Money amount={amount} size="sm" />}
          </div>
          <div className="grid grid-cols-2 gap-3 py-3 text-sm">
            <div><span className="block text-xs text-slate">Client</span><span className="font-bold text-pitch-black">{clientName}</span></div>
            <div><span className="block text-xs text-slate">Plug</span><span className="font-bold text-pitch-black">{plugName ?? '— none'}</span></div>
          </div>
          <div className="border-t border-pitch-black/[0.06] pt-3">
            <span className="text-xs text-slate">Raised by </span>
            <span className="text-sm font-bold text-pitch-black">{rb.name}{rb.role && <span className="ml-1 font-normal text-slate/70">({rb.role})</span>}</span>
            <p className="mt-1.5 rounded-xl bg-white px-3 py-2 text-sm text-pitch-black">&ldquo;{dispute.reason}&rdquo;</p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Decision</span>
          <Option value="release_to_plug" icon={<ArrowRightCircle className="h-5 w-5" />} title="Release to plug" sub={`Pay ${money} to ${plugName ?? 'the assigned plug'}.`} />
          <Option value="refund_to_client" icon={<Undo2 className="h-5 w-5" />} title="Refund to client" sub={`Return ${money} to ${clientName}.`} />
        </div>

        <div>
          <FieldLabel htmlFor="resolve-note" hint="(optional, logged)">Resolution note</FieldLabel>
          <textarea
            id="resolve-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Why this outcome?"
            className="w-full resize-none rounded-2xl border border-pitch-black/10 bg-white px-4 py-3 text-sm text-pitch-black placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow"
          />
        </div>

        {error && <ModalError>{error}</ModalError>}
      </div>
    </Modal>
  );
}
