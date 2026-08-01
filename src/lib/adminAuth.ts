// src/lib/adminAuth.ts
// Client-side admin session helpers.
//
// The REAL enforcement lives server-side (NestJS guards on every admin endpoint). This
// module is the UX-level gate for the /ad-minn section: it keeps the admin shell from
// rendering for an absent / expired / non-admin token and bounces to /ad-minn/login.
//
// Two layers:
//   - isAdminTokenValid(): fast, offline JWT decode — role must be ADMIN and not expired.
//   - verifyAdminSession(): authoritative — asks the backend (via same-origin proxy) whether
//     the stored token is still a live admin session, so server-side expiry/revocation and a
//     real 401 are caught, not just the offline check.

import { getToken } from './api';
import { apiFetch } from './api-client';

type JwtPayload = { id?: string; phone?: string; role?: string; exp?: number };

/** Decode a JWT payload. No signature verification — the client can't and shouldn't. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Fast offline check: token present, role === ADMIN, and not past its exp. */
export function isAdminTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || payload.role !== 'ADMIN') return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

/**
 * Authoritative check against the backend. Returns true only on a 2xx from the guarded
 * admin endpoint; any 401/403 (expired, revoked, not-admin) or network error → false.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const token = getToken();
  if (!isAdminTokenValid(token)) return false;
  try {
    await apiFetch(
      '/api/admin/verify',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
      { skipAuthRedirect: true }
    );
    return true;
  } catch {
    return false;
  }
}
