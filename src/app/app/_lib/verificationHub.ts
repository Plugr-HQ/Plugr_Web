// src/app/app/_lib/verificationHub.ts
// The Verification Hub's item model and state machine — everything the Hub screen needs to know
// about a Plug's six verification items, with no UI and no vendor logic in it.
//
// Six items, each independently completable in any order. None blocks another, and none blocks
// the account: verification happens after signup, from the Plug's own dashboard.
//
//   nin_liveness  NIN + liveness      (ops review the typed NIN, the slip and the live selfie)
//   bvn           BVN                 (ops review the typed digits)
//   guarantor     Guarantor           (a human on the other end → pending review)
//   skills        Skills assessment   (a human on the other end → pending review)
//   background    Background info
//   certificates  Certificates        (OPTIONAL — never blocks the overall status)
//
// When every REQUIRED item is verified the Hub reads "All items complete — under review". How many
// that is comes from the `required` flags below — never write the number anywhere else.
// That is a Plug-facing status only: nothing here grants eligibility. Dispatch eligibility is
// enforced server-side (Plugr_Backend plug-eligibility.ts) and an ops review decides it.
//
// STORAGE SEAM: item state lives in localStorage, per Plug id. It is a per-device CACHE, not the
// truth — every item's real state comes from GET /verification/items, and the cache exists so the
// dashboard card and an offline Hub can show the last known value instead of a blank.

export type VerificationItemKey =
  | 'nin_liveness'
  | 'bvn'
  | 'guarantor'
  | 'skills'
  | 'background'
  | 'certificates';

export type ItemState = 'not_started' | 'in_progress' | 'pending_review' | 'verified';

/**
 * BVN is a required item again. It was "Coming soon" while it had no implementation of its own:
 * Fincra's API is built but stopped pending Fincra's own KYC review of Plugr, so there was nothing
 * behind the item. It now has a manual path — the Plug types their BVN, it is encrypted at rest, and
 * ops confirm the digits — which is an implementation, so the item is open and counted again.
 *
 *   true (now)   BVN is a normal required item: 5 required items, and it opens its own screen.
 *   false        BVN reverts to "Coming soon", can't be opened, and is NOT counted (4 items).
 *
 * This constant is the whole switch. The required total, the progress bar, the "X of N" lines and
 * the dashboard button all derive from it — never write the number anywhere else.
 */
export const BVN_ENABLED = true;

export type VerificationItem = {
  key: VerificationItemKey;
  /** URL segment for the item's own screen: /app/plug/verification/<slug>. */
  slug: string;
  title: string;
  /** One line on what the item asks for. */
  summary: string;
  /** Optional items never hold back the overall status. */
  required: boolean;
  /** Shown in the Hub but not available yet: labelled "Coming soon", never opens, never counted. */
  comingSoon?: boolean;
  /** A person on the other end (a guarantor to respond, a skills call to happen), so finishing
   *  the Plug's part leads to pending_review, which can last days, rather than straight to verified. */
  needsHumanReview: boolean;
};

export const VERIFICATION_ITEMS: VerificationItem[] = [
  {
    key: 'nin_liveness',
    slug: 'identity',
    title: 'NIN + face scan',
    summary: 'Enter your NIN, upload your NIN slip, and take a live selfie.',
    required: true,
    // Our own team compares the three by eye — see the note at the top of this file.
    needsHumanReview: true,
  },
  {
    key: 'bvn',
    slug: 'bvn',
    title: 'BVN',
    summary: 'Enter your Bank Verification Number.',
    required: BVN_ENABLED,
    comingSoon: !BVN_ENABLED,
    // Ops confirm the digits, so submitting leads to pending review rather than straight to done.
    needsHumanReview: true,
  },
  {
    key: 'guarantor',
    slug: 'guarantor',
    title: 'Guarantor',
    summary: 'Someone who can vouch for you: name, phone, email, NIN, relationship and signature.',
    required: true,
    needsHumanReview: true,
  },
  {
    key: 'skills',
    slug: 'skills',
    title: 'Skills assessment',
    summary: 'A short check of your trade, by phone call or WhatsApp voice note.',
    required: true,
    needsHumanReview: true,
  },
  {
    key: 'background',
    slug: 'background',
    title: 'Background info',
    summary: 'Your experience, training, job history, date of birth, and state of origin and LGA.',
    required: true,
    needsHumanReview: false,
  },
  {
    key: 'certificates',
    slug: 'certificates',
    title: 'Certificates',
    summary: 'Upload any trade certificates you have.',
    required: false,
    needsHumanReview: false,
  },
];

