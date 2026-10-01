// src/app/app/auth/otp/page.tsx — RETIRED
//
// AUTH-03, the second step of the old phone-first signup. Only ever reachable from
// /app/auth/phone, which is itself retired. Sign-in OTP still exists and is handled inline on
// /app/auth/login, which owns its own code entry — this route was signup-only.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RetiredOtpRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/signup');
  }, [router]);
  return null;
}
