// src/app/app/_lib/verificationItems.ts
// One place that turns the server's verification state into the Hub's ItemStates, used by both the
// Hub screen and the dashboard button so the two can never disagree about how far along a Plug is.
//
// Five of the six items are server-backed now: identity (Didit) has its own endpoint, and guarantor,
// background, certificates and skills come from /verification/items. BVN is still an unbuilt stub,
// so its state stays in the per-device localStorage seam.

import { apiFetch } from '@/src/lib/api-client';
import {
  identityItemState,
  loadItemStates,
  saveItemStates,
  type ItemState,
  type ItemStates,
} from './verificationHub';

const IDENTITY_URL = '/api/plug/verification/identity';
const ITEMS_URL = '/api/plug/verification/items';

export type CertificateFile = { id: string; fileName: string; sizeBytes: number; uploadedAt: string };

export type ServerItems = {
  guarantor: { state: ItemState; submittedAt: string | null; reviewNote: string | null };
  background: { state: ItemState; submittedAt: string | null; reviewNote: string | null };
  certificates: { state: ItemState; files: CertificateFile[] };
  skills: { state: ItemState; path: 'CALL' | 'VOICE_NOTE' | null; requestedAt: string | null; reviewNote: string | null };
};

export type VerificationSnapshot = {
  states: ItemStates;
  /** False when this Plug isn't in the identity pilot — the item renders as an unbuilt stub. */
  identityAvailable: boolean;
  items: ServerItems | null;
};

const ITEM_STATES: ItemState[] = ['not_started', 'in_progress', 'pending_review', 'verified'];
const asState = (v: unknown, fallback: ItemState = 'not_started'): ItemState =>
  ITEM_STATES.includes(v as ItemState) ? (v as ItemState) : fallback;

/**
 * Fetch both verification endpoints, cache the result in the per-device store (so an offline Hub and
 * the dashboard card still show the last known value), and return the merged states.
 *
 * Neither request failing is fatal: whatever could not be loaded keeps its cached value, because a
 * flaky connection must not make a Plug look less verified than they are.
 */
export async function loadVerificationSnapshot(plugId: string): Promise<VerificationSnapshot> {
  const states = loadItemStates(plugId);
  let identityAvailable = true;
  let items: ServerItems | null = null;

  const [identityRes, itemsRes] = await Promise.allSettled([
    apiFetch(IDENTITY_URL, { cache: 'no-store' }, { skipAuthRedirect: true }),
    apiFetch(ITEMS_URL, { cache: 'no-store' }, { skipAuthRedirect: true }),
  ]);

  if (identityRes.status === 'fulfilled') {
    const body: any = identityRes.value;
    identityAvailable = body?.available !== false;
    states.nin_liveness = identityAvailable ? identityItemState(body?.status) : 'not_started';
  }

  if (itemsRes.status === 'fulfilled') {
    const body: any = itemsRes.value ?? {};
    items = {
      guarantor: {
        state: asState(body?.guarantor?.state),
        submittedAt: body?.guarantor?.submittedAt ?? null,
        reviewNote: body?.guarantor?.reviewNote ?? null,
      },
      background: {
        state: asState(body?.background?.state),
        submittedAt: body?.background?.submittedAt ?? null,
        reviewNote: body?.background?.reviewNote ?? null,
      },
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
    states.guarantor = items.guarantor.state;
    states.background = items.background.state;
    states.certificates = items.certificates.state;
    states.skills = items.skills.state;
  }

  saveItemStates(plugId, states);
  return { states, identityAvailable, items };
}
