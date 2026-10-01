// PATCH — record ops' decision on one item (pass / needs changes / fail). Proxies to the backend's
// single review route, PATCH /admin/verification/:item/:plugId. There is no other approval path.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ plugId: string; item: string }> }) {
  const { plugId, item } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'invalid request body' }, { status: 400 });
  return proxyToBackend(request, {
    path: `/admin/verification/${encodeURIComponent(item)}/${encodeURIComponent(plugId)}`,
    method: 'PATCH',
    body,
    fallbackError: 'could not save that decision',
  });
}
