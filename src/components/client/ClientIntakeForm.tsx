// src/components/client/ClientIntakeForm.tsx
// The one-time client capture (Part B). NOT a sign-up: no password, no OTP, no session.
//
// Four fields — name, location, email, WhatsApp number — and a single submit. The WhatsApp
// number is the identifying key on the backend, so it is the only field besides the name that
// is required; email is genuinely optional and is never verified here (deliberately: an OTP on
// this form would defeat the point of a lightweight capture).
//
// On success the client is "known" (src/lib/clientIdentity.ts) and never sees this form again on
// this device — including from the other entry path.

'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { Shell } from '@/src/components/Shell';
import { Label, TextInput, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { saveClientIdentity } from '@/src/lib/clientIdentity';

/** Display format for a Nigerian mobile: 0XX XXXX XXX. Stored as national digits. */
function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 10)].filter(Boolean).join(' ');
}

export type ClientIntakeResult = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
};

export function ClientIntakeForm({
  plugName,
  submitLabel,
  onDone,
  back,
}: {
  /** Who they're requesting — shown so the form doesn't feel like a detour. */
  plugName?: string | null;
  submitLabel: string;
  /** Called once the capture has been recorded. The caller decides where to go next. */
  onDone: (client: ClientIntakeResult) => void;
  back: string;
}) {
  const [name, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneComplete = digits.length === 10;
  const canSubmit = name.trim().length > 1 && phoneComplete;

  function onPhoneChange(v: string) {
    setError(null);
    let d = v.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.slice(1); // so +234 0801… can't happen
    setDigits(d.slice(0, 10));
  }

  async function submit() {
    if (!canSubmit || busy) return;
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, or leave it blank.');
      return;
    }

    setBusy(true);
    setError(null);

    const client: ClientIntakeResult = {
      name: name.trim(),
      phone: `+234${digits}`,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    };

    // Record on the backend, where the WhatsApp number is the identifying key.
    //
    // A failure here does NOT block the hand-off. The client asked to be connected to an artisan;
    // stranding them on a form because a capture call failed would be the wrong trade. The
    // conversation still reaches the bot with their details in the message, and ops can recover
    // it from there. The local identity is saved either way so they aren't asked twice.
    try {
      const res = await fetch('/api/clients/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      const body = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        // A validation error IS worth stopping for — the number is the key, and a bad one makes
        // the record useless. Anything else (network, 500) falls through to the hand-off.
        if (res.status === 400) {
          setError(body?.error || 'Check your details and try again.');
          setBusy(false);
          return;
        }
        console.error('client intake failed', res.status, body);
      }

      saveClientIdentity({ ...client, id: body?.client?.id });
    } catch (e) {
      console.error('client intake failed', e);
      saveClientIdentity(client);
    }

    onDone(client);
  }

  return (
    <Shell
      eyebrow="One quick step"
      title={plugName ? `Request ${plugName.split(' ')[0]}` : 'Your details'}
      subtitle="Just so the artisan knows who they're talking to. No account, no password."
      back={back}
      footer={
        <GoldButton onClick={submit} disabled={!canSubmit} loading={busy}>
          {busy ? 'One moment…' : submitLabel}
          {!busy && <ArrowRight className="w-4 h-4" />}
        </GoldButton>
      }
    >
      <div className="space-y-5">
        <div>
          <Label className="mb-2">Your name</Label>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ada Obi"
            autoFocus
          />
        </div>

        <div>
          <Label className="mb-2">WhatsApp number</Label>
          <div
            className={cn(
              'flex items-stretch rounded-2xl bg-white border transition-colors overflow-hidden',
              error ? 'border-red-400' : 'border-midnight/10 focus-within:border-gold'
            )}
          >
            <span className="grid place-items-center px-4 text-sm font-bold text-slate border-r border-midnight/10 bg-bone/60">
              +234
            </span>
            <input
              value={formatPhone(digits)}
              onChange={(e) => onPhoneChange(e.target.value)}
              inputMode="tel"
              placeholder="801 2345 678"
              className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-midnight outline-none placeholder:text-slate/40"
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate/70">
            <FaWhatsapp className="w-3.5 h-3.5 shrink-0" />
            This is how the artisan reaches you — make sure it&rsquo;s on WhatsApp.
          </p>
        </div>

        <div>
          <Label className="mb-2">Where are you?</Label>
          <TextInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Sabo, Yaba"
          />
        </div>

        <div>
          <Label className="mb-2">
            Email <span className="font-normal text-slate/60">(optional)</span>
          </Label>
          <TextInput
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            inputMode="email"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </Shell>
  );
}
