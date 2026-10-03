// src/app/api/jobs/[jobId]/release/route.ts
// Screen 5 "Confirm Completion": the job's money moves into the Plug's LOCKED balance and a
// countdown (compressed from the real 24hr dispute window) starts; /unlock fires when it ends.
//
// A thin proxy. This route used to write to the database itself with NO authentication — anyone
// who knew a job id could release its payment — and decided eligibility with a separate read, so
// two calls at once could both lock the money. It now forwards to the backend
// (POST /escrow/:jobId/release), which checks the caller is the client who booked the job and
// gates the move on this job's state, so a retry is a safe no-op that returns the same countdown.
// Response shape is unchanged: { released, unlocksAt, lockSeconds }.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(request, {
    path: `/escrow/${encodeURIComponent(jobId)}/release`,
    method: 'POST',
    fallbackError: 'could not confirm this job',
  });
}
