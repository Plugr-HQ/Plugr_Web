// src/app/api/jobs/[jobId]/pay/route.ts
// POST — Screen 3 "Pay Now". Generates a one-time ALATPay virtual account for this job's
// amount (the REAL money-movement leg). orderId = job id so the webhook / check-status can
// flip the job to 'paid_escrow'. Records a pending 'collection' row now.

import { NextResponse } from 'next/server';
import { q, one } from '@/src/lib/hackDb';
import { generateVirtualAccount, AlatPayError } from '@/src/lib/alatpay';

// Map ALATPay's numeric bank code to a display name. ALATPay's VA response has no
// bankName field — only virtualBankCode — so we derive the name from the code.
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
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await one(
    'select id, client_name, client_phone, job_description, amount, status from hack_jobs where id = $1',
    [jobId]
  );

  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (job.status === 'paid_escrow') {
    return NextResponse.json({ error: 'job is already paid' }, { status: 409 });
  }

  const { firstName, lastName } = splitName(job.client_name);

  let result: any;
  try {
    result = await generateVirtualAccount({
      amount: Number(job.amount),
      orderId: job.id,
      description: job.job_description || `Plugr escrow for job ${job.id}`,
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
    `insert into hack_transactions
       (job_id, alatpay_transaction_id, alatpay_virtual_account, amount, type, status, raw_webhook_payload)
     values ($1, $2, $3, $4, 'collection', 'pending', $5)`,
    [job.id, va.transactionId, va.accountNumber, Number(job.amount), result ?? null]
  );

  return NextResponse.json({ virtualAccount: va, raw: result });
}
