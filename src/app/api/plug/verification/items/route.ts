// GET — every non-Didit Hub item's state for the signed-in Plug (guarantor, background,
// certificates, skills). Identity has its own route because it is vendor-driven.
import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(request: Request) {
  return proxyToBackend(request, { path: '/verification/items', fallbackError: 'could not load your verification items' });
}
