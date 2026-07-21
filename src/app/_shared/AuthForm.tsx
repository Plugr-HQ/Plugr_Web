// src/app/_shared/AuthForm.tsx
// Flavor sign-up used by both the Plug and Client auth screens. Collects name + phone
// (no password, not validated — per the hackathon brief), stores the demo identity, then
// forwards into the flow.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Shell } from './Shell';
import { Label, TextInput, PrimaryButton } from './ui';
import { setDemoIdentity, type DemoRole } from './demo';

export function AuthForm({
  role,
  eyebrow,
  title,
  subtitle,
  redirectTo,
  back,
}: {
  role: DemoRole;
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
    setDemoIdentity(role, phone.trim(), name.trim());
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

      <p className="mt-6 text-xs text-slate/70">Flavor sign-up for the demo — no password, not validated.</p>
    </Shell>
  );
}
