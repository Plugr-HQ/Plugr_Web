// src/app/_shared/demo.ts
// Small shared helpers for the /app escrow screens. Client-safe (no secrets).

export const naira = (n: number | string | null | undefined) =>
  '₦' + Number(n || 0).toLocaleString('en-NG');

export async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    throw new Error((body && (body.error || body.detail)) || `Request failed (${res.status})`);
  }
  return body as T;
}

// --- Demo "identity" (flavor only, not real auth) -------------------------------
const ROLE_KEY = 'plugr_demo_role';
const PHONE_KEY = 'plugr_demo_phone';
const NAME_KEY = 'plugr_demo_name';

export type DemoRole = 'client' | 'plug';

export function setDemoIdentity(role: DemoRole, phone: string, name?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(PHONE_KEY, phone);
  if (name) localStorage.setItem(NAME_KEY, name);
}

export function getDemoIdentity() {
  if (typeof window === 'undefined') return { role: null, phone: '', name: '' };
  return {
    role: (localStorage.getItem(ROLE_KEY) as DemoRole | null) ?? null,
    phone: localStorage.getItem(PHONE_KEY) ?? '',
    name: localStorage.getItem(NAME_KEY) ?? '',
  };
}

// Human-friendly labels + accent colors for the job lifecycle.
export const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  paid_escrow: 'Paid — In Escrow',
  plug_accepted: 'Plug Accepted',
  quoted: 'Quote Sent',
  client_accepted: 'Quote Accepted',
  escrow_funded: 'Paid — In Escrow',
  plug_declined: 'Declined by Plug',
  client_declined_quote: 'Quote Declined',
  cancelled: 'Cancelled',
  accepted: 'Accepted',
  completed: 'Completed',
  released: 'Released',
  withdrawn: 'Withdrawn',
};
