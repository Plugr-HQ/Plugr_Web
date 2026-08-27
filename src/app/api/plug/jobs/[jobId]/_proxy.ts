// src/app/api/plug/jobs/[jobId]/_proxy.ts
// Shared same-origin proxy helpers for the M1 Plug job-card actions.
//
// Identical convention to the admin Dispatch proxies (src/app/api/admin/jobs/*): forward the
// caller's bearer token to the PLUG-guarded NestJS backend, mirror its HTTP status, and flatten
// Nest's { message } payload so the REAL validation error (illegal state transition, "assigned to
// a different Plug", sub-floor quote) reaches the UI instead of a generic message. Underscore
// prefix keeps Next's router from treating this as a route handler.

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Nest sends { message: string | string[], error, statusCode } — flatten to one string. */
function flatten(data: any): string | undefined {
  const raw = data && (data.message ?? data.error);
  return Array.isArray(raw) ? raw.join('; ') : raw;
}

export async function backendGet(path: string, auth: string | null) {
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: auth },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: flatten(data) ?? 'could not load the job' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('plug job GET proxy failed', e);
    return NextResponse.json({ error: 'could not reach the server' }, { status: 502 });
  }
}

export async function backendPatch(path: string, auth: string | null, body?: unknown) {
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: flatten(data) ?? 'the action could not be completed' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('plug job PATCH proxy failed', e);
    return NextResponse.json({ error: 'could not reach the server' }, { status: 502 });
  }
}
