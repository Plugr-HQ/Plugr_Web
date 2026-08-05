// src/app/app/_lib/plugAuth.ts
// Plug-side session (phone-first, no email) + onboarding draft.
// Demo-grade: held client-side so AUTH-03 can show the target number, onboarding can resume
// at the step it left off, and PLG-01/02/03 know which plug is signed in.

const PHONE_KEY = 'plugr_plug_phone';
const ONBOARDED_KEY = 'plugr_plug_onboarded';
const PLUG_ID_KEY = 'plugr_plug_id';
const DRAFT_KEY = 'plugr_plug_draft';

export type PlugTrade = 'electrician' | 'plumber' | 'furniture';

export type PlugDraft = {
  firstName?: string;
  lastName?: string;
  trade?: PlugTrade;
  photo?: string; // downscaled data URL
  phone?: string;
  address?: string;
  nin?: string;
  liveness?: boolean;
  step?: number;
};

/* ---------------------------------------------------------------- phone */

export function setPlugPhone(digits: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PHONE_KEY, digits);
}

export function getPlugPhone(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PHONE_KEY) ?? '';
}

/** Full display form: +234 801 2345 678 */
export function formatPlugPhone(digits: string) {
  const d = (digits ?? '').replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  return `+234 ${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 10)}`.trim();
}

/** Masked display for AUTH-03: +234 801 •••• 678 */
export function maskPlugPhone(digits: string) {
  const d = (digits ?? '').replace(/\D/g, '').slice(0, 10);
  if (d.length < 10) return formatPlugPhone(d);
  return `+234 ${d.slice(0, 3)} •••• ${d.slice(7, 10)}`;
}

/* ------------------------------------------------------- session / plug id */

export function setPlugId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLUG_ID_KEY, id);
}

export function getPlugId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PLUG_ID_KEY) ?? '';
}

/**
 * Returning-user detection (demo-grade). The real build resolves this from the DB by phone;
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
// Held client-side on purpose: a withdrawal PIN has no business sitting in the demo DB.

const BANK_KEY = 'plugr_plug_bank';
const PIN_KEY = 'plugr_plug_pin';

export type PlugBank = { bankName: string; accountNumber: string; accountName: string };

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

export function setPlugPin(pin: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PIN_KEY, pin);
}

export function hasPlugPin(): boolean {
  if (typeof window === 'undefined') return false;
  return (localStorage.getItem(PIN_KEY) ?? '').length === 4;
}

export function checkPlugPin(pin: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PIN_KEY) === pin;
}

export function signOutPlug() {
  if (typeof window === 'undefined') return;
  [PHONE_KEY, ONBOARDED_KEY, PLUG_ID_KEY, DRAFT_KEY, BANK_KEY, PIN_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
}
