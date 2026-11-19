// src/app/api/client/jobs/[jobId]/route.ts
// GET — the client's own job, for the client job page. Proxies to backend GET /jobs/:id, which
// asserts the caller is the client who booked it (validateAndGetJob).

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, { path: `/jobs/${jobId}`, fallbackError: 'Could not load this job.' });
}
