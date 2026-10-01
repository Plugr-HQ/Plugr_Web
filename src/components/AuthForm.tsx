// src/components/AuthForm.tsx
// Lightweight sign-up used by both the Plug and Client auth screens. Collects name + phone,
// stores the client identity, then forwards into the flow.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Shell } from './Shell';
import { Label, TextInput, PrimaryButton } from './ui';
import { setClientIdentity, type ClientRole } from '@/src/lib/net';

export function AuthForm({
  role,
  eyebrow,
  title,
  subtitle,
  redirectTo,
  back,
}: {
  role: ClientRole;
  eyebrow: string;
  title: string;
  subtitle: string;
  redirectTo: string;
  back: string;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim() || !phone.trim()) {
      setError('Enter your name and phone number.');
      return;
    }
    setBusy(true);
    setClientIdentity(role, phone.trim(), name.trim());
    // replace (not push) so pressing Back from the next screen doesn't return to this
    // already-completed sign-up form.
    router.replace(redirectTo);
  }

  return (
    <Shell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      back={back}
      footer={
        <PrimaryButton onClick={submit} loading={busy}>
          {busy ? 'Creating account…' : 'Create account'}
          {!busy && <ArrowRight className="w-4 h-4" />}
        </PrimaryButton>
      }
    >
      <div className="space-y-5">
        <div>
          <Label className="mb-2">Full name</Label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada Obi" autoFocus />
        </div>
        <div>
          <Label className="mb-2">Phone number</Label>
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="0801 234 5678"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-xs text-slate/70">No password needed — we’ll verify your phone number.</p>
    </Shell>
  );
}
