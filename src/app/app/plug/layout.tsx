// src/app/app/plug/layout.tsx
// Session guard for every /app/plug/* screen (home, profile, wallet, notifications, settings).
// A Plug route must not render with no session — if there's no plug id in localStorage (e.g.
// after logout, or a direct URL hit while signed out) we redirect to the homepage, not to
// role-select or onboarding. Client-side because the session lives in localStorage.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';

export default function PlugLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getPlugId()) {
      router.replace('/'); // no session → straight to the root landing page
      return;
    }
    setReady(true);
  }, [router]);

  // Render nothing until the session check passes, so a signed-out user never sees plug content.
  if (!ready) return <div className="min-h-screen bg-bone" />;

  return <>{children}</>;
}
