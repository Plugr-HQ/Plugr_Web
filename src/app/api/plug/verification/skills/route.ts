// POST — the Plug committed to an assessment (booked a call, or chose the voice-note route).
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'invalid request body' }, { status: 400 });
  return proxyToBackend(request, { path: '/verification/skills', method: 'POST', body, fallbackError: 'could not start your skills assessment' });
}
