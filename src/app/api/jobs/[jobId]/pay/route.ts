// src/app/api/jobs/[jobId]/pay/route.ts
// POST — Screen 3 "Pay Now". Gives the client an account number to transfer this job's amount into.
//
// Anchor (default): one dedicated Anchor DepositAccount per job (createJobDepositAccount), stored
// on the job so the Anchor webhook and /check-status can tie incoming money back to it. The same
// account is returned on every revisit — never a second one — so a payment can't be orphaned.
//
// ALATPay (legacy): jobs that were given an ALATPay virtual account before the switch keep it while
// it's still valid (24h), so a client mid-payment isn't moved to a different account number.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';
import {
  createJobDepositAccount,
  fetchJobVirtualAccount,
  AnchorAccountNumberPendingError,
  AnchorError,
} from '@/src/lib/anchor';

// Map ALATPay's numeric bank code to a display name. ALATPay's VA response has no
// bankName field — only virtualBankCode — so we derive the name from the code.
const BANK_CODES: Record<string, string> = { '035': 'Wema Bank' };

function normalizeAlatpayAccount(data: any) {
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
    provider: 'alatpay' as const,
  };
}

function anchorAccount(va: { virtualAccountNumber: string; bankName: string; accountName: string | null }) {
  return {
    accountNumber: va.virtualAccountNumber,
    bankName: va.bankName,
    accountName: va.accountName,
    provider: 'anchor' as const,
  };
}

function anchorFailure(err: unknown) {
  const context = err instanceof AnchorError ? err.context : String(err);
  console.error('Anchor account setup failed', context);
  return NextResponse.json({ error: 'could not set up a payment account', detail: context }, { status: 502 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const repo = getRepo(resolveSource(request));

  // Optional amount — the WhatsApp/hosted pay page sends the agreed escrow amount for
  // bot-booked jobs, which are created with no price. Ignored once an amount is already set.
  let bodyAmount: number | undefined;
  try {
    const body = await request.json();
    const n = Number(body?.amount);
    if (Number.isFinite(n) && n > 0) bodyAmount = Math.round(n);
  } catch {
    /* no body — in-app flow where the job already carries its amount */
  }

  let job = await repo.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  // paid_escrow and every later state (accepted, completed, released) mean the money is in.
  if (job.status !== 'requested') {
    return NextResponse.json({ error: 'job is already paid' }, { status: 409 });
  }

  // If the job has no amount yet, persist the client-confirmed one before handing out an account, so
  // the payment check and the eventual release move the correct sum. Never overwrite a set amount.
  if (!(Number(job.amount) > 0)) {
    if (!bodyAmount) {
      return NextResponse.json({ error: 'an amount is required to start payment' }, { status: 400 });
    }
    await repo.setJobAmount(job.id, bodyAmount);
    job = { ...job, amount: bodyAmount };
  }

  // Revisit of a job that already has its Anchor account: hand back the same number.
  if (job.anchor_deposit_account_id) {
    try {
      const va = await fetchJobVirtualAccount(job.anchor_deposit_account_id);
      if (!job.anchor_virtual_account_number) {
        await repo.setJobAnchorAccount(job.id, job.anchor_deposit_account_id, va.virtualAccountNumber);
      }
      return NextResponse.json({ virtualAccount: anchorAccount(va), reused: true });
    } catch (err) {
      if (err instanceof AnchorAccountNumberPendingError) {
        return NextResponse.json({ error: 'your account number is still being set up — try again in a moment' }, { status: 503 });
      }
      return anchorFailure(err);
    }
  }

  // Legacy: an ALATPay account handed out before the switch, still within its 24h validity.
  const legacy = await repo.findReusableCollection(job.id);
  if (legacy?.alatpay_virtual_account) {
    const va = normalizeAlatpayAccount(legacy.raw_webhook_payload);
    if (va.expiresAt && new Date(va.expiresAt).getTime() > Date.now()) {
      return NextResponse.json({ virtualAccount: va, reused: true });
    }
  }

  let created: Awaited<ReturnType<typeof createJobDepositAccount>>;
  try {
    created = await createJobDepositAccount(job.id);
  } catch (err) {
    if (err instanceof AnchorAccountNumberPendingError) {
      // The account exists; its number just isn't ready. Keep the account on the job so the next
      // attempt picks it up instead of opening another.
      await repo.setJobAnchorAccount(job.id, err.depositAccountId, null);
      return NextResponse.json({ error: 'your account number is still being set up — try again in a moment' }, { status: 503 });
    }
    return anchorFailure(err);
  }

  const attached = await repo.setJobAnchorAccount(job.id, created.depositAccountId, created.virtualAccountNumber);
  if (!attached) {
    // A concurrent request attached its account first — give the client that one, not ours.
    const current = await repo.getJob(job.id);
    console.warn(`pay: job ${job.id} already had an Anchor account; discarding ${created.depositAccountId}`);
    if (current?.anchor_deposit_account_id) {
      try {
        const va = await fetchJobVirtualAccount(current.anchor_deposit_account_id);
        return NextResponse.json({ virtualAccount: anchorAccount(va), reused: true });
      } catch (err) {
        return anchorFailure(err);
      }
    }
    return NextResponse.json({ error: 'could not attach a payment account' }, { status: 409 });
  }

  return NextResponse.json({ virtualAccount: anchorAccount(created), reused: false });
}
