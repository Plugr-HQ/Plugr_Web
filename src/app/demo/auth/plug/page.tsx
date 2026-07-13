// src/app/demo/auth/plug/page.tsx
// Plug sign-up (reached from "Become a Plug"). No role picker — Plug is already chosen.
// Lands on the Plug job view.

'use client';

import { AuthForm } from '../../_components/AuthForm';

export default function PlugAuthPage() {
  return (
    <AuthForm
      role="plug"
      eyebrow="Become a Plug"
      title="Create your Plug account"
      subtitle="Get verified and start receiving jobs."
      redirectTo="/demo/plug"
      back="/demo"
    />
  );
}
