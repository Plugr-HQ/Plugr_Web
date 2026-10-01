// src/app/app/onboarding/verify/page.tsx — RETIRED. Redirects to the Verification Hub.
//
// This used to render the old onboarding NIN + liveness screen. That screen was a mock: any
// 11-digit NIN passed and the selfie self-approved in the browser. Unlinking it wasn't enough —
// it stayed reachable, and functional, at this URL — so the screen and its write path
// (/api/plugs/nin → POST /plugs/nin) have been deleted, and this route now only redirects.
//
// A server component on purpose: the redirect is issued before anything renders, so no mock form
// is ever sent to the browser. Temporary (307), not permanent: a 308 is cached by browsers
// indefinitely, which would make it impossible to ever reuse this path.
//
// Signed-in Plugs land on the Hub, where the real identity item is. Anyone signed out is sent on to
// the homepage by the plug-area layout, the same as any other /app/plug/* URL.

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/app/plug/verification');
}
