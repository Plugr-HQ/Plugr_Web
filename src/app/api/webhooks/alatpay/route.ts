// src/app/api/webhooks/alatpay/route.ts
// Register this URL in ALATPay Dashboard > Settings > Business > Edit > Webhook URL.
//
// Confirmed payload shape: { Value: { Data: { Amount, OrderId, Id, Status, ... } } }.
// OrderId is our job id; Id is the ALATPay transaction id. Signature arrives in the
// "x-signature" header (HMAC-SHA256 of the RAW body, base64, ALATPAY_WEBHOOK_SECRET_KEY) —
// verify BEFORE touching the DB. IP whitelist fallback: 74.178.162.156.
//
// This runs the same DB transition as /check-status; both are idempotent, so whichever
// fires first wins and the other no-ops.
//
// SOURCE RESOLUTION: unlike every other route, the webhook cannot be told which backend to
// use — ALATPay only sends us an OrderId. So we look the job up in the core tables first,
// then the hack_ demo tables, and act on whichever owns it.

import { NextResponse } from 'next/server';
import { getRepo, type Repo } from '@/src/lib/repo';
import { verifyAlatPayWebhookSignature, confirmTransaction } from '@/src/lib/alatpay';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Find the job in either backend. Returns the repo that owns it. */
async function locateJob(orderId: string | null) {
  if (!orderId || !UUID_RE.test(orderId)) return { repo: null as Repo | null, job: null };
  for (const source of ['core', 'hack'] as const) {
    const repo = getRepo(source);
    try {
      const job = await repo.getJob(orderId);
      if (job) return { repo, job };
    } catch (e) {
      console.warn(`webhook: job lookup failed against ${source}`, e);
    }
  }
  return { repo: null as Repo | null, job: null };
}

export async function POST(req: Request) {
  // Read as raw text FIRST — signature is computed over raw bytes, not parsed JSON.
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  // Verify authenticity BEFORE touching the database or trusting any payload field.
  if (!signature || !verifyAlatPayWebhookSignature(rawBody, signature)) {
    console.error('ALATPay webhook: signature mismatch, rejecting');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const data = payload?.Value?.Data;

  if (!data?.Id) {
    // Nothing to correlate on. Park it in the demo table rather than the production one so
    // uncorrelatable payloads never land in "transactions".
    await getRepo('hack').insertOrphanPayload(payload);
    return NextResponse.json({ received: true, note: 'no transaction Id in payload' });
  }

  const alatpayTransactionId: string = data.Id;
  const orderId: string | null = data.OrderId ?? null;
  const isSuccessful = String(data.Status).toLowerCase() === 'completed';

  const { repo: owner, job } = await locateJob(orderId);
  // If the job can't be found, still record the transaction — against the demo tables, which
  // is where an unrecognised order id is most likely to have come from.
  const repo = owner ?? getRepo('hack');

  // Idempotency — ALATPay retries at 30min / 1hr / 24hr on non-200 responses.
  const existing = await repo.findTxnByAlatpayId(alatpayTransactionId);
  if (existing?.status === 'successful') {
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  // Optional secondary check — re-query ALATPay directly (signature already proved trust).
  try {
    await confirmTransaction(alatpayTransactionId);
  } catch (err) {
    console.warn('confirmTransaction re-query failed, proceeding on signature trust alone', err);
  }

  await repo.upsertCollection({
    alatpayTransactionId,
    jobId: job?.id ?? null,
    amount: Number(job?.amount ?? data.Amount ?? 0),
    status: isSuccessful ? 'successful' : 'pending',
    raw: payload,
  });

  if (isSuccessful && job?.id) {
    await repo.setJobStatus(job.id, 'paid_escrow');
  }

  // Must return 200 or ALATPay will retry per its schedule.
  return NextResponse.json({ received: true, verified: isSuccessful });
}
