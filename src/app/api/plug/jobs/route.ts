// src/app/api/plug/jobs/route.ts
// GET — the Plug's own jobs from the REAL M1 backend (GET /jobs), used by the dashboard to find
// the current in-flight assignment.
//
// Why this exists: the legacy dashboard payload (/api/plugs/:id/dashboard) maps every job through
// a six-value escrow vocabulary (requested | paid_escrow | accepted | completed | released |
// withdrawn) and only treats paid_escrow/accepted/completed as the "active job". A real M1
// assignment (status PLUG_ASSIGNED, no escrow yet) collapses to 'requested' and is therefore never
// surfaced — which is why an admin assignment never appeared on the Plug's dashboard. This route
// returns the untouched M1 job rows (real JobStatus values) so the dashboard can show it.
//
// Same proxy convention as the rest of /api/plug/jobs/*: forward the caller's bearer token, mirror
// the backend status. The backend scopes GET /jobs to the caller (findUserJobs resolves the Plug
// profile from the token and filters by plugId), so no plugId is passed or trusted from the client.

import { backendGet } from './[jobId]/_proxy';

export async function GET(request: Request) {
  return backendGet('/jobs', request.headers.get('authorization'));
}
