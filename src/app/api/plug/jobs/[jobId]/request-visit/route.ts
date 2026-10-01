// src/app/api/plug/jobs/[jobId]/request-visit/route.ts
// PATCH — Plug flags the job as needing an on-site diagnosis. Proxies to backend
// PATCH /jobs/:id/request-visit (PLUG-only; IN_DISCUSSION -> VISIT_PENDING). No body.
// This is the state-machine prerequisite for /visit-done, so the card needs it to reach VISIT_DONE.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/request-visit`, request.headers.get('authorization'));
}
