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
const OTP_CHANNEL_KEY = 'plugr_otp_channel';

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

export function setPlugOtpChannel(channel: 'whatsapp' | 'sms') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OTP_CHANNEL_KEY, channel);
  }
}

export function getPlugOtpChannel(): 'whatsapp' | 'sms' {
  if (typeof window !== 'undefined') {
    const v = localStorage.getItem(OTP_CHANNEL_KEY);
    if (v === 'sms' || v === 'whatsapp') return v;
  }
  return 'whatsapp'; // default
}

export function maskPlugPhone(phone?: string | null): string {
  const p = phone ?? getPlugPhone() ?? '';
  if (!p) return '';
  if (p.length <= 4) return p;
  return `${p.slice(0, 4)}••••${p.slice(-3)}`;
}

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

/* ------------------------------------------------- bank account (PLG-03) */
// Single active account model — one linked account at a time, not a beneficiaries list.
//
// The withdrawal PIN is deliberately NOT stored or checked here. It used to live in
// localStorage with a client-side check (setPlugPin/hasPlugPin/checkPlugPin) — that let
// anyone with script access to the page (an extension, XSS, a shared device) read the PIN
// outright, and the "check" was purely cosmetic since nothing on the server verified it.
// The PIN now only ever exists transiently in component state and is sent to the backend
// on withdraw/set-pin; `PlugProfile.has_pin` (from the dashboard/snapshot response) is the
// source of truth for whether a plug has one set, not anything read from localStorage.

const BANK_KEY = 'plugr_plug_bank';

export type PlugBank = {
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
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
 * (plugr_token).
 */
export function signOutPlug() {
  if (typeof window === 'undefined') return;
  [PHONE_KEY, ONBOARDED_KEY, PLUG_ID_KEY, DRAFT_KEY, BANK_KEY, NOTIFS_SEEN_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
  clearToken();
}