// src/app/app/plug/verification/identity/page.tsx — Verification Hub item: NIN + face scan.
// A static segment, so it takes precedence over the [item] placeholder route for this item.
//
// This routes to the MANUAL screen: typed NIN, NIN slip, live selfie, reviewed by our own team.
// The Didit screen (IdentityVerificationScreen) and its whole integration are still in the repo and
// still work — nothing routes to them while the NIMC lookup is unfunded.
'use client';

import { IdentityManualScreen } from '@/src/components/plug/IdentityManualScreen';

export default function Page() {
  return <IdentityManualScreen />;
}
