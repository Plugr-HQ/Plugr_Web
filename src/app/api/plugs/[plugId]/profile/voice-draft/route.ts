// POST — upload voice note audio (WAV format, 90s / ~3.2MB max).
// Proxies the file straight to the NestJS backend's POST /plugs/:id/profile/voice-draft endpoint.

import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid upload format' }, { status: 400 });
  }

  const audio = form.get('audio') || form.get('file');
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'no audio file was sent' }, { status: 400 });
  }

  const forwarded = new FormData();
  forwarded.append('audio', audio, audio.name || 'voice-note.wav');

  return proxyToBackend(request, {
    path: `/plugs/${plugId}/profile/voice-draft`,
    method: 'POST',
    body: forwarded,
    timeoutMs: 30_000,
    fallbackError: 'could not process voice note',
  });
}
