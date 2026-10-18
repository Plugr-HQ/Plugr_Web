// src/app/api/webhooks/anchor/route.ts
// Register this URL in the Anchor Dashboard > Developers > Webhooks, subscribed to
// nip.inbound.received and nip.inbound.completed, with "include related resources" enabled (saves
// a round trip per event). The webhook token chosen there goes in ANCHOR_WEBHOOK_TOKEN.
//
// Confirmed against Anchor's docs (Oct 18 2026). nip.inbound.completed = funds settled into the
// DepositAccount ("listen to this event to give value"); nip.inbound.received = transfer still
// pending. Payload shape (docs show it both wrapped in { data } and bare, so both are accepted):
//   { data: { id, type, attributes: { createdAt },
//             relationships: { transfer: { data: { id, type: 'InboundNIPTransfer' } },
//                              account:  { data: { id, type: 'DepositAccount' } } } },
//     included?: [ { type: 'InboundNIPTransfer', id, attributes: { amount, status, ... } }, ... ] }
// The event itself carries NO amount: it comes from the included InboundNIPTransfer, or from
// GET /inbound-transfers/{id} when `included` is off. Amounts are kobo; jobs are stored in naira.
// The DepositAccount id is our only correlation key back to the job ("Job"."anchorDepositAccountId").
// Signature arrives in "x-anchor-signature" — verify BEFORE touching the DB (see the open question
// on verifyAnchorWebhookSignature in src/lib/anchor.ts). Webhooks come from 18.133.55.102.
//
// Unlike ALATPay's amount-locked one-time account, an Anchor DepositAccount accepts any transfer,
// so a job only moves to paid_escrow once its successful collections cover the job amount, and only
// from 'requested' — a late top-up must not drag an accepted job back to paid_escrow.

import { NextResponse } from 'next/server';
import { getRepo, type JobRow, type Repo } from '@/src/lib/repo';
import {
  verifyAnchorWebhookSignature,
  fetchInboundTransfer,
  type AnchorInboundTransfer,
} from '@/src/lib/anchor';

const INBOUND_EVENTS = new Set(['nip.inbound.received', 'nip.inbound.completed']);

/** Find the job. Returns the repo that owns it (or nulls if not found). */
async function locateJob(depositAccountId: string | null) {
  if (!depositAccountId) return { repo: null as Repo | null, job: null as JobRow | null };
  const repo = getRepo('core');
  try {
    const job = await repo.getJobByAnchorDepositAccountId(depositAccountId);
    if (job) return { repo, job };
  } catch (e) {
    // Until the anchor* columns exist on "Job" (sql/core_schema_additions.sql §5) this throws
    // "column does not exist" — the payload is still recorded below, just without a job.
    console.warn('Anchor webhook: job lookup failed', e);
  }
  return { repo: null as Repo | null, job: null as JobRow | null };
}

/** The InboundNIPTransfer for this event: from `included` if Anchor sent it, else fetched. */
async function resolveTransfer(payload: any, transferId: string): Promise<AnchorInboundTransfer | null> {
  const included: any[] = Array.isArray(payload?.included) ? payload.included : [];
  const fromIncluded = included.find((r) => r?.type === 'InboundNIPTransfer' && r?.id === transferId);
  if (fromIncluded) return fromIncluded;
  try {
    return await fetchInboundTransfer(transferId);
  } catch (err) {
    console.warn('Anchor webhook: fetchInboundTransfer failed', err);
    return null;
  }
}

