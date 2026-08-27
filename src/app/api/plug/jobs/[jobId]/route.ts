// src/app/api/plug/jobs/[jobId]/route.ts
// GET — load one job for the Plug job-card. Proxies to the backend GET /jobs/:id
// (validateAndGetJob asserts this Plug is the one assigned to the job).

import { backendGet } from './_proxy';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return backendGet(`/jobs/${jobId}`, request.headers.get('authorization'));
}
