// GET — a short-lived signed URL for one of the Plug's own certificates.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, {
    path: `/verification/certificates/${encodeURIComponent(id)}/url`,
    fallbackError: 'could not open that file',
  });
}
