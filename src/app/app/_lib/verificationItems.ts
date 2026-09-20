// src/app/app/_lib/verificationItems.ts
// One place that turns the server's verification state into the Hub's ItemStates, used by both the
// Hub screen and the dashboard button so the two can never disagree about how far along a Plug is.
//
// Every one of the six items is server-backed now, and all six come from the one /verification/items
// endpoint. Identity used to have its own vendor-driven endpoint (Didit); it doesn't any more — the
// item is a typed NIN, a NIN slip and a live selfie that our own team reviews, which is the same
// shape as guarantor or skills. The Didit endpoint and integration are still there, dormant.

import { apiFetch } from '@/src/lib/api-client';
import { loadItemStates, saveItemStates, type ItemState, type ItemStates } from './verificationHub';

const ITEMS_URL = '/api/plug/verification/items';

export type CertificateFile = { id: string; fileName: string; sizeBytes: number; uploadedAt: string };

/** What an item that is just "a submission ops read" reports back. */
export type ReviewedItem = { state: ItemState; submittedAt: string | null; reviewNote: string | null };

export type ServerItems = {
  identity: ReviewedItem;
  bvn: ReviewedItem;
  guarantor: ReviewedItem;
  background: ReviewedItem;
  certificates: { state: ItemState; files: CertificateFile[] };
  skills: { state: ItemState; path: 'CALL' | 'VOICE_NOTE' | null; requestedAt: string | null; reviewNote: string | null };
};

export type VerificationSnapshot = {
  states: ItemStates;
  items: ServerItems | null;
};

const ITEM_STATES: ItemState[] = ['not_started', 'in_progress', 'pending_review', 'verified'];
const asState = (v: unknown, fallback: ItemState = 'not_started'): ItemState =>
  ITEM_STATES.includes(v as ItemState) ? (v as ItemState) : fallback;

const reviewed = (raw: any): ReviewedItem => ({
  state: asState(raw?.state),
  submittedAt: raw?.submittedAt ?? null,
  reviewNote: raw?.reviewNote ?? null,
});

/**
 * Fetch the verification state, cache it in the per-device store (so an offline Hub and the
 * dashboard card still show the last known value), and return the merged states.
 *
 * A failed request is not fatal: whatever could not be loaded keeps its cached value, because a
 * flaky connection must not make a Plug look less verified than they are.
 */
export async function loadVerificationSnapshot(plugId: string): Promise<VerificationSnapshot> {
  const states = loadItemStates(plugId);
  let items: ServerItems | null = null;

  try {
    const body: any = (await apiFetch(ITEMS_URL, { cache: 'no-store' }, { skipAuthRedirect: true })) ?? {};
    items = {
      identity: reviewed(body?.identity),
      bvn: reviewed(body?.bvn),
      guarantor: reviewed(body?.guarantor),
      background: reviewed(body?.background),
      certificates: {
        state: asState(body?.certificates?.state),
        files: Array.isArray(body?.certificates?.files) ? body.certificates.files : [],
      },
      skills: {
        state: asState(body?.skills?.state),
        path: body?.skills?.path ?? null,
        requestedAt: body?.skills?.requestedAt ?? null,
        reviewNote: body?.skills?.reviewNote ?? null,
      },
    };
    states.nin_liveness = items.identity.state;
    states.bvn = items.bvn.state;
    states.guarantor = items.guarantor.state;
    states.background = items.background.state;
    states.certificates = items.certificates.state;
    states.skills = items.skills.state;
  } catch {
    // Keep the cached states — see the note above.
  }

  saveItemStates(plugId, states);
  return { states, items };
}
