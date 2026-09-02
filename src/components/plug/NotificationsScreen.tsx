// src/components/plug/NotificationsScreen.tsx
// PLG notifications — job/escrow status updates only (no platform announcements). Each item is
// derived from the plug's own jobs/payouts (see plugNotifications.ts), most recent first, with
// unread items visually distinct. Opening the screen marks everything seen.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Bell, Inbox, Wallet, CheckCircle2, PlayCircle, Banknote, ArrowDownToLine } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import { getPlugId, getNotifsSeenAt, markNotifsSeen } from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';
import { deriveNotifications, relativeTime, type PlugNotifKind } from '@/src/app/app/_lib/plugNotifications';
import { PlugShell, EmptyState } from './PlugChrome';

const ICON: Record<PlugNotifKind, React.ComponentType<{ className?: string }>> = {
  request: Inbox,
  funded: Wallet,
  accepted: PlayCircle,
  completed: CheckCircle2,
  payout: ArrowDownToLine,
  withdrawal: Banknote,
};

export function NotificationsScreen({ base }: { base: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Snapshot the "seen" cutoff once, on mount, so items stay marked unread for THIS view even
  // after we write the new seen-time below.
  const seenAt = useRef(getNotifsSeenAt());

  useEffect(() => {
    const id = getPlugId();
    if (!id) return;
    jsonFetch(withSource(`/api/plugs/${id}/dashboard`, base))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  const notifs = useMemo(() => deriveNotifications(data), [data]);

  // Mark everything seen once the list has rendered — next visit these read as read.
  useEffect(() => {
    if (!loading && notifs.length) markNotifsSeen();
  }, [loading, notifs.length]);

  return (
    <PlugShell base={base} plug={data?.plug ?? null}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-pitch-black">Notifications</h1>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-pitch-black/[0.04] text-pitch-black">
          <Bell className="h-[18px] w-[18px]" />
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : notifs.length === 0 ? (
        <Card className="p-2 rise">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Nothing new"
            body="Job requests, escrow updates, and payouts will land here as they happen."
          />
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {notifs.map((n, i) => {
            const unread = n.at > seenAt.current;
            const Icon = ICON[n.kind] ?? Bell;
            return (
              <li key={n.id}>
                <Card
                  className={cn(
                    'flex items-start gap-3 p-4 rise transition-colors',
                    i < 4 && `rise-${i}`,
                    unread && 'border-gold/40 bg-gold/[0.06]',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
                      unread ? 'bg-gold/15 text-gold' : 'bg-pitch-black/[0.04] text-slate',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-pitch-black">{n.title}</p>
                      {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-label="unread" />}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate/70">{relativeTime(n.at)}</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PlugShell>
  );
}
