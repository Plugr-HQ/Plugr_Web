// src/app/api/plug/jobs/[jobId]/start/route.ts
// PATCH — Plug starts the work. Proxies to backend PATCH /jobs/:id/start
// (PLUG-only, assigned Plug only, payment must have cleared; ARRIVED -> IN_PROGRESS). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/start`, request.headers.get('authorization'));
}
