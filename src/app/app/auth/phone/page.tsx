// src/app/app/auth/phone/page.tsx — AUTH-02 (Plug side)
'use client';

import { PhoneScreen } from '@/src/components/plug/PhoneScreen';
import { usePlugEntryRedirect } from '@/src/app/app/_lib/entryRouting';

export default function Page() {
  // Strict: reaching this screen means they've chosen the Plug path, so a returning
  // Plug goes to their dashboard and a partial draft resumes onboarding rather than
  // re-entering a phone number that's already stored.
  const checking = usePlugEntryRedirect('/app', true);
  if (checking) return null;
  return <PhoneScreen base="/app" />;
}
