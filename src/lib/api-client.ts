// TODO: Follow-up pass to migrate other production screens under src/app/app/**
// that still use jsonFetch instead of apiFetch:
// - src/app/app/book/[plugId]/page.tsx
// - src/app/app/confirm/[jobId]/page.tsx
// - src/app/app/pay/[jobId]/page.tsx
// - src/app/app/plug/[jobId]/page.tsx
// - src/app/app/plugs/[plugId]/page.tsx
// - src/app/app/receipt/[jobId]/page.tsx
// - src/app/app/wallet/[plugId]/page.tsx
// - src/app/app/withdraw/[plugId]/page.tsx

import { refreshAccessToken } from './api';

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  config: { redirectTo?: string; skipAuthRedirect?: boolean } = {}
) {
    // Always attach the *current* stored token (re-read each attempt, so a refresh mid-call
    // is picked up on retry). The stored token wins over any Authorization the caller passed.
    const doFetch = () => {
      let headers: HeadersInit = { ...options.headers };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('plugr_token');
        if (token) {
          headers = { ...headers, Authorization: `Bearer ${token}` };
        }
      }
      return fetch(url, { ...options, headers, credentials: 'include' });
    };

    let res = await doFetch();

    // Session renewal: on a 401, try a one-time silent refresh and replay the request. Only if
    // the refresh itself fails do we treat the session as truly expired. This is what stops a
    // simple access-token expiry from surfacing as "Session expired".
    if (res.status === 401 && !config.skipAuthRedirect) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await doFetch();
      }
    }

    if (res.status === 401) {
      if (!config.skipAuthRedirect) {
        // Refresh unavailable or rejected — the session is genuinely gone. Clear both tokens.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('plugr_token');
          localStorage.removeItem('plugr_refresh_token');
          window.location.href = config.redirectTo || '/login?reason=session_expired';
        }
      }
      throw new Error('Session expired');
    }

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error((body && (body.error || body.detail)) || `Request failed: ${res.status}`);
    }

    return body;
  }