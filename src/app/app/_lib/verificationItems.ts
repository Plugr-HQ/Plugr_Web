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
  skills: {
    state: ItemState;
    path: 'CALL' | 'VOICE_NOTE' | null;
    requestedAt: string | null;
    meetingTime: string | null;
    confirmedTime: string | null;
    reviewNote: string | null;
  };
};

export type VerificationSnapshot = {
  states: ItemStates;
  items: ServerItems | null;
};

/**
 * Normalizes any backend status representation (e.g. UPPERCASE DB enums like 'PENDING_REVIEW',
 * 'APPROVED', 'VERIFIED', 'SUBMITTED', 'NEEDS_CHANGES', or lowercase 'pending_review')
 * into the strict frontend ItemState ('not_started' | 'in_progress' | 'pending_review' | 'verified').
 */
export function normalizeItemState(
  v: unknown,
  rawObj?: any,
  fallback: ItemState = 'not_started',
): ItemState {
  if (typeof v === 'string' && v.trim()) {
    const s = v.trim().toLowerCase();
    if (s === 'verified' || s === 'approved' || s === 'completed') return 'verified';
    if (s === 'pending_review' || s === 'in_review' || s === 'submitted' || s === 'pending') {
      return 'pending_review';
    }
    if (
      s === 'in_progress' ||
      s === 'needs_changes' ||
      s === 'rejected' ||
      s === 'declined' ||
      s === 'resubmit_requested'
    ) {
      return 'in_progress';
    }
    if (s === 'not_started') return 'not_started';
  }

  // Fallback checks from raw object fields
  if (rawObj && typeof rawObj === 'object') {
    const rawState = rawObj.state ?? rawObj.status ?? rawObj.reviewStatus;
    if (rawState && typeof rawState === 'string' && rawState !== v) {
      return normalizeItemState(rawState, undefined, fallback);
    }
    // If the object has actual submitted timestamps or data but state is absent, infer pending_review
    if (
      rawObj.submittedAt ||
      rawObj.requestedAt ||
      rawObj.meetingTime ||
      rawObj.path ||
      rawObj.fullName ||
      rawObj.nin ||
      rawObj.bvn ||
      (Array.isArray(rawObj.files) && rawObj.files.length > 0)
    ) {
      return 'pending_review';
    }
  }

  return fallback;
}

const reviewed = (raw: any): ReviewedItem => {
  const rawState = raw?.state ?? raw?.status ?? raw?.reviewStatus;
  const state = normalizeItemState(rawState, raw, 'not_started');
  return {
    state,
    submittedAt: raw?.submittedAt ?? raw?.requestedAt ?? null,
    reviewNote: raw?.reviewNote ?? null,
  };
};

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

    // Validate that body is an actual items payload and not an error
    const isError = !body || !!body.error || body.statusCode >= 400;
    const root = body?.data ?? body?.items ?? body;

    if (!isError && root && typeof root === 'object') {
      const rawIdentity = root?.identity ?? root?.nin_liveness;
      const rawBvn = root?.bvn;
      const rawGuarantor = root?.guarantor;
      const rawBackground = root?.background;
      const rawCerts = root?.certificates;
      const rawSkills = root?.skills ?? root?.skillsAssessment;

      const certsState = normalizeItemState(
        rawCerts?.state ?? rawCerts?.status ?? rawCerts?.reviewStatus,
        rawCerts,
        Array.isArray(rawCerts?.files) && rawCerts.files.length > 0 ? 'verified' : 'not_started',
      );

      const skillsState = normalizeItemState(
        rawSkills?.state ?? rawSkills?.status ?? rawSkills?.reviewStatus,
        rawSkills,
        'not_started',
      );

      items = {
        identity: reviewed(rawIdentity),
        bvn: reviewed(rawBvn),
        guarantor: reviewed(rawGuarantor),
        background: reviewed(rawBackground),
        certificates: {
          state: certsState,
          files: Array.isArray(rawCerts?.files) ? rawCerts.files : [],
        },
        skills: {
          state: skillsState,
          path: rawSkills?.path ?? null,
          requestedAt: rawSkills?.requestedAt ?? rawSkills?.submittedAt ?? null,
          meetingTime: rawSkills?.meetingTime ?? null,
          confirmedTime: rawSkills?.confirmedTime ?? null,
          reviewNote: rawSkills?.reviewNote ?? null,
        },
      };

      states.nin_liveness = items.identity.state;
      states.bvn = items.bvn.state;
      states.guarantor = items.guarantor.state;
      states.background = items.background.state;
      states.certificates = items.certificates.state;
      states.skills = items.skills.state;

      saveItemStates(plugId, states);
    }
  } catch (err) {
    console.warn('loadVerificationSnapshot fallback to cached state:', err);
  }

  return { states, items };
}

/** Formats an ISO UTC timestamp into friendly Lagos time (WAT / UTC+1). */
export function formatLagosTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  try {
    const formatted = new Intl.DateTimeFormat('en-NG', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${formatted} (Lagos Time)`;
  } catch {
    return `${date.toLocaleString('en-NG')} (Lagos Time)`;
  }
}
