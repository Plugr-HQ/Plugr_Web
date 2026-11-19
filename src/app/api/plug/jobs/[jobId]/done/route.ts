// src/app/api/plug/jobs/[jobId]/done/route.ts
// PATCH — Plug marks the work done. Proxies to backend PATCH /jobs/:id/done
// (PLUG-only, assigned Plug only, payment must have cleared; IN_PROGRESS -> AWAITING_CONFIRM; the client confirms next). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/done`, request.headers.get('authorization'));
}
