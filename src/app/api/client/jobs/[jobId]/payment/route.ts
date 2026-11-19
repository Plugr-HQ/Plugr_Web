// src/app/api/client/jobs/[jobId]/payment/route.ts
// GET — where the client pays and how much has landed. Proxies to backend GET /jobs/:id/payment
// (CLIENT who booked it, or ADMIN), which re-reads the Anchor account ledger before answering — so
// polling this confirms a payment even if the Anchor webhook never arrives.

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, { path: `/jobs/${jobId}/payment`, fallbackError: 'Could not check your payment.' });
}
