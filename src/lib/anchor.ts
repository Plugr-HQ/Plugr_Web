// src/lib/anchor.ts
// Confirmed against Anchor's own docs (docs.getanchor.co, Oct 18 2026). Mirrors the shape of
// src/lib/alatpay.ts so the two providers read the same way in the codebase.
//
// Two things worth knowing before extending this file:
//
// 1. Anchor's API follows the JSON:API spec — every request/response body is wrapped in
//    { data: { type, attributes, relationships } }. anchorRequest() returns the unwrapped
//    `data` object so callers don't repeat that envelope everywhere.
//
// 2. Unlike ALATPay's generateVirtualAccount (a lightweight, no-KYC, 24h one-time virtual
//    account scoped to an orderId), Anchor's unit of collection is a DepositAccount — a real
//    bank account that must belong to an already-KYC'd Customer. There is no per-transaction
//    "virtual account scoped to a job id" primitive here. createDepositAccount() below creates
//    a fresh DepositAccount (and therefore a fresh virtual account number) per call, which is
//    the closest equivalent. DECIDED: one Plugr-owned master Customer (created once by
//    scripts/create-anchor-master-customer.ts, id in ANCHOR_MASTER_CUSTOMER_ID) and a fresh
//    DepositAccount per job — see createJobDepositAccount() at the bottom of this file.
//
// 3. A DepositAccount's own attributes.accountNumber is MASKED ("*****1146" — confirmed live
//    against the sandbox, Oct 18 2026). The number a payer actually transfers into is a separate
//    AccountNumber resource, listed by GET /api/v1/account-numbers?AccountId=<depositAccountId>,
//    and it is generated asynchronously after the DepositAccount (accountNumber.created event).

const ANCHOR_ENV = process.env.ANCHOR_ENV === 'production' ? 'production' : 'sandbox';
const ANCHOR_BASE_URL =
  process.env.ANCHOR_BASE_URL ||
  (ANCHOR_ENV === 'production' ? 'https://api.getanchor.co' : 'https://api.sandbox.getanchor.co');
const ANCHOR_API_KEY = process.env.ANCHOR_API_KEY!;

type JsonApiDoc<T> = { data: T; included?: unknown[] };

async function anchorRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ANCHOR_BASE_URL}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-anchor-key': ANCHOR_API_KEY,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new AnchorError(res.status, body);
  }

  return (body as JsonApiDoc<T>)?.data ?? (body as T);
}

export class AnchorError extends Error {
  statusCode: number;
  context: unknown;

  constructor(statusCode: number, context: unknown) {
    const firstError =
      typeof context === 'object' && context && Array.isArray((context as any).errors)
        ? (context as any).errors[0]
        : null;
    super(firstError?.detail || firstError?.title || 'Anchor request failed');
    this.statusCode = statusCode;
    this.context = context;
  }

  isBadRequest() { return this.statusCode === 400; }
  isUnauthorized() { return this.statusCode === 401; }
  isForbidden() { return this.statusCode === 403; }
  isNotFound() { return this.statusCode === 404; }
  isValidationError() { return this.statusCode === 422; }
  isServerError() { return this.statusCode >= 500; }
}

// ── Banks ──────────────────────────────────────────────────────────────────────────────────

export type AnchorBank = {
  id: string;
  type: 'Bank';
  attributes: { name: string; cbnCode: string; nipCode: string };
};

/** GET /api/v1/banks — confirm the exact path against the live sandbox; derived from the
 *  "fetchbanks" reference slug, not seen as a full worked example in the docs pulled so far. */
export async function listBanks(): Promise<AnchorBank[]> {
  return anchorRequest<AnchorBank[]>('/api/v1/banks');
}

/** GET /api/v1/payments/verify-account — path derived from the "fetch-account-details"
 *  reference slug; confirm against the live sandbox before relying on it. */
export async function verifyAccountNumber(accountNumber: string, bankId: string) {
  return anchorRequest(
    `/api/v1/payments/verify-account?accountNumber=${encodeURIComponent(accountNumber)}&bankId=${encodeURIComponent(bankId)}`
  );
}