export type ItemStates = Record<VerificationItemKey, ItemState>;

export function emptyItemStates(): ItemStates {
  return {
    nin_liveness: 'not_started',
    bvn: 'not_started',
    guarantor: 'not_started',
    skills: 'not_started',
    background: 'not_started',
    certificates: 'not_started',
  };
}

export function itemBySlug(slug: string): VerificationItem | undefined {
  return VERIFICATION_ITEMS.find((i) => i.slug === slug);
}

export function itemByKey(key: VerificationItemKey): VerificationItem {
  return VERIFICATION_ITEMS.find((i) => i.key === key)!;
}

// ─── State machine ──────────────────────────────────────────────────────────────────────────
//
//   not_started ──start──▶ in_progress ──submit──▶ verified          (no human review)
//                              │
//                              └────submit──▶ pending_review ──approve──▶ verified   (human review)
//                                                 │
//                                                 └──send back──▶ in_progress
//
// in_progress → not_started is allowed so an abandoned attempt can be reset. `verified` is
// terminal here; revoking a verification is an ops decision this Plug-facing model doesn't make.

export function allowedNext(item: VerificationItem, from: ItemState): ItemState[] {
  switch (from) {
    case 'not_started':
      return ['in_progress'];
    case 'in_progress':
      return item.needsHumanReview ? ['pending_review', 'not_started'] : ['verified', 'not_started'];
    case 'pending_review':
      return item.needsHumanReview ? ['verified', 'in_progress'] : [];
    case 'verified':
      return [];
  }
}

export function canTransition(item: VerificationItem, from: ItemState, to: ItemState): boolean {
  return allowedNext(item, from).includes(to);
}

/** Returns the next states object, or throws on an illegal move, leaving the input untouched. */
export function transition(states: ItemStates, key: VerificationItemKey, to: ItemState): ItemStates {
  const item = itemByKey(key);
  const from = states[key];
  if (!canTransition(item, from, to)) {
    throw new Error(`Illegal verification transition for ${key}: ${from} → ${to}`);
  }
  return { ...states, [key]: to };
}

/** Whether tapping the item should open its screen. Pending review and verified are read-only. */
export function isActionable(state: ItemState): boolean {
  return state === 'not_started' || state === 'in_progress';
}

// ─── Overall status ─────────────────────────────────────────────────────────────────────────

export type HubStatus = 'not_started' | 'in_progress' | 'under_review';

export type HubSummary = {
  status: HubStatus;
  requiredTotal: number;
  requiredVerified: number;
  /** Required items waiting on a human (guarantor / skills call). */
  awaitingReview: number;
};

export function summarize(states: ItemStates): HubSummary {
  const required = VERIFICATION_ITEMS.filter((i) => i.required);
  const requiredVerified = required.filter((i) => states[i.key] === 'verified').length;
  const awaitingReview = required.filter((i) => states[i.key] === 'pending_review').length;
  // Any movement at all, optional certificates included, counts as started. A coming-soon item
  // can't be touched, so a stale cached state for it never counts.
  const anyStarted = VERIFICATION_ITEMS.some((i) => !i.comingSoon && states[i.key] !== 'not_started');

  const status: HubStatus =
    requiredVerified === required.length ? 'under_review' : anyStarted ? 'in_progress' : 'not_started';

  return { status, requiredTotal: required.length, requiredVerified, awaitingReview };
}

// ─── Storage (per-device seam) ──────────────────────────────────────────────────────────────

const STORE_PREFIX = 'plugr_verification_hub:';
const ITEM_STATE_VALUES: ItemState[] = ['not_started', 'in_progress', 'pending_review', 'verified'];

