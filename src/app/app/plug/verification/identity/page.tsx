// src/app/app/plug/verification/identity/page.tsx — Verification Hub item: NIN + face scan (Didit).
// A static segment, so it takes precedence over the [item] placeholder route for this item.
'use client';

import { IdentityVerificationScreen } from '@/src/components/plug/IdentityVerificationScreen';

export default function Page() {
  return <IdentityVerificationScreen />;
}
