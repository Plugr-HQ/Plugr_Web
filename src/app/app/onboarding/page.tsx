// src/app/app/onboarding/page.tsx — PLG-ON-01 (Plug Profile Setup)
'use client';

import { OnboardingProfileScreen } from '@/src/components/plug/OnboardingProfileScreen';
import { isReturningPlug } from '@/src/app/app/_lib/entryRouting';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // "Become a Plug" on the landing page links straight here, so this is the entry a
  // returning Plug hits most often. Without this check they were walked through
  // onboarding from scratch every time.
  useEffect(() => {
    if (isReturningPlug()) {
      router.replace('/app/plug');
      return;
    }
    setChecking(false);
  }, [router]);

  // Partial drafts are handled inside the screen, which restores draft.step.
  if (checking) return null;
  return <OnboardingProfileScreen base="/app" />;
}
