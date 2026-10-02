// GET  — check active consent for voice profile draft generation
// POST — record agreement for voice profile draft generation
// Proxies to the NestJS backend's /plugs/:id/consent/voice endpoints using proxyToBackend.

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  return proxyToBackend(request, {
    path: `/plugs/${plugId}/consent/voice`,
    method: 'GET',
    fallbackError: 'could not check voice consent status',
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  return proxyToBackend(request, {
    path: `/plugs/${plugId}/consent/voice`,
    method: 'POST',
    fallbackError: 'could not record voice consent',
  });
}
