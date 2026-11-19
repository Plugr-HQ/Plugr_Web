// src/app/api/client/jobs/[jobId]/confirm/route.ts
// PATCH — the client confirms the work is done. Proxies to backend PATCH /jobs/:id/confirm
// (CLIENT-only, booking client only; AWAITING_CONFIRM -> COMPLETED). That opens the complaint window;
// when it closes with no dispute, the backend releases the held payment to the Plug.

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, {
    path: `/jobs/${jobId}/confirm`,
    method: 'PATCH',
    body: {},
    fallbackError: 'Could not confirm the job.',
  });
}
