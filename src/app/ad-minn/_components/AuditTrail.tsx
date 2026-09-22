// src/app/ad-minn/_components/AuditTrail.tsx
// "Reviewers" tab on the admin dashboard. Shows:
//   1. A leaderboard card per admin — name, accounts reviewed, last active.
//   2. A chronological log of the last 50 BVN/NIN reveal actions across all admins.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldAlert, UserCheck, Clock, Eye, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/src/lib/api-client';
import { TableCard, Thead, rowClass, cellClass, Chip } from './admin-ui';
import { cn } from '@/src/lib/utils';

type AdminStat = {
  adminId: string;
  name: string;
  email: string | null;
  accountsReviewed: number;
  lastActiveAt: string;
};

type AuditLogEntry = {
  id: string;
  adminId: string;
  adminName: string;
  targetPlugId: string;
  targetPlugName: string | null;
  action: 'BVN_VIEW' | 'NIN_VIEW' | 'BVN_NIN_VIEW';
  performedAt: string;
};

type AuditData = {
  admins: AdminStat[];
  recentLogs: AuditLogEntry[];
};

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ACTION_CHIP: Record<AuditLogEntry['action'], { label: string; tone: 'blue' | 'amber' | 'green' }> = {
  BVN_VIEW: { label: 'BVN Viewed', tone: 'amber' },
  NIN_VIEW: { label: 'NIN Viewed', tone: 'blue' },
  BVN_NIN_VIEW: { label: 'BVN + NIN', tone: 'green' },
};

export function AuditTrail() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/audit-trail', {}, { redirectTo: '/ad-minn/login' });
      setData(res);
    } catch (e: any) {
      if (e?.message !== 'Session expired') setError(e?.message ?? 'Could not load the audit trail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate">
        <Loader2 className="h-5 w-5 animate-spin text-gold" /> Loading audit trail…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  const admins = data?.admins ?? [];
  const logs = data?.recentLogs ?? [];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-pitch-black">Admin Reviewers</h2>
          <p className="mt-0.5 text-xs text-slate">Track which admins reviewed BVN and NIN records, and when.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-pill border border-pitch-black/10 px-3 py-1.5 text-xs font-bold text-pitch-black hover:border-gold disabled:opacity-40"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Per-admin stats cards */}
      {admins.length === 0 ? (
        <div className="rounded-[22px] border border-pitch-black/6 bg-white p-10 text-center card-shadow">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-slate/40" />
          <h4 className="font-bold text-pitch-black">No reviewer activity yet</h4>
          <p className="mt-1 text-sm text-slate">
            Audit entries appear here the first time an admin reveals a BVN or NIN.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin, i) => (
            <div
              key={admin.adminId}
              className={cn(
                'rounded-[22px] border border-pitch-black/6 bg-white p-5 card-shadow rise',
                i === 1 && 'rise-1',
                i === 2 && 'rise-2',
              )}
            >
              <div className="mb-4 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                  {admin.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-pitch-black">{admin.name}</p>
                  {admin.email && <p className="truncate text-xs text-slate">{admin.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-bone/60 p-3 text-center">
                  <p className="font-display text-2xl font-bold text-pitch-black">{admin.accountsReviewed}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate">
                    Accounts Reviewed
                  </p>
                </div>
                <div className="rounded-2xl bg-bone/60 p-3 text-center">
                  <UserCheck className="mx-auto mb-1 h-5 w-5 text-gold" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate">Last Active</p>
                  <p className="mt-0.5 truncate text-[10px] text-pitch-black">
                    {when(admin.lastActiveAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent audit log */}
      <div>
        <h3 className="mb-3 font-display text-base font-bold text-pitch-black">Recent Activity</h3>
        {logs.length === 0 ? (
          <div className="rounded-[18px] border border-pitch-black/6 bg-white py-8 text-center text-sm text-slate">
            No audit log entries yet.
          </div>
        ) : (
          <TableCard>
            <Thead
              cols={[
                { label: 'Admin' },
                { label: 'Action' },
                { label: 'Account (Plug)' },
                { label: 'When' },
              ]}
            />
            <tbody>
              {logs.map((log) => {
                const chip = ACTION_CHIP[log.action] ?? { label: log.action, tone: 'neutral' as any };
                return (
                  <tr key={log.id} className={rowClass}>
                    <td className={cn(cellClass, 'font-bold text-pitch-black text-sm')}>
                      <div className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 shrink-0 text-slate" />
                        {log.adminName}
                      </div>
                    </td>
                    <td className={cellClass}>
                      <Chip tone={chip.tone}>{chip.label}</Chip>
                    </td>
                    <td className={cn(cellClass, 'text-sm text-slate')}>
                      {log.targetPlugName ?? (
                        <span className="font-mono text-xs">{log.targetPlugId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className={cn(cellClass, 'whitespace-nowrap text-xs text-slate')}>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {when(log.performedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </div>
    </div>
  );
}
