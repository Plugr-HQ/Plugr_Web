// src/app/demo/auth/client/[plugId]/page.tsx
// Client sign-up (reached from "Request this Plug" on Browse). No role picker — Client is
// implied. After sign-up, continues to book the requested Plug.

'use client';

import { useParams } from 'next/navigation';
import { AuthForm } from '../../../_components/AuthForm';

export default function ClientAuthPage() {
  const { plugId } = useParams<{ plugId: string }>();

  return (
    <AuthForm
      role="client"
      eyebrow="Almost there"
      title="Create your account"
      subtitle="Sign up to book this Plug and pay safely into escrow."
      redirectTo={`/demo/book/${plugId}`}
      back="/demo/browse"
    />
  );
}
