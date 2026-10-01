// GET /api/admin/audit-trail — proxies to the backend's /admin/verification/audit-trail,
// which is the route on VerificationReviewController (prefix: admin/verification).
// Returns per-admin reviewer metrics + recent audit log entries for the dashboard "Reviewers" tab.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request) {
  return proxyToBackend(request, {
    path: '/admin/verification/audit-trail',
    timeoutMs: 10_000,
    fallbackError: 'could not load the audit trail',
  });
}
