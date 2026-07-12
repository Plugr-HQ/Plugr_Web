// src/app/api/webhooks/alatpay/route.ts
// Register this URL in ALATPay Dashboard > Settings > Business > Edit > Webhook URL.
//
// Confirmed payload shape: { Value: { Data: { Amount, OrderId, Id, Status, ... } } }.
// OrderId is our hack_jobs.id; Id is the ALATPay transaction id. Signature arrives in the
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
      "insert into hack_transactions (type, status, raw_webhook_payload) values ('collection', 'pending', $1)",
      [payload]
    );
    return NextResponse.json({ received: true, note: 'no transaction Id in payload' });
  }

  const alatpayTransactionId: string = data.Id;
  const orderId: string | null = data.OrderId ?? null;
  const isSuccessful = String(data.Status).toLowerCase() === 'completed';

  // Idempotency — ALATPay retries at 30min / 1hr / 24hr on non-200 responses.
  const existing = await one(
    'select id, status from hack_transactions where alatpay_transaction_id = $1',
    [alatpayTransactionId]
  );
  if (existing?.status === 'successful') {
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  // Optional secondary check — re-query ALATPay directly (signature already proved trust).
  try {
    await confirmTransaction(alatpayTransactionId);
  } catch (err) {
    console.warn('confirmTransaction re-query failed, proceeding on signature trust alone', err);
  }

  const job = orderId ? await one('select id, amount from hack_jobs where id = $1', [orderId]) : null;

  await q(
    `insert into hack_transactions
       (alatpay_transaction_id, job_id, amount, type, status, raw_webhook_payload)
     values ($1, $2, $3, 'collection', $4, $5)
     on conflict (alatpay_transaction_id) where alatpay_transaction_id is not null
     do update set status = excluded.status,
                   job_id = excluded.job_id,
                   amount = excluded.amount,
                   raw_webhook_payload = excluded.raw_webhook_payload`,
    [alatpayTransactionId, job?.id ?? null, job?.amount ?? data.Amount ?? 0, isSuccessful ? 'successful' : 'pending', payload]
  );

  if (isSuccessful && job?.id) {
    await q("update hack_jobs set status = 'paid_escrow' where id = $1", [job.id]);
  }

  // Must return 200 or ALATPay will retry per its schedule.
  return NextResponse.json({ received: true, verified: isSuccessful });
}
