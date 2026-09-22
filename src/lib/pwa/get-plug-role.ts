// lib/pwa/get-plug-role.ts
//
// Client-side, UNVERIFIED read of the `role` claim already present in the
// access token (see Plugr_Backend AuthService.generateAuthClaims — payload
// is { id, phone, role }). This exists purely to gate a UI element (the PWA
// install prompt). It is not an authorization check — the backend guards
// already own that, and this never needs to be cryptographically verified
// because worst case a spoofed value just shows/hides a button.
//
// Confirmed against src/lib/api-client.ts: setToken()/getToken() read and
// write this exact key, and it's the NestJS access token (role is on its
// payload per AuthService.generateAuthClaims). src/lib/auth.ts, which looks
// like a competing auth source, is unrelated — it's a server-side Supabase
// check used only by requireJobParty() for job-party API route guards, not
// the Plug's browser session.

const ACCESS_TOKEN_STORAGE_KEY = 'plugr_token';

function decodeJwtPayload<T = unknown>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export type PlugrJwtPayload = {
  id: string;
  phone: string;
  role: 'CLIENT' | 'PLUG' | 'ADMIN' | string;
  iat?: number;
  exp?: number;
};

/** Decoded payload of the current access token, or null if absent/unparseable. */
export function getCurrentAuthPayload(): PlugrJwtPayload | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!token) return null;
  return decodeJwtPayload<PlugrJwtPayload>(token);
}

/**
 * True once there's a signed-in Plug — i.e. account created (verifyOtp /
 * register already ran) — independent of NIN/BVN verification status.
 * This is the eligibility signal the install prompt gates on.
 */
export function isEligiblePlug(): boolean {
  const payload = getCurrentAuthPayload();
  return !!payload && payload.role === 'PLUG';
}