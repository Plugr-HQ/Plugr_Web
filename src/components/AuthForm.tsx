// src/components/AuthForm.tsx
// Lightweight sign-up used by both the Plug and Client auth screens. Collects name + phone,
// stores the client identity, then forwards into the flow. Asks the 18+ question first.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Shell } from './Shell';
import { Label, TextInput, PrimaryButton } from './ui';
import { useAgeGate } from './AgeGate';
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

  // "No" wipes what they typed. Nothing has been stored yet, because the gate runs before setClientIdentity.
  const { ask, dialog, blocked } = useAgeGate({
    onUnderage: () => {
      setName('');
      setPhone('');
    },
  });

  function submit() {
    if (!name.trim() || !phone.trim()) {
      setError('Enter your name and phone number.');
      return;
    }
    setError(null);
    ask(() => {
      setBusy(true);
      setClientIdentity(role, phone.trim(), name.trim());
      // replace (not push) so pressing Back from the next screen doesn't return to this
      // already-completed sign-up form.
      router.replace(redirectTo);
    });
  }

  if (blocked) {
    return (
      <Shell
        eyebrow={eyebrow}
        title="Plugr is for people 18 and over"
        subtitle="We can’t create an account for you, and we haven’t kept any of the details you entered."
        back={back}
        footer={<></>}
      >
        <></>
      </Shell>
    );
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

      {dialog}
    </Shell>
  );
}