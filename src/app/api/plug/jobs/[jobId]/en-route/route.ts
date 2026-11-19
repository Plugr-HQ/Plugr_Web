// src/app/api/plug/jobs/[jobId]/en-route/route.ts
// PATCH — Plug sets off for the job. Proxies to backend PATCH /jobs/:id/en-route
// (PLUG-only, assigned Plug only, payment must have cleared; ESCROW_HELD -> EN_ROUTE). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/en-route`, request.headers.get('authorization'));
}
