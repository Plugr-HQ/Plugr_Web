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

const ADMIN_USER_KEY = 'plugr_admin_user';

export type AdminUser = {
  id?: string;
  phone?: string;
  name?: string;
  email?: string;
  role?: string;
};

export function setAdminUser(user: AdminUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ADMIN_USER_KEY);
  }
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_USER_KEY);
}

/** Compute first & last initials from name (e.g. "Abdul Rasheed" -> "AR"), falling back to email prefix or "AD". */
export function getAdminInitials(user?: AdminUser | null): string {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }

  const email = user?.email?.trim();
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    if (prefix.length >= 2) return prefix.slice(0, 2).toUpperCase();
    if (prefix.length === 1) return prefix[0].toUpperCase();
  }

  return 'AD';
}

/** Extract first name for welcome label. */
export function getAdminFirstName(user?: AdminUser | null): string {
  const name = user?.name?.trim();
  if (name) {
    return name.split(/\s+/)[0];
  }
  const email = user?.email?.trim();
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'Admin';
}

/**
 * Authoritative check against the backend. Returns true only on a 2xx from the guarded
 * admin endpoint; any 401/403 (expired, revoked, not-admin) or network error → false.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const token = getToken();
  if (!isAdminTokenValid(token)) {
    clearAdminUser();
    return false;
  }
  try {
    const res: any = await apiFetch(
      '/api/admin/verify',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
      { skipAuthRedirect: true }
    );
    if (res?.ok) {
      if (res?.user) setAdminUser(res.user);
      return true;
    }
    clearAdminUser();
    return false;
  } catch {
    return false;
  }
}
