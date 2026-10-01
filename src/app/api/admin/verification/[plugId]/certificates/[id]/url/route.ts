// GET — a short-lived signed URL for one of a Plug's certificates, for ops to open.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ plugId: string; id: string }> }) {
  const { plugId, id } = await params;
  return proxyToBackend(request, {
    path: `/admin/verification/${encodeURIComponent(plugId)}/certificates/${encodeURIComponent(id)}/url`,
    fallbackError: 'could not open that certificate',
  });
}
