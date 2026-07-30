// src/app/ad-minn/layout.tsx
// Route protection for everything under /ad-minn (the admin dashboard route).
//
// Wraps all /ad-minn routes. The login route (/ad-minn/login) is exempt so it can render the
// sign-in screen; every other /ad-minn route is gated:
//   1. Fast offline check (JWT role === ADMIN, not expired) — avoids flashing the admin shell
//      for an absent/expired/non-admin token, and redirects immediately.
//   2. Authoritative backend check (via /api/admin/verify) — catches server-side expiry /
//      revocation and any real 401, not just the initial client-side decode.
// It also re-validates when the tab regains focus, so a session that expires mid-use bounces
// back to login rather than silently sitting on a dead token.
//
// Token lives in localStorage (see src/lib/api.ts), which is readable only on the client, so
// this guard is a client component and necessarily runs after mount — middleware can't see it.
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, clearToken } from '@/src/lib/api';
import { isAdminTokenValid, verifyAdminSession } from '@/src/lib/adminAuth';

const LOGIN_PATH = '/ad-minn/login';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === LOGIN_PATH;
  const [status, setStatus] = useState<'checking' | 'ok'>(isLoginRoute ? 'ok' : 'checking');

  useEffect(() => {
    if (isLoginRoute) {
      setStatus('ok');
      return;
    }

    let cancelled = false;

    const check = async () => {
      // 1. Offline gate first — no admin UI flash for an obviously invalid token.
      if (!isAdminTokenValid(getToken())) {
        clearToken();
        router.replace(LOGIN_PATH);
        return;
      }
      // 2. Server-side confirmation (real 401 / revocation / expiry).
      const ok = await verifyAdminSession();
      if (cancelled) return;
      if (!ok) {
        clearToken();
        router.replace(LOGIN_PATH);
        return;
      }
      setStatus('ok');
    };

    void check();

    // Re-check on tab focus to catch a session that expired while away.
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [isLoginRoute, pathname, router]);

  // Login screen renders without the gate (prevents a redirect loop).
  if (isLoginRoute) return <>{children}</>;

  if (status !== 'ok') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone text-sm text-slate">
        Verifying admin access…
      </div>
    );
  }

  return <>{children}</>;
}
