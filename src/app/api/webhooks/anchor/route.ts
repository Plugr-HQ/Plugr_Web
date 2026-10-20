// src/app/api/webhooks/anchor/route.ts
// Register this URL in the Anchor Dashboard > Settings > Developers > Webhooks, subscribed to the
// money-in events — Nip "Inbound Received" / "Inbound Completed" (what Anchor's docs say a bank
// transfer to an account number produces) and Payment "Settled" (what a sandbox Simulate Transfer
// produced). The secret code chosen there (max 10 characters) goes in ANCHOR_WEBHOOK_TOKEN.
//
// The webhook is a TRIGGER, not the source of truth. Anchor events are minimal (no amount) and the
// event type depends on how the money arrived, so this route only works out which job's account
// the event is about, then reads that account's ledger via syncAnchorCollections — exactly what
// /api/jobs/[jobId]/check-status does — and records any new settled credits there.
//
// Signature arrives in "x-anchor-signature" (Base64 of the hex HMAC-SHA1 digest, confirmed against a
// real delivery) — verify BEFORE touching the DB. Webhooks come from 18.133.55.102.

import { NextResponse } from 'next/server';
import { getRepo, type JobRow } from '@/src/lib/repo';
import { verifyAnchorWebhookSignature } from '@/src/lib/anchor';
import { syncAnchorCollections } from '@/src/lib/anchorCollections';

// Events that mean money is moving into an account. If one of these can't be tied to a job, its raw
// payload is kept (insertOrphanPayload) so nothing silently drops.
const MONEY_IN_EVENTS = new Set([
  'nip.inbound.received',
  'nip.inbound.completed',
  'nip.incomingTransfer.received',
  'payment.received',
  'payment.settled',
  'payin.received',
]);

/** The DepositAccount an event is about — on the event itself, or on an included resource. */
function depositAccountIdFrom(payload: any): string | null {
  const event = payload?.data ?? payload;
  const included: any[] = Array.isArray(payload?.included) ? payload.included : [];
  for (const rel of [event?.relationships, ...included.map((r) => r?.relationships)]) {
    for (const key of ['account', 'settlementAccount', 'depositAccount']) {
      const d = rel?.[key]?.data;
      if (d?.type === 'DepositAccount' && d.id) return d.id;
    }
  }
  return included.find((r) => r?.type === 'DepositAccount')?.id ?? null;
}

async function locateJob(depositAccountId: string): Promise<JobRow | null> {
  try {
    return await getRepo('core').getJobByAnchorDepositAccountId(depositAccountId);
  } catch (e) {
    console.warn('Anchor webhook: job lookup failed', e);
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
  const eventType = String(event?.type ?? '');
  const eventId: string | undefined = event?.id ?? req.headers.get('x-anchor-event-id') ?? undefined;
  const isMoneyIn = MONEY_IN_EVENTS.has(eventType);

  const depositAccountId = depositAccountIdFrom(payload);
  const job = depositAccountId ? await locateJob(depositAccountId) : null;

  if (!job) {
    if (isMoneyIn) {
      // Money moved on an account we can't tie to a job — keep it for inspection.
      await getRepo('core').insertOrphanPayload(payload);
      return NextResponse.json({ received: true, note: 'no job for this account; payload recorded' });
    }
    // customer.*, account.opened (fires before the job is linked to its account), etc.
    return NextResponse.json({ received: true, note: 'event not for a job account' });
  }

  try {
    const result = await syncAnchorCollections(getRepo('core'), job, depositAccountId!, {
      source: 'webhook',
      eventId,
      eventType,
    });
    // Must return 200 or Anchor will retry.
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    // Couldn't read the ledger (Anchor API down?). Keep the event, and return non-200 so Anchor retries.
    console.error('Anchor webhook: ledger sync failed', err);
    if (isMoneyIn) await getRepo('core').insertOrphanPayload(payload);
    return NextResponse.json({ error: 'could not read account ledger' }, { status: 502 });
  }
}
