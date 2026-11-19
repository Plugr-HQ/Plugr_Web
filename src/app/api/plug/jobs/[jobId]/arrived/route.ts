// src/app/api/plug/jobs/[jobId]/arrived/route.ts
// PATCH — Plug has arrived. Proxies to backend PATCH /jobs/:id/arrived
// (PLUG-only, assigned Plug only, payment must have cleared; EN_ROUTE -> ARRIVED). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/arrived`, request.headers.get('authorization'));
}
