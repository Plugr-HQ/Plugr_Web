// src/lib/clientIdentity.ts
// Who is the person requesting a Plug? (Part B)
//
// Clients have no account and no password — they fill the intake form once and are then "known".
// This module answers one question for the request flow: do we already know this person, or do
// they need the form first?
//
// Storage is localStorage, deliberately. There is no client session to hang this off: the intake
// is a capture, not a login. The consequence is honest and worth stating — a new device, a
// different browser, or cleared storage means an unknown client and the form appears again. That
// is the correct trade for not asking a first-time client to create an account, and the backend
// upserts on the phone number, so a repeat submission updates one record rather than duplicating.
//
// The backend row (POST /clients/intake, keyed on the WhatsApp number) is the real record. This
// is a local convenience marker, never the source of truth.

const KEY = 'plugr_client_identity';

export type ClientIdentity = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  /** Server id from /clients/intake, when the call succeeded. */
  id?: string;
  /** ISO timestamp of capture — lets a future version expire stale identities if wanted. */
  capturedAt: string;
};

export function getClientIdentity(): ClientIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientIdentity;
    // A record without a phone can't identify anyone — treat it as absent rather than trusting it.
    return parsed?.phone ? parsed : null;
  } catch {
    return null;
  }
}

/** True when the intake form should be skipped entirely. */
export function isKnownClient(): boolean {
  return getClientIdentity() !== null;
}

export function saveClientIdentity(identity: Omit<ClientIdentity, 'capturedAt'>) {
  if (typeof window === 'undefined') return;
  const record: ClientIdentity = { ...identity, capturedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Private mode / storage disabled. The intake still reached the backend, which is the part
    // that matters; the client will simply be asked again next time.
  }
}

export function clearClientIdentity() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
