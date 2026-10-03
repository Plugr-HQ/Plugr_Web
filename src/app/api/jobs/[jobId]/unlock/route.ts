// src/app/api/jobs/[jobId]/unlock/route.ts
// Called by the client-side countdown when it hits zero (the Plug's dashboard and wallet both do):
// the job's money moves from the Plug's locked balance to available.
//
// A thin proxy. This route used to write to the database itself with NO authentication, and its
// "already unlocked?" check compared the Plug's TOTAL locked balance with this job's amount — so
// money locked by a different job let a repeated call credit twice. It now forwards to the backend
// (POST /escrow/:jobId/unlock), which requires a party to the job and moves the money only if THIS
// job hasn't been unlocked yet, so a repeat is a no-op.
// Response shape is unchanged: { unlocked: true } or { unlocked: true, note: 'already unlocked' }.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, {
    path: `/escrow/${encodeURIComponent(jobId)}/unlock`,
    method: 'POST',
    fallbackError: 'could not unlock these funds',
  });
}
