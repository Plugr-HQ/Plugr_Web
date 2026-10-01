// POST — submit background info. Completes the item outright (no review step).
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'invalid request body' }, { status: 400 });
  return proxyToBackend(request, { path: '/verification/background', method: 'POST', body, fallbackError: 'could not save your background info' });
}
