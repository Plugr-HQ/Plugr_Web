// POST — submit the Plug's guarantor. Moves the item to pending review.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'invalid request body' }, { status: 400 });
  return proxyToBackend(request, { path: '/verification/guarantor', method: 'POST', body, fallbackError: 'could not submit your guarantor' });
}