// ── Customers ──────────────────────────────────────────────────────────────────────────────

type FullName = { firstName: string; lastName: string; middleName?: string; maidenName?: string };
type Address = {
  addressLine_1: string;
  addressLine_2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "NG"
};

export type CreateIndividualCustomerParams = {
  fullName: FullName;
  address: Address;
  email: string;
  phoneNumber: string;
  /** Required if a DepositAccount will be created for this customer. */
  identificationLevel2?: { dateOfBirth: string; gender: 'Male' | 'Female'; bvn: string };
  metadata?: Record<string, string>;
};

/**
 * POST /api/v1/customers
 * Minimum fields per Anchor's docs: fullName, address, email, phoneNumber.
 * identificationLevel2 (BVN, DOB, gender) is only required if you intend to create a
 * DepositAccount for this customer — which, per the note at the top of this file, is the
 * collection mechanism this integration is expected to use.
 */
export async function createIndividualCustomer(params: CreateIndividualCustomerParams) {
  return anchorRequest('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'IndividualCustomer',
        attributes: params,
      },
    }),
  });
}

/** GET /api/v1/customers/{customerId} — attributes.verification.status reads "unverified" until
 *  KYC is approved (confirmed live against the sandbox). */
export async function fetchCustomer(customerId: string) {
  return anchorRequest(`/api/v1/customers/${customerId}`);
}

/**
 * POST /api/v1/customers/{customerId}/verification/individual
 * Passing identificationLevel2 to createIndividualCustomer only STORES the details — the customer
 * stays "unverified" (and createDepositAccount fails with "Customer does not have kyc
 * verification") until this is called. The result arrives asynchronously as a
 * customer.identification.approved / .rejected / .error event. The name and phone number on the
 * customer must match the BVN record. Anchor bills each check against the organisation's balance,
 * sandbox included — an unfunded org gets 400 "Insufficient balance" here.
 */
export async function verifyIndividualCustomerKyc(
  customerId: string,
  level2: { dateOfBirth: string; gender: 'Male' | 'Female'; bvn: string }
) {
  return anchorRequest(`/api/v1/customers/${customerId}/verification/individual`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'Verification',
        attributes: { level: 'TIER_2', level2 },
      },
    }),
  });
}

// ── Deposit accounts (the Reserved Account equivalent) ────────────────────────────────────

/**
 * POST /api/v1/accounts
 * Individual customers can only get productName "SAVINGS"; business customers only "CURRENT"
 * with customer type "BusinessCustomer" below. The customer must already have identificationLevel2
 * on file (see createIndividualCustomer) or this fails.
 */
export async function createDepositAccount(params: {
  customerId: string;
  customerType?: 'IndividualCustomer' | 'BusinessCustomer';
  productName?: 'SAVINGS' | 'CURRENT';
}) {
  const { customerId, customerType = 'IndividualCustomer', productName = 'SAVINGS' } = params;
  return anchorRequest('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'DepositAccount',
        attributes: { productName },
        relationships: {
          customer: { data: { id: customerId, type: customerType } },
        },
      },
    }),
  });
}

/** GET /api/v1/accounts/{accountId}/balance */
export async function fetchAccountBalance(accountId: string) {
  return anchorRequest(`/api/v1/accounts/${accountId}/balance`);
}

/** GET /api/v1/accounts/{accountId} — the response's virtualNuban (or similarly named)
 *  relationship/attribute is what a payer actually transfers into; confirm the exact field
 *  name against a live sandbox account before wiring this into client-facing copy. */
export async function fetchDepositAccount(accountId: string) {
  return anchorRequest(`/api/v1/accounts/${accountId}`);
}

// ── Counterparties (payout recipients — a Plug's bank account) ────────────────────────────

export async function createCounterparty(params: {
  accountName: string;
  accountNumber: string;
  bankId: string;
}) {
  return anchorRequest('/api/v1/counterparties', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'CounterParty',
        attributes: {
          accountName: params.accountName,
          accountNumber: params.accountNumber,
          bankId: params.bankId,
        },
      },
    }),
  });
}

