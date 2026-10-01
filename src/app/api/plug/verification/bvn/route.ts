// POST — submit the Plug's BVN digits. Moves the item to pending review; no Fincra call happens.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'invalid request body' }, { status: 400 });
  return proxyToBackend(request, { path: '/verification/bvn', method: 'POST', body, fallbackError: 'could not submit your BVN' });
}
