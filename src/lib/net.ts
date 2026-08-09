// src/lib/net.ts
// Small shared client-side helpers: money formatting, an auth-aware fetch, the client identity
// stored in localStorage, and job-status labels. Client-safe (no secrets).

import { authHeaders, refreshAccessToken } from '@/src/lib/api';

export const naira = (n: number | string | null | undefined) =>
  '₦' + Number(n || 0).toLocaleString('en-NG');

export async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  // authHeaders() attaches the stored access token when present so guarded /app proxy routes
  // can forward it (re-read each attempt). Harmless for public routes — they ignore it.
  const doFetch = () =>
    fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers || {}) },
    });

  let res = await doFetch();

  // On a 401, try a silent refresh and replay once before giving up.
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  const body = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    throw new Error((body && (body.error || body.detail)) || `Request failed (${res.status})`);
  }
  return body as T;
}

// --- Client identity (lightweight, client-side; real auth is the bearer token) --------
const ROLE_KEY = 'plugr_client_role';
const PHONE_KEY = 'plugr_client_phone';
const NAME_KEY = 'plugr_client_name';

export type ClientRole = 'client' | 'plug';

export function setClientIdentity(role: ClientRole, phone: string, name?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(PHONE_KEY, phone);
  if (name) localStorage.setItem(NAME_KEY, name);
}

export function getClientIdentity() {
  if (typeof window === 'undefined') return { role: null, phone: '', name: '' };
  return {
    role: (localStorage.getItem(ROLE_KEY) as ClientRole | null) ?? null,
    phone: localStorage.getItem(PHONE_KEY) ?? '',
    name: localStorage.getItem(NAME_KEY) ?? '',
  };
}

// Human-friendly labels + accent colors for the job lifecycle.
export const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  paid_escrow: 'Paid — In Escrow',
  accepted: 'Accepted',
  completed: 'Completed',
  released: 'Released',
  withdrawn: 'Withdrawn',
};
