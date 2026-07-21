// src/app/api/webhooks/alatpay/route.ts
// Register this URL in ALATPay Dashboard > Settings > Business > Edit > Webhook URL.
//
// Confirmed payload shape: { Value: { Data: { Amount, OrderId, Id, Status, ... } } }.
// OrderId is our Job.id; Id is the ALATPay transaction id. Signature arrives in the
// "x-signature" header (HMAC-SHA256 of the RAW body, base64, ALATPAY_WEBHOOK_SECRET_KEY) —
// verify BEFORE touching the DB. IP whitelist fallback: 74.178.162.156.
//
// This runs the same DB transition as /check-status; both are idempotent, so whichever
// fires first wins and the other no-ops.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';
import { verifyAlatPayWebhookSignature, confirmTransaction } from '@/src/lib/alatpay';

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
    await q(
      `insert into "Transaction" (id, type, status, "rawWebhookPayload")
       values (gen_random_uuid(), 'COLLECTION', 'PENDING', $1)`,
      [payload]
    );
    return NextResponse.json({ received: true, note: 'no transaction Id in payload' });
  }

  const alatpayTransactionId: string = data.Id;
  const orderId: string | null = data.OrderId ?? null;
  const isSuccessful = String(data.Status).toLowerCase() === 'completed';

  // Idempotency — ALATPay retries at 30min / 1hr / 24hr on non-200 responses.
  const existing = await one(
    'select id, status from "Transaction" where "alatpayTransactionId" = $1',
    [alatpayTransactionId]
  );
  if (existing?.status === 'SUCCESSFUL') {
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  // Optional secondary check — re-query ALATPay directly (signature already proved trust).
  try {
    await confirmTransaction(alatpayTransactionId);
  } catch (err) {
    console.warn('confirmTransaction re-query failed, proceeding on signature trust alone', err);
  }

  const job = orderId ? await one('select id, amount from "Job" where id = $1', [orderId]) : null;

  await q(
    `insert into "Transaction"
       (id, "alatpayTransactionId", "jobId", amount, type, status, "rawWebhookPayload")
     values (gen_random_uuid(), $1, $2, $3, 'COLLECTION', $4, $5)
     on conflict ("alatpayTransactionId")
     do update set status = excluded.status,
                   "jobId" = excluded."jobId",
                   amount = excluded.amount,
                   "rawWebhookPayload" = excluded."rawWebhookPayload"`,
    [
      alatpayTransactionId,
      job?.id ?? null,
      job?.amount ?? data.Amount ?? 0,
      isSuccessful ? 'SUCCESSFUL' : 'PENDING',
      payload,
    ]
  );

  if (isSuccessful && job?.id) {
    await q('update "Job" set "escrowStatus" = $2 where id = $1', [job.id, 'locked']);
  }

  // Must return 200 or ALATPay will retry per its schedule.
  return NextResponse.json({ received: true, verified: isSuccessful });
}