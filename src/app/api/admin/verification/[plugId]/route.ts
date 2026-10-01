// GET — the ops verification detail for one Plug: every submitted item, the guarantor's NIN
// decrypted, and the live Didit result. Backend route is ADMIN-only; the token is forwarded as-is.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ plugId: string }> }) {
  const { plugId } = await params;
  return proxyToBackend(request, {
    path: `/admin/verification/${encodeURIComponent(plugId)}`,
    // Includes a live Didit call on the backend.
    timeoutMs: 25_000,
    fallbackError: 'could not load this Plug’s verification',
  });
}
