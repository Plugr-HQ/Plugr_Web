/** Bump when the wording of the 18+ question changes, so people are asked again. */
export const AGE_NOTICE_VERSION = '2026-10-30';

const CONFIRMED_KEY = 'plugr:age18';
const BLOCKED_KEY = 'plugr:age-blocked';

export interface AgeConfirmation {
  v: string;
  at: string; // ISO timestamp, this browser's clock: a convenience, not the record
}

export function readAgeConfirmation(): AgeConfirmation | null {
  try {
    const raw = window.localStorage.getItem(CONFIRMED_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AgeConfirmation>;
    return p && p.v === AGE_NOTICE_VERSION && typeof p.at === 'string' ? (p as AgeConfirmation) : null;
  } catch {
    return null;
  }
}

export function storeAgeConfirmation(): void {
  try {
    const value: AgeConfirmation = { v: AGE_NOTICE_VERSION, at: new Date().toISOString() };
    window.localStorage.setItem(CONFIRMED_KEY, JSON.stringify(value));
    window.localStorage.removeItem(BLOCKED_KEY);
  } catch {
    /* storage blocked: they will simply be asked again next time */
  }
}

export function isAgeBlocked(): boolean {
  try {
    return window.localStorage.getItem(BLOCKED_KEY) === '1';
  } catch {
    return false;
  }
}

export function storeAgeBlocked(): void {
  try {
    window.localStorage.setItem(BLOCKED_KEY, '1');
    window.localStorage.removeItem(CONFIRMED_KEY);
  } catch {
    /* storage blocked */
  }
}

/** What the first server call (OTP request or verify) should send. The server stamps its own time. */
export function ageNoticeVersion(): string | null {
  return readAgeConfirmation()?.v ?? null;
}

/** Spread into the body of every OTP request, OTP verify and register call. */
export function ageFields(): { ageConfirmed: true; ageNoticeVersion: string } | Record<string, never> {
  const v = ageNoticeVersion();
  return v ? { ageConfirmed: true, ageNoticeVersion: v } : {};
}