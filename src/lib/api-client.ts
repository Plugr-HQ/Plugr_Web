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

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  config: { redirectTo?: string; skipAuthRedirect?: boolean } = {}
) {
    let headers: HeadersInit = { ...options.headers };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('plugr_token');
      if (token) {
        headers = {
          Authorization: `Bearer ${token}`,
          ...headers,
        };
      }
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // if using cookies
    });
  
    if (res.status === 401) {
      if (!config.skipAuthRedirect) {
        // Clear whatever you're storing (adjust to your storage method)
        localStorage.removeItem('plugr_token'); // primary app token
        // or: clear the cookie via a logout endpoint if httpOnly
  
        if (typeof window !== 'undefined') {
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