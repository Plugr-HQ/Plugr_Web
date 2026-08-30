// src/app/app/auth/phone/page.tsx — RETIRED
//
// AUTH-02, the phone-first entry to the old wizard. Reaching it sent an OTP and, on verify,
// created a User row with role PLUG and NO PlugProfile — the "account exists, no profile"
// state the login recovery branch had to handle. That is precisely the second signup system
// this change removes: /app/signup now creates the User and the PlugProfile together.
//
// Redirects rather than 404s, for the same reason as /app/onboarding.
//
// Returning Plugs sign in at /app/auth/login (password, or a WhatsApp code).

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RetiredPhoneAuthRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/signup');
  }, [router]);
  return null;
}
