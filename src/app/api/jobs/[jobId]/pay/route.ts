// src/app/api/jobs/[jobId]/pay/route.ts
// POST — Screen 3 "Pay Now". Generates a one-time ALATPay virtual account for this job's
// amount (the REAL money-movement leg). orderId = job id so the webhook / check-status can
// flip the job's escrow to 'locked'. Records a pending 'collection' row now.

import { NextResponse } from 'next/server';
import { q, one } from '@/src/lib/hackDb';
import { generateVirtualAccount, AlatPayError } from '@/src/lib/alatpay';
import { requireJobParty, UnauthorizedError } from '@/src/lib/auth';

const BANK_CODES: Record<string, string> = { '035': 'Wema Bank' };

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || 'Plugr', lastName: parts.slice(1).join(' ') || 'Client' };
}

function normalizeVirtualAccount(data: any) {
  const d = data?.data ?? data ?? {};
  return {
    accountNumber: d.virtualBankAccountNumber ?? null,
    bankCode: d.virtualBankCode ?? null,
    bankName: d.virtualBankCode
      ? (BANK_CODES[d.virtualBankCode] ?? `Bank code ${d.virtualBankCode}`)
      : null,
    accountName: d.virtualBankAccountName ?? d.accountName ?? null,
    transactionId: d.transactionId ?? d.id ?? null,
    amount: d.amount ?? null,
    expiresAt: d.expiredAt ?? d.expiresAt ?? null,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    `select j.id, j.amount, j.status, j."escrowStatus", j.description,
            j."clientId", j."plugId", u.name as client_name, u.phone as client_phone
     from "Job" j
     join "User" u on u.id = j."clientId"
     where j.id = $1`,
    [jobId]
  );

  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }

  try {
    await requireJobParty(request, job);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  if (job.escrowStatus === 'locked') {
    return NextResponse.json({ error: 'job is already paid' }, { status: 409 });
  }

  // Reuse an existing pending virtual account for this job instead of minting a new one on
  // revisit — otherwise a genuine payment to the first VA could be orphaned.
  const existing = await one(
    `select "alatpayVirtualAccount", "rawWebhookPayload" from "Transaction"
     where "jobId" = $1 and type = 'COLLECTION' and status = 'PENDING' and "alatpayVirtualAccount" is not null
     order by "createdAt" desc limit 1`,
    [job.id]
  );
  if (existing?.alatpayVirtualAccount) {
    return NextResponse.json({
      virtualAccount: normalizeVirtualAccount(existing.rawWebhookPayload),
      raw: existing.rawWebhookPayload,
      reused: true,
    });
  }

  const { firstName, lastName } = splitName(job.client_name);

  let result: any;
  try {
    result = await generateVirtualAccount({
      amount: Number(job.amount),
      orderId: job.id,
      description: job.description || `Plugr escrow for job ${job.id}`,
      customer: {
        email: 'demo-client@getplugr.com',
        phone: job.client_phone || '08000000000',
        firstName,
        lastName,
      },
    });
  } catch (err) {
    const context = err instanceof AlatPayError ? err.context : String(err);
    console.error('generateVirtualAccount failed', context);
    return NextResponse.json(
      { error: 'could not generate virtual account', detail: context },
      { status: 502 }
    );
  }

  const va = normalizeVirtualAccount(result);

  await q(
    `insert into "Transaction"
       (id, "jobId", "alatpayTransactionId", "alatpayVirtualAccount", amount, type, status, "rawWebhookPayload")
     values (gen_random_uuid(), $1, $2, $3, $4, 'COLLECTION', 'PENDING', $5)`,
    [job.id, va.transactionId, va.accountNumber, Number(job.amount), result ?? null]
  );

  return NextResponse.json({ virtualAccount: va, raw: result });
}