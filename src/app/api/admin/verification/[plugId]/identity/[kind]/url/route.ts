// GET — a short-lived signed URL for one of a Plug's two identity files, for ops to open.
// `kind` is "slip" or "selfie"; the backend validates it and resolves the storage path itself, so
// nothing the caller sends is ever used to address an object.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request, { params }: { params: Promise<{ plugId: string; kind: string }> }) {
  const { plugId, kind } = await params;
  return proxyToBackend(request, {
    path: `/admin/verification/${encodeURIComponent(plugId)}/identity/${encodeURIComponent(kind)}/url`,
    fallbackError: 'could not open that file',
  });
}
