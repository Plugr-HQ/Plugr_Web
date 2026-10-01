// src/lib/alatpay.ts
// Confirmed against ALATPay's own docs (Jul 11 2026).

const ALATPAY_BASE_URL = process.env.ALATPAY_BASE_URL || "https://apibox.alatpay.ng";
const ALATPAY_SECRET_KEY = process.env.ALATPAY_SECRET_KEY!; // Ocp-Apim-Subscription-Key
const ALATPAY_BUSINESS_ID = process.env.ALATPAY_BUSINESS_ID!;

type AlatPayCustomer = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

type GenerateVirtualAccountParams = {
  amount: number;
  orderId: string; // use hack_jobs.id — correlates the webhook back to a job
  description: string;
  customer: AlatPayCustomer;
};

async function alatpayRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${ALATPAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": ALATPAY_SECRET_KEY,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.status === false) {
    throw new AlatPayError(res.status, body);
  }

  return body;
}

export class AlatPayError extends Error {
  statusCode: number;
  context: unknown;

  constructor(statusCode: number, context: unknown) {
    super(
      typeof context === "object" && context && "message" in context
        ? String((context as any).message)
        : "ALATPay request failed"
    );
    this.statusCode = statusCode;
    this.context = context;
  }

  isBadRequest() { return this.statusCode === 400; }
  isUnauthorized() { return this.statusCode === 401; }
  isVirtualAccountGenerationFailed() { return this.statusCode === 417; }
  isValidationError() { return this.statusCode === 422; }
  isServerError() { return this.statusCode >= 500; }
}

/**
 * Generate a one-time virtual account for a client to pay a job amount into.
 * Confirmed endpoint: POST /bank-transfer/api/v1/bankTransfer/virtualAccount
 * Account is active for 24 hours per ALATPay docs (not 30 min — corrected from earlier draft).
 */
export async function generateVirtualAccount(params: GenerateVirtualAccountParams) {
  // Fail fast with a clear config error instead of sending undefined credentials to
  // ALATPay and surfacing a generic downstream 502.
  if (!ALATPAY_BUSINESS_ID) {
    throw new Error("ALATPAY_BUSINESS_ID is not set");
  }
  if (!ALATPAY_SECRET_KEY) {
    throw new Error("ALATPAY_SECRET_KEY is not set");
  }

  return alatpayRequest(`/bank-transfer/api/v1/bankTransfer/virtualAccount`, {
    method: "POST",
    body: JSON.stringify({
      businessId: ALATPAY_BUSINESS_ID,
      amount: params.amount,
      currency: "NGN",
      orderId: params.orderId,
      description: params.description,
      customer: params.customer,
    }),
  });
}

/**
 * Re-query the real status of a transaction directly from ALATPay.
 * Confirmed endpoint: GET /bank-transfer/api/v1/bankTransfer/transactions/{transactionId}
 * Used as a secondary safety check after signature verification, and for the
 * client-facing "check my payment status" poll on Screen 4.
 */
export async function confirmTransaction(transactionId: string) {
  return alatpayRequest(
    `/bank-transfer/api/v1/bankTransfer/transactions/${transactionId}`,
    { method: "GET" }
  );
}

/**
 * Verifies a webhook's authenticity using ALATPay's documented HMAC-SHA256 scheme.
 * IMPORTANT: must be computed over the RAW request body string, before JSON.parse —
 * any re-serialization will change byte content and break the signature match.
 */
export function verifyAlatPayWebhookSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.ALATPAY_WEBHOOK_SECRET_KEY!;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(receivedSignature)
    );
  } catch {
    return false;
  }
}
