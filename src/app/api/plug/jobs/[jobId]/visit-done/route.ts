// src/app/api/plug/jobs/[jobId]/visit-done/route.ts
// PATCH — Plug marks the on-site visit complete. Proxies to backend PATCH /jobs/:id/visit-done
// (PLUG-only; VISIT_PENDING -> VISIT_DONE, visit fee held). No body. Only valid from VISIT_PENDING
// per the JobStateMachine — the backend rejects any other state with a 400.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/visit-done`, request.headers.get('authorization'));
}
