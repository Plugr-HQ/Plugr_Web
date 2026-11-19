// src/app/api/client/jobs/[jobId]/quote/accept/route.ts
// PATCH — the client accepts the Plug's quote. Proxies to backend PATCH /jobs/:id/quote/accept
// (CLIENT-only, booking client only, 24h expiry enforced; QUOTED -> QUOTE_ACCEPTED). Accepting opens
// the job's Anchor payment account on the backend.

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, {
    path: `/jobs/${jobId}/quote/accept`,
    method: 'PATCH',
    body: {},
    fallbackError: 'Could not accept the quote.',
  });
}