// ── Transfers (payouts to a Plug on job confirmation) ──────────────────────────────────────

export async function createTransfer(params: {
  accountId: string; // source DepositAccount
  counterpartyId: string;
  amount: number; // kobo, per Anchor convention — confirm against sandbox before relying on it
  reason: string;
  reference: string; // idempotency key — reuse the job id
}) {
  return anchorRequest('/api/v1/transfers', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'NIPTransfer',
        attributes: {
          amount: params.amount,
          currency: 'NGN',
          reason: params.reason,
          reference: params.reference,
        },
        relationships: {
          account: { data: { id: params.accountId, type: 'DepositAccount' } },
          counterparty: { data: { id: params.counterpartyId, type: 'CounterParty' } },
        },
      },
    }),
  });
}

// ── Webhooks ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a webhook's authenticity using Anchor's documented scheme: the "x-anchor-signature"
 * header should equal Base64(HMAC_SHA1(raw request body, key = your webhook token)).
 *
 * Anchor's docs prose reads like "Base64 of the raw HMAC digest", but their code samples
 * Base64-encode the HEX STRING of the digest. The hex-then-base64 version below is the right one —
 * CONFIRMED Oct 19 2026 against a real sandbox customer.created delivery (the raw-digest and
 * plain-hex variants did not match). Webhook tokens are capped at 10 characters by Anchor.
 */
