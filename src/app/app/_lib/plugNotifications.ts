// src/app/app/_lib/plugNotifications.ts
// Notifications are DERIVED from job/escrow state — there is no separate notification-writing
// system. The plug dashboard already returns every job (with its status + real timestamps) and
// every payout transaction, so each notification is just a job's current milestone or a payout
// event, sorted most-recent-first. Read/unread is tracked client-side via markNotifsSeen().
//
// The job status vocabulary comes from the backend's PlugsService.toJobRow:
//   requested → paid_escrow (escrow funded) → accepted → completed → released (paid).
// The spec also lists quote sent/accepted/declined, but the current schema has no quote flow, so
// those are intentionally not fabricated — only states the data actually captures are shown.

export type PlugNotifKind = 'request' | 'funded' | 'accepted' | 'completed' | 'payout' | 'withdrawal';

export type PlugNotif = {
  id: string;
  kind: PlugNotifKind;
  title: string;
  body: string;
  at: number; // epoch ms
};

const naira = (n: unknown) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
const ms = (d: unknown): number => {
  const t = d ? new Date(d as string).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

type JobRow = {
  id: string;
  status: string;
  client_name?: string | null;
  job_description?: string | null;
  amount?: number | null;
  created_at?: string | null;
  completed_at?: string | null;
  escrow_released_at?: string | null;
};

type Withdrawal = { id: string; amount?: number | null; status?: string | null; created_at?: string | null };

/** One notification per job (its current milestone) + one per payout transaction. */
export function deriveNotifications(dashboard: { allJobs?: JobRow[]; withdrawals?: Withdrawal[] } | null): PlugNotif[] {
  if (!dashboard) return [];
  const out: PlugNotif[] = [];

  for (const j of dashboard.allJobs ?? []) {
    const who = j.client_name || 'A client';
    const what = j.job_description || 'a job';
    const amt = naira(j.amount);

    switch (j.status) {
      case 'requested':
        out.push({ id: `${j.id}:request`, kind: 'request', title: 'New job request', body: `${who} sent a new request — ${what}.`, at: ms(j.created_at) });
        break;
      case 'paid_escrow':
        out.push({ id: `${j.id}:funded`, kind: 'funded', title: 'Escrow funded', body: `${who} funded ${amt} in escrow for ${what}. You can start the job.`, at: ms(j.created_at) });
        break;
      case 'accepted':
        out.push({ id: `${j.id}:accepted`, kind: 'accepted', title: 'Job accepted', body: `${what} is confirmed and in progress with ${who}.`, at: ms(j.created_at) });
        break;
      case 'completed':
        out.push({ id: `${j.id}:completed`, kind: 'completed', title: 'Job marked complete', body: `${what} was marked complete. Payout releases after the review window.`, at: ms(j.completed_at) || ms(j.created_at) });
        break;
      case 'released':
      case 'withdrawn':
        out.push({ id: `${j.id}:payout`, kind: 'payout', title: 'Payout sent', body: `${amt} for ${what} was released to your wallet.`, at: ms(j.escrow_released_at) || ms(j.created_at) });
        break;
      default:
        break;
    }
  }

  for (const w of dashboard.withdrawals ?? []) {
    const status = (w.status || 'processing').toLowerCase();
    out.push({
      id: `${w.id}:withdrawal`,
      kind: 'withdrawal',
      title: status === 'successful' ? 'Payout completed' : 'Payout processing',
      body: `${naira(w.amount)} withdrawal to your bank ${status === 'successful' ? 'completed' : 'is processing'}.`,
      at: ms(w.created_at),
    });
  }

  return out.sort((a, b) => b.at - a.at);
}

/** Compact relative time, e.g. "just now", "3h ago", "2d ago", or a short date. */
export function relativeTime(at: number): string {
  if (!at) return '';
  const diff = Date.now() - at;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}
