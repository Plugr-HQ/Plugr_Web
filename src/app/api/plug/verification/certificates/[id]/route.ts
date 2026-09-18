// DELETE — remove one of the Plug's own certificates.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, {
    path: `/verification/certificates/${encodeURIComponent(id)}`,
    method: 'DELETE',
    fallbackError: 'could not remove that file',
  });
}
