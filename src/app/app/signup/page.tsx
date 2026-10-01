// src/app/app/signup/page.tsx
// Plug signup — the single-page form (Part A). Replaces the phone -> OTP -> 6-step-wizard ->
// NIN march as the "Become a Plug" entry point.
//
// Same strict entry guard the old flow used: a Plug who is already onboarded goes to their
// dashboard rather than being shown a signup form again.

'use client';

import { PlugSignupScreen } from '@/src/components/plug/PlugSignupScreen';
import { usePlugEntryRedirect } from '@/src/app/app/_lib/entryRouting';

export default function Page() {
  const checking = usePlugEntryRedirect('/app', true);
  if (checking) return null;
  return <PlugSignupScreen base="/app" />;
}
