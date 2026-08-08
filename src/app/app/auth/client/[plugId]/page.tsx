// src/app/app/auth/client/[plugId]/page.tsx
// Client sign-up (no NIN — clients don't need verification). Continues to booking.

'use client';

import { useParams } from 'next/navigation';
import { AuthForm } from '@/src/components/AuthForm';

export default function AppClientAuthPage() {
  const { plugId } = useParams<{ plugId: string }>();
  return (
    <AuthForm
      role="client"
      eyebrow="Create your account"
      title="Sign up to continue"
      subtitle="Quick sign-up to book this Plug and pay safely into escrow."
      redirectTo={`/app/book/${plugId}`}
      back={`/app/plugs/${plugId}`}
    />
  );
}
