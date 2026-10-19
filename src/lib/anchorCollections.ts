// src/lib/anchorCollections.ts
// The one place that turns "money landed in a job's Anchor account" into Plugr state. Both the
// Anchor webhook and /api/jobs/[jobId]/check-status call syncAnchorCollections, so they can't drift
// apart and whichever runs first does the work while the other finds it done.
//
// It reads the account's LEDGER rather than trusting a particular webhook event: Anchor's docs say a
// bank transfer to an account number produces nip.inbound.* events with an InboundNIPTransfer, but a
// sandbox "Simulate Transfer" shows up as a Settlement credit for a Payment instead. Every settled
// credit appears in the ledger whichever way it arrived, so the ledger is the source of truth.
//
// Each credit becomes one SUCCESSFUL collection row keyed by its ledger transaction id. Because an
// Anchor account accepts any amount (unlike ALATPay's amount-locked account), the job only moves to
// paid_escrow once the settled credits cover the job amount, and only from 'requested' — a late
// top-up must not drag an accepted job back to paid_escrow.

import type { JobRow, Repo } from './repo';
import { listAccountTransactions } from './anchor';

export type AnchorSyncResult = {
  /** Settled credits on the account. */
  credits: number;
  /** Credits recorded for the first time by this call. */
  newCredits: number;
  /** Total settled into the account, in naira. */
  paidNaira: number;
  /** This call moved the job to paid_escrow. */
  credited: boolean;
};

export async function syncAnchorCollections(
  repo: Repo,
  job: JobRow,
  depositAccountId: string,
  recordedBy: { source: 'webhook' | 'check-status'; eventId?: string; eventType?: string }
): Promise<AnchorSyncResult> {
  const ledger = await listAccountTransactions(depositAccountId);
  const credits = (Array.isArray(ledger) ? ledger : []).filter(
    (t) => t?.id && t.attributes?.direction === 'Credit' && Number(t.attributes.amount) > 0
  );

  let newCredits = 0;
  for (const t of credits) {
    // Skip credits already on file so a client sitting on the pay page (polled every 3s) doesn't
    // rewrite the same rows over and over.
    if (await repo.findTxnByAnchorTransactionId(t.id)) continue;
    const inserted = await repo.upsertAnchorCollection({
      anchorTransactionId: t.id,
      jobId: job.id,
      amount: Number(t.attributes.amount) / 100, // kobo -> naira
      raw: {
        provider: 'anchor',
        depositAccountId,
        accountNumber: job.anchor_virtual_account_number,
        transaction: t,
        recordedBy,
      },
    });
    if (inserted) newCredits++;
  }

  const paidNaira = credits.reduce((sum, t) => sum + Number(t.attributes.amount), 0) / 100;

  let credited = false;
  if (job.status === 'requested') {
    const jobAmount = Number(job.amount ?? 0);
    if (jobAmount <= 0) {
      console.warn(`Anchor sync: job ${job.id} has no amount set, not marking paid`);
    } else if (paidNaira + 0.005 < jobAmount) {
      if (credits.length) console.warn(`Anchor sync: job ${job.id} underpaid so far (${paidNaira} of ${jobAmount})`);
    } else {
      await repo.setJobStatus(job.id, 'paid_escrow');
      credited = true;
    }
  }

  return { credits: credits.length, newCredits, paidNaira, credited };
}
