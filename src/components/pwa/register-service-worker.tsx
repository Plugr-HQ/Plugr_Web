'use client';

import { useEffect } from 'react';

/**
 * Mount ONCE, inside app/app/layout.tsx — NOT the root layout. Scope is
 * deliberately limited to /app/ so marketing/funnel pages (waitlist, find,
 * become-a-plug, demo) are never controlled by this SW's cache.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/app/' })
      .catch((err) => console.error('SW registration failed:', err));
  }, []);

  return null;
}