export function verifyAnchorWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  webhookToken = process.env.ANCHOR_WEBHOOK_TOKEN!
): boolean {
  const crypto = require('crypto');
  const hexDigest = crypto.createHmac('sha1', webhookToken).update(rawBody, 'utf8').digest('hex');
  const computed = Buffer.from(hexDigest).toString('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

// ── Account numbers (what a payer actually transfers into) ────────────────────────────────

export type AnchorAccountNumber = {
  id: string;
  type: 'AccountNumber';
  attributes: {
    accountNumber: string;
    name?: string; // the live API's field (Oct 19 2026)
    accountName?: string; // what the docs sample shows
    bank?: { name?: string; code?: string; provider?: string; id?: string; nipCode?: string };
    isDefault?: boolean;
    status?: string;
  };
  relationships?: {
    account?: { data?: { id: string; type: 'DepositAccount' } }; // live
    settlementAccount?: { data?: { id: string; type: 'DepositAccount' } }; // docs
  };
};

/** GET /api/v1/account-numbers?AccountId={depositAccountId} — endpoint and its {data: [], meta}
 *  envelope confirmed live against the sandbox, as are the AccountNumber attributes typed above
 *  (where the docs sample differs from the live API, both spellings are kept). */
export async function listAccountNumbers(depositAccountId: string): Promise<AnchorAccountNumber[]> {
  return anchorRequest<AnchorAccountNumber[]>(
    `/api/v1/account-numbers?AccountId=${encodeURIComponent(depositAccountId)}`
  );
}

// ── Inbound transfers (money landing in a DepositAccount) ─────────────────────────────────

export type AnchorInboundTransfer = {
  id: string;
  type: 'InboundNIPTransfer';
  attributes: {
    amount: number; // minor units (kobo) — DepositAccount balances read the same way (decimalPlaces: 2)
    currency: string;
    status: string; // "COMPLETED" once settled
    reference?: string;
    sessionId?: string;
    description?: string;
    sourceAccountNumber?: string;
    sourceAccountName?: string;
    sourceBank?: { name?: string };
  };
  relationships?: { account?: { data?: { id: string; type: 'DepositAccount' } } };
};

/** GET /api/v1/inbound-transfers/{inboundTransferId} — per the "Account Numbers → Fund Deposit
 *  Account" docs. The webhook route uses it when an event arrives without `included`. */
export async function fetchInboundTransfer(inboundTransferId: string): Promise<AnchorInboundTransfer> {
  return anchorRequest<AnchorInboundTransfer>(`/api/v1/inbound-transfers/${inboundTransferId}`);
}

// ── Per-job collection account ──────────────────────────────────────────────────────────

const NUBAN_RE = /^\d{10}$/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The DepositAccount exists but no usable account number came back in time. Carries the id so
 *  the caller can persist it and resume with fetchJobVirtualAccount() instead of opening a
 *  second DepositAccount for the same job. */
export class AnchorAccountNumberPendingError extends Error {
  depositAccountId: string;
  lastResponse: unknown;

  constructor(depositAccountId: string, lastResponse: unknown) {
    super(`No usable account number yet for Anchor DepositAccount ${depositAccountId}`);
    this.depositAccountId = depositAccountId;
    this.lastResponse = lastResponse;
  }
}

export type JobVirtualAccount = {
  accountNumberId: string;
  virtualAccountNumber: string;
  bankName: string;
  accountName: string | null;
};

/**
 * Resolve the payable account number for a DepositAccount. Account numbers are generated
 * asynchronously after the DepositAccount, so this polls briefly. Only a real 10-digit NUBAN with
 * a bank name is accepted — never the masked DepositAccount.accountNumber, and never the
 * DepositAccount's own bank (the account number's bank is the one the payer sends to).
 */
export async function fetchJobVirtualAccount(
  depositAccountId: string,
  { attempts = 6, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {}
): Promise<JobVirtualAccount> {
  let last: AnchorAccountNumber[] = [];
  for (let i = 0; i < attempts; i++) {
    last = await listAccountNumbers(depositAccountId);
    const usable = (Array.isArray(last) ? last : []).filter(
      (n) =>
        NUBAN_RE.test(n?.attributes?.accountNumber ?? '') &&
        !!n.attributes.bank?.name &&
        (n.attributes.status ?? 'ACTIVE') === 'ACTIVE'
    );
    const pick = usable.find((n) => n.attributes.isDefault) ?? usable[0];
    if (pick) {
      return {
        accountNumberId: pick.id,
        virtualAccountNumber: pick.attributes.accountNumber,
        bankName: pick.attributes.bank!.name!,
        accountName: pick.attributes.name ?? pick.attributes.accountName ?? null,
      };
    }
    if (i < attempts - 1) await sleep(delayMs);
  }
  throw new AnchorAccountNumberPendingError(depositAccountId, last);
}

/**
 * Open a fresh DepositAccount under the Plugr master Customer for one job and return the account
 * number the client transfers into. The Anchor equivalent of alatpay.ts's generateVirtualAccount:
 * the caller stores depositAccountId on the job (repo.setJobAnchorAccount) so the
 * nip.inbound.completed webhook — which only carries the DepositAccount id — can find it again.
 *
 * Confirmed live against the sandbox (Oct 19 2026): a fresh DepositAccount came back with its
 * AccountNumber already ACTIVE on the first read (Providus, unmasked 10 digits, holder name in
 * attributes.name). The NUBAN/bank checks above still make an unexpected shape fail loudly with
 * the raw response attached rather than hand a client a wrong number.
 */
export async function createJobDepositAccount(jobId: string) {
  const customerId = process.env.ANCHOR_MASTER_CUSTOMER_ID;
  if (!customerId) {
    throw new Error('ANCHOR_MASTER_CUSTOMER_ID is not set — run scripts/create-anchor-master-customer.ts');
  }
  if (!ANCHOR_API_KEY) {
    throw new Error('ANCHOR_API_KEY is not set');
  }

  const created = await createDepositAccount({ customerId });
  const depositAccountId: string | undefined = created?.id;
  if (!depositAccountId) {
    throw new AnchorError(502, { note: `no DepositAccount id returned for job ${jobId}`, created });
  }

  // Re-read before handing the number out: the account must exist and be ACTIVE (not frozen).
  const account = await fetchDepositAccount(depositAccountId);
  const status = account?.attributes?.status;
  if ((status && status !== 'ACTIVE') || account?.attributes?.frozen) {
    throw new AnchorError(409, { note: `DepositAccount ${depositAccountId} for job ${jobId} is not usable`, account });
  }

  const va = await fetchJobVirtualAccount(depositAccountId);
  return { depositAccountId, ...va };
}
