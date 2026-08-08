// src/components/plug/PhoneScreen.tsx
// AUTH-02 — Phone Number Entry. Phone-first auth, no email anywhere. Country code locked
// to +234. CTA activates at 10 digits, then routes to AUTH-03.
//
// `base` keeps links inside the right namespace.
//
// This is the "Become a Plug" entry point, so the OTP request is sent with role: 'PLUG' —
// a brand-new number reaching this screen should be bucketed as a Plug on the backend, not
// silently default to CLIENT (which is what happens if role is omitted).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Label, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { setPlugPhone } from '@/src/app/app/_lib/plugAuth';
import { api } from '@/src/lib/api';

/** Display format: 0XX XXXX XXXX (spec). Stored as raw national digits. */
function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 10)].filter(Boolean).join(' ');
}

export function PhoneScreen({ base }: { base: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = digits.length === 10;

  function onChange(v: string) {
    setError(null);
    let d = v.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.slice(1); // so +234 0801… can't happen
    setDigits(d.slice(0, 10));
  }

  async function sendCode() {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    try {
      const phone = `+234${digits}`;
      await api.auth.requestOtp(phone, 'PLUG');
      setPlugPhone(digits);
      router.push(`${base}/auth/otp`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not send the code. Try again.');
      setBusy(false);
    }
  }

  return (
    <Shell
      eyebrow="Become a Plug"
      title="What’s your number?"
      subtitle="We’ll send you a code to verify it’s you."
      back={base}
      footer={
        <GoldButton onClick={sendCode} disabled={!complete} loading={busy}>
          {busy ? 'Sending code…' : 'Send Code'}
          {!busy && <ArrowRight className="w-4 h-4" />}
        </GoldButton>
      }
    >
      <Label className="mb-2">Phone number</Label>

      <div
        className={cn(
          'flex items-stretch rounded-2xl bg-white border transition-colors overflow-hidden',
          error ? 'border-red-400' : 'border-midnight/10 focus-within:border-gold'
        )}
      >
        <span className="flex items-center gap-2 px-4 border-r border-midnight/10 bg-bone/60 select-none">
          <svg viewBox="0 0 6 3" preserveAspectRatio="none" aria-hidden className="h-3.5 w-6 shrink-0 rounded-[2px] border border-midnight/10">
            <rect width="6" height="3" fill="#fff" />
            <rect width="2" height="3" fill="#008751" />
            <rect x="4" width="2" height="3" fill="#008751" />
          </svg>
          <span className="font-body text-base font-bold text-midnight tnum">+234</span>
        </span>

        <input
          value={formatPhone(digits)}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoFocus
          readOnly={busy}
          placeholder="801 234 5678"
          aria-label="Phone number"
          onKeyDown={(e) => e.key === 'Enter' && sendCode()}
          className="flex-1 min-w-0 bg-transparent px-4 py-3.5 font-body text-base text-midnight tnum tracking-wide placeholder:text-slate/40 focus:outline-none"
        />

        {busy && (
          <span className="flex items-center pr-4">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-2.5 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-2.5 text-xs text-slate/80">
          Nigerian numbers only for now. We never share your number with clients.
        </p>
      )}
    </Shell>
  );
}