// POST — upload one certificate (PDF or JPG, 10MB max). The file is passed straight through to the
// backend, which is the only side that holds storage credentials.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'invalid upload' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'no file was sent' }, { status: 400 });

  const forwarded = new FormData();
  forwarded.append('file', file, file.name);
  return proxyToBackend(request, {
    path: '/verification/certificates',
    method: 'POST',
    body: forwarded,
    timeoutMs: 60_000, // a 10MB scan on a Nigerian mobile connection
    fallbackError: 'could not upload that file',
  });
}
