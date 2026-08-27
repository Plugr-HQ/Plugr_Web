// src/app/api/plug/jobs/[jobId]/accept/route.ts
// PATCH — Plug accepts the assignment. Proxies to backend PATCH /jobs/:id/accept
// (PLUG-only; PLUG_ASSIGNED -> IN_DISCUSSION). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/accept`, request.headers.get('authorization'));
}
