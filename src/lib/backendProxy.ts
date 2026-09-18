// src/lib/backendProxy.ts
// Same-origin proxy to the NestJS backend for the Plug's verification endpoints.
//
// The Authorization header is forwarded unchanged and never defaulted: an unauthenticated request
// must reach the backend as unauthenticated, not silently succeed against nobody. The backend's own
// status and message are passed back, so a 403 "not available yet" or a 422 validation message reads
// the same in the browser as it does from curl.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type ProxyInit = {
  /** Backend path, e.g. "/verification/items". */
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Parsed JSON body, or a FormData for a file upload. */
  body?: unknown;
  timeoutMs?: number;
  /** What to tell the Plug when the backend can't be reached at all. */
  fallbackError: string;
};

export async function proxyToBackend(request: Request, init: ProxyInit) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  try {
    const res = await fetch(`${API_URL}${init.path}`, {
      method: init.method ?? 'GET',
      cache: 'no-store',
      headers: {
        Authorization: authHeader,
        // fetch sets the multipart boundary itself — setting Content-Type by hand breaks the parse.
        ...(init.body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body === undefined ? undefined : isForm ? (init.body as FormData) : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? 20_000),
    });

    const data = await res.json().catch(() => ({}) as any);
    if (!res.ok) {
      return NextResponse.json(
        { error: normalizeMessage(data) ?? init.fallbackError },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(`verification proxy failed (${init.path})`, e);
    return NextResponse.json({ error: init.fallbackError }, { status: 502 });
  }
}

/** Nest's ValidationPipe returns `message` as a string OR an array of field messages. */
function normalizeMessage(data: any): string | null {
  const m = data?.message ?? data?.error;
  if (Array.isArray(m)) return m[0] ?? null;
  return typeof m === 'string' ? m : null;
}
