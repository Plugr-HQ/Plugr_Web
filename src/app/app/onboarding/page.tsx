// src/app/app/onboarding/page.tsx — RETIRED
//
// This was PLG-ON-01, the six-step Plug signup wizard (name -> consent -> phone+OTP -> trade
// -> location -> photo, then a separate NIN screen before the account was created at all).
// Signup is now a single page at /app/signup that creates the account and its PlugProfile in
// one submit, and identity verification happens afterwards from the profile-completion prompt.
//
// Kept as a redirect rather than deleted: this path was linked from the landing page, the
// footer and the post-login recovery branch for months, so it exists in browser history, in
// bookmarks, and in any message where someone shared "the signup link". A 404 for those people
// is a worse outcome than a hop to the form that replaced it.
//
// /app/onboarding/verify is NOT retired — that is the live NIN verification screen, reached
// from the "complete your profile" prompt on the dashboard.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RetiredOnboardingRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/signup');
  }, [router]);
  return null;
}
