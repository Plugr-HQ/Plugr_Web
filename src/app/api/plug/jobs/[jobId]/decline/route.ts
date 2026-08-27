// src/app/api/plug/jobs/[jobId]/decline/route.ts
// PATCH — Plug declines the assignment. Proxies to backend PATCH /jobs/:id/decline
// (PLUG-only; PLUG_ASSIGNED -> SEARCHING_PLUG, clears plugId for re-dispatch). No body.

import { backendPatch } from '../_proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendPatch(`/jobs/${jobId}/decline`, request.headers.get('authorization'));
}