/** Reads a Plug's item states; unknown or corrupt values fall back to not_started per item. */
export function loadItemStates(plugId: string): ItemStates {
  const states = emptyItemStates();
  if (typeof window === 'undefined' || !plugId) return states;
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_PREFIX + plugId) ?? '{}');
    for (const item of VERIFICATION_ITEMS) {
      const v = raw?.[item.key];
      if (ITEM_STATE_VALUES.includes(v)) {
        // A stored pending_review on an item that never goes to a human is not a real state.
        states[item.key] = v === 'pending_review' && !item.needsHumanReview ? 'in_progress' : v;
      }
    }
  } catch {
    // Unreadable storage behaves like a fresh start rather than breaking the Hub.
  }
  return states;
}

export function saveItemStates(plugId: string, states: ItemStates): void {
  if (typeof window === 'undefined' || !plugId) return;
  try {
    localStorage.setItem(STORE_PREFIX + plugId, JSON.stringify(states));
  } catch {
    // Storage full or blocked — the in-memory state still drives the current screen.
  }
}

// ─── Identity (Didit) status — DORMANT ──────────────────────────────────────────────────────
//
// Nothing in the Plug-facing flow reads these any more: the identity item is decided by an ops
// review like every other item, and its state arrives on /verification/items. They are kept because
// the Didit integration behind them is intact and dormant, not deleted — an old decision is still
// readable in the admin view, and switching back needs no retrofit.

/** Why a DECLINED identity check failed (PlugProfile.identityFailureReason). */
export type IdentityFailureReason =
  | 'NIN_NOT_FOUND'
  | 'NIN_DETAILS_MISMATCH'
  | 'NIN_REGISTRY_UNAVAILABLE'
  | 'FACE_MISMATCH'
  | 'LIVENESS_FAILED'
  | 'BVN_USED'
  | 'NIN_NOT_CHECKED'
  | 'OTHER';

/** PlugProfile.identityStatus, as returned by GET /api/plug/verification/identity. */
export type IdentityServerStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'DECLINED'
  | 'RESUBMIT_REQUESTED'
  | 'ABANDONED'
  | 'EXPIRED'
  | 'KYC_EXPIRED';

/**
 * The Hub state for the identity item. Anything the Plug can act on again — declined, expired,
 * abandoned, a resubmission request — is in_progress, so the item stays tappable and its screen
 * explains why.
 */
export function identityItemState(status: IdentityServerStatus | string | null | undefined): ItemState {
  switch (status) {
    case 'APPROVED':
      return 'verified';
    case 'IN_REVIEW':
      return 'pending_review';
    case 'IN_PROGRESS':
    case 'DECLINED':
    case 'RESUBMIT_REQUESTED':
    case 'ABANDONED':
    case 'EXPIRED':
    case 'KYC_EXPIRED':
      return 'in_progress';
    default:
      return 'not_started';
  }
}

/**
 * Cache a state that came from the server. Unlike `transition`, this does not check the local state
 * machine: the server is authoritative and can legitimately jump (e.g. not_started → verified when a
 * decision lands for a session started on another device).
 */
export function saveServerItemState(plugId: string, key: VerificationItemKey, state: ItemState): ItemStates {
  const next = { ...loadItemStates(plugId), [key]: state };
  saveItemStates(plugId, next);
  return next;
}

// ─── Test seeds (non-production only) ───────────────────────────────────────────────────────

export const SEEDS: Record<string, ItemStates> = {
  none: emptyItemStates(),
  partial: {
    ...emptyItemStates(),
    nin_liveness: 'pending_review',
    bvn: 'in_progress',
    guarantor: 'pending_review',
  },
  review: {
    nin_liveness: 'verified',
    bvn: 'verified',
    guarantor: 'pending_review',
    skills: 'pending_review',
    background: 'verified',
    certificates: 'not_started',
  },
  all: {
    nin_liveness: 'verified',
    bvn: 'verified',
    guarantor: 'verified',
    skills: 'verified',
    background: 'verified',
    // Optional and untouched on purpose: it must not hold back "under review".
    certificates: 'not_started',
  },
};

export const seedsEnabled = process.env.NODE_ENV !== 'production';
