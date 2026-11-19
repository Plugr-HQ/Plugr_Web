// src/app/api/client/jobs/[jobId]/quote/decline/route.ts
// PATCH — the client declines the quote, with an optional reason. Proxies to backend
// PATCH /jobs/:id/quote/decline (CLIENT-only; QUOTED -> CANCELLED).

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined;
  return proxyToBackend(request, {
    path: `/jobs/${jobId}/quote/decline`,
    method: 'PATCH',
    body: reason ? { reason } : {},
    fallbackError: 'Could not decline the quote.',
  });
}
