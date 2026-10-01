// POST — the manual NIN + liveness submission: the typed NIN, the NIN slip and the live selfie, all
// on one multipart request. Passed straight through to the backend, which is the only side that
// holds storage credentials and the only side that decides what the submission's state becomes.
//
// This sits under /identity/submit rather than replacing /identity because that GET route still
// reports the dormant Didit status; nothing routes to it, and it is left alone.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'invalid upload' }, { status: 400 });
  }

  const nin = form.get('nin');
  const slip = form.get('slip');
  const selfie = form.get('selfie');
  if (typeof nin !== 'string') return Response.json({ error: 'enter your NIN' }, { status: 400 });
  if (!(slip instanceof File)) return Response.json({ error: 'attach your NIN slip' }, { status: 400 });
  if (!(selfie instanceof File)) return Response.json({ error: 'take your selfie' }, { status: 400 });

  // Rebuilt rather than forwarded as-is, so only the three fields the backend expects go over.
  const forwarded = new FormData();
  forwarded.append('nin', nin);
  forwarded.append('slip', slip, slip.name);
  forwarded.append('selfie', selfie, selfie.name);

  return proxyToBackend(request, {
    path: '/verification/identity',
    method: 'POST',
    body: forwarded,
    timeoutMs: 60_000, // a slip photo plus a selfie on a Nigerian mobile connection
    fallbackError: 'could not submit your identity documents',
  });
}
