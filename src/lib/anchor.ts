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
//    the closest equivalent — but confirm this is actually the intended pattern (one Customer,
//    fresh DepositAccount per job) before wiring it into the job flow. See the note left in
//    the PR / chat for the open question this raised.

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
 * IMPORTANT — unresolved ambiguity in Anchor's own docs: the prose says "Base64 of the raw HMAC
 * digest" but every code sample they publish (JS/Java/Python/PHP) actually Base64-encodes the
 * HEX STRING of the digest, not the raw digest bytes. This implements the hex-then-base64
 * version (matching their samples) because docs prose vs. docs code disagreeing usually means
 * the code is what was actually tested. CONFIRM THIS against a real event from Anchor's
 * dashboard Events page before trusting it in production — do not skip this check.
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