export async function POST(req: Request) {
  // Read as raw text FIRST — signature is computed over raw bytes, not parsed JSON.
  const rawBody = await req.text();
  const signature = req.headers.get('x-anchor-signature');

  if (!process.env.ANCHOR_WEBHOOK_TOKEN) {
    console.error('Anchor webhook: ANCHOR_WEBHOOK_TOKEN is not set, cannot verify — rejecting');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  // Verify authenticity BEFORE touching the database or trusting any payload field.
  if (!signature || !verifyAnchorWebhookSignature(rawBody, signature)) {
    console.error('Anchor webhook: signature mismatch, rejecting');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const event = payload?.data ?? payload;
  const eventType: string = String(event?.type ?? '');

  // Anything other than an inbound transfer (customer.*, account.*, ...) isn't a payment — ack it
  // so Anchor stops retrying, but don't write it into "transactions".
  if (!INBOUND_EVENTS.has(eventType)) {
    console.info(`Anchor webhook: ignoring ${eventType || 'untyped'} event ${event?.id ?? ''}`);
    return NextResponse.json({ received: true, note: 'event type not handled' });
  }

  const transferId: string | null = event?.relationships?.transfer?.data?.id ?? null;
  const depositAccountId: string | null = event?.relationships?.account?.data?.id ?? null;

  if (!transferId) {
    // Nothing to correlate on — record the raw payload for later inspection.
    await getRepo('core').insertOrphanPayload(payload);
    return NextResponse.json({ received: true, note: 'no transfer id in payload' });
  }

  const { repo: owner, job } = await locateJob(depositAccountId);
  // If the job can't be found, still record the transaction so nothing is silently dropped.
  const repo = owner ?? getRepo('core');

  // Idempotency — Anchor retries on non-200 responses, and received/completed share a transfer id.
  const existing = await repo.findTxnByAnchorTransferId(transferId);
  if (existing?.status === 'successful') {
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  const transfer = await resolveTransfer(payload, transferId);
  if (!transfer) {
    // No amount to credit. Keep the event on file, then return non-200 so Anchor retries.
    await repo.upsertAnchorCollection({
      anchorTransferId: transferId,
      jobId: job?.id ?? null,
      amount: 0,
      status: 'pending',
      raw: payload,
    });
    return NextResponse.json({ error: 'could not resolve inbound transfer' }, { status: 502 });
  }

  const transferAccountId = transfer.relationships?.account?.data?.id;
  if (depositAccountId && transferAccountId && transferAccountId !== depositAccountId) {
    console.error(
      `Anchor webhook: transfer ${transferId} belongs to ${transferAccountId}, event says ${depositAccountId}`
    );
  }
  const accountMatches = !transferAccountId || !depositAccountId || transferAccountId === depositAccountId;
  const transferStatus = String(transfer.attributes?.status ?? '').toUpperCase();
  const isSuccessful =
    eventType === 'nip.inbound.completed' && transferStatus === 'COMPLETED' && accountMatches;
  if (eventType === 'nip.inbound.completed' && transferStatus !== 'COMPLETED') {
    console.warn(`Anchor webhook: completed event but transfer ${transferId} status is "${transferStatus}"`);
  }

  const amountNaira = Number(transfer.attributes?.amount ?? 0) / 100; // kobo -> naira

  await repo.upsertAnchorCollection({
    anchorTransferId: transferId,
    jobId: job?.id ?? null,
    amount: amountNaira,
    status: isSuccessful ? 'successful' : 'pending',
    raw: payload,
  });

  let credited = false;
  if (isSuccessful && job?.id) {
    const jobAmount = Number(job.amount ?? 0);
    const paid = (await repo.txnsForJob(job.id))
      .filter((t) => t.type === 'collection' && t.status === 'successful')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (job.status !== 'requested') {
      console.info(`Anchor webhook: job ${job.id} already ${job.status}, recorded transfer only`);
    } else if (jobAmount <= 0) {
      console.warn(`Anchor webhook: job ${job.id} has no amount set, not marking paid`);
    } else if (paid + 0.005 < jobAmount) {
      console.warn(`Anchor webhook: job ${job.id} underpaid so far (${paid} of ${jobAmount})`);
    } else {
      await repo.setJobStatus(job.id, 'paid_escrow');
      credited = true;
    }
  }

  // Must return 200 or Anchor will retry.
  return NextResponse.json({ received: true, verified: isSuccessful, credited });
}
