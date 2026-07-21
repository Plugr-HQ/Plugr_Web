// src/app/api/jobs/[jobId]/pay/route.ts
// POST — Screen 3 "Pay Now". Generates a one-time ALATPay virtual account for this job's
// amount (the REAL money-movement leg). orderId = job id so the webhook / check-status can
// flip the job to 'paid_escrow'. Records a pending 'collection' row now.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';
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
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  const job = await repo.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  if (job.status === 'paid_escrow') {
    return NextResponse.json({ error: 'job is already paid' }, { status: 409 });
  }

  // Reuse an existing pending virtual account for this job instead of minting a new one on
  // revisit — otherwise a genuine payment to the first VA could be orphaned.
  const existing = await repo.findReusableCollection(job.id);
  if (existing?.alatpay_virtual_account) {
    return NextResponse.json({
      virtualAccount: normalizeVirtualAccount(existing.raw_webhook_payload),
      raw: existing.raw_webhook_payload,
      reused: true,
    });
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

  await repo.insertPendingCollection({
    jobId: job.id,
    alatpayTransactionId: va.transactionId,
    virtualAccount: va.accountNumber,
    amount: Number(job.amount),
    raw: result ?? null,
  });

  return NextResponse.json({ virtualAccount: va, raw: result });
}
