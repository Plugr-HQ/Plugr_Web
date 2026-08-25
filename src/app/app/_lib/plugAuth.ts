// src/app/app/_lib/plugAuth.ts
// Plug-side session (phone-first, no email) + onboarding draft.
// Held client-side so AUTH-03 can show the target number, onboarding can resume
// at the step it left off, and PLG-01/02/03 know which plug is signed in.

import { clearToken } from '@/src/lib/api';

const PHONE_KEY = 'plugr_plug_phone';
const ADDRESS_KEY = 'plugr_plug_address';
const LATITUDE_KEY = 'plugr_plug_latitude';
const LONGITUDE_KEY = 'plugr_plug_longitude';
const ONBOARDED_KEY = 'plugr_plug_onboarded';
const PLUG_ID_KEY = 'plugr_plug_id';
const DRAFT_KEY = 'plugr_plug_draft';
const NOTIFS_SEEN_KEY = 'plugr_plug_notifs_seen';

export type PlugTrade = 'electrician' | 'plumber' | 'furniture';

export type PlugDraft = {
  firstName?: string;
  lastName?: string;
  trade?: PlugTrade;
  photo?: string; // downscaled data URL
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  nin?: string;
  liveness?: boolean;
  step?: number;
  // Consent — set when the Plug ticks the box in OnboardingProfileScreen (optional there)
  // or the consent gate in OnboardingVerifyScreen (required there, before NIN entry).
  consentAgreed?: boolean;
  consentDocVersion?: string;
  consentAt?: string; // ISO timestamp
};

/* ------------------------------------------------------- Plug ID & Phone Session */

export function setPlugId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLUG_ID_KEY, id);
}

export function getPlugId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLUG_ID_KEY);
}

export function setPlugPhone(phone: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PHONE_KEY, phone);
}

export function getPlugPhone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PHONE_KEY);
}

export function maskPlugPhone(phone?: string | null): string {
  const p = phone ?? getPlugPhone() ?? '';
  if (!p) return '';
  if (p.length <= 4) return p;
  return `${p.slice(0, 4)}••••${p.slice(-3)}`;
}

/**
 * Returning-user detection (lightweight). The real build resolves this from the DB by phone;
 * here a completed onboarding marks the plug as returning so AUTH-03 skips to PLG-01.
 */
export function setPlugOnboarded(done = true) {
  if (typeof window === 'undefined') return;
  if (done) localStorage.setItem(ONBOARDED_KEY, '1');
  else localStorage.removeItem(ONBOARDED_KEY);
}

export function isPlugOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

/* ------------------------------------------------------- onboarding draft */
// Spec: "Progress saved at each step — a Plug who drops off resumes where they left off."

export function getPlugDraft(): PlugDraft {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function savePlugDraft(patch: PlugDraft) {
  if (typeof window === 'undefined') return;
  const next = { ...getPlugDraft(), ...patch };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function clearPlugDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

/* ------------------------------------------------- bank account + PIN (PLG-03) */
// Single active account model — one linked account at a time, not a beneficiaries list.
// Held client-side on purpose: a withdrawal PIN has no business sitting in the backend DB.

const BANK_KEY = 'plugr_plug_bank';
const PIN_KEY = 'plugr_plug_pin';

export type PlugBank = {
  bankName: string;
  bankCode?: string; // Monnify bank code — optional so any pre-existing localStorage record (no code) still parses fine
  accountNumber: string;
  accountName: string; // now always Monnify-confirmed, never free-typed, going forward
  bankLogoUrl?: string;
};
export function setPlugBank(bank: PlugBank) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BANK_KEY, JSON.stringify(bank));
}

export function getPlugBank(): PlugBank | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BANK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function bankLast4(bank: PlugBank | null) {
  return bank ? bank.accountNumber.slice(-4) : '';
}




/* ------------------------------------------------------ notifications seen */
// Last time the plug opened the Notifications screen — anything newer reads as unread.

export function getNotifsSeenAt(): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(NOTIFS_SEEN_KEY) ?? 0);
}

export function markNotifsSeen() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFS_SEEN_KEY, String(Date.now()));
}

/**
 * Full logout. Clears every piece of client-side plug session state AND the backend JWT
 * (plugr_token) — the auth-persistence fix stored the session in localStorage across tabs and
 * restarts, so a redirect alone would leave a live token behind. This wipes both so no plug-only
 * route or guarded API call can succeed afterwards.
 */
export function signOutPlug() {
  if (typeof window === 'undefined') return;
  [PHONE_KEY, ONBOARDED_KEY, PLUG_ID_KEY, DRAFT_KEY, BANK_KEY, PIN_KEY, NOTIFS_SEEN_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
  clearToken(); // remove the plugr_token JWT so the backend session can't linger
}
