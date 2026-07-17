// src/components/plug/OtpScreen.tsx
// AUTH-03 — OTP Verification. 6 auto-advancing boxes, auto-submit on the 6th digit,
// resend locked 30s with a visible countdown, shake+clear on error, 10-minute expiry.
//
// On success: new plug -> PLG-ON-01, returning plug (onboarding complete) -> PLG-01.
//
// Shared by /app and /demo — `base` keeps links inside the right namespace.
//
// NOTE: there is no SMS provider wired yet, so any 6-digit code verifies (same stance as
// the 11-digit NIN). The error/expiry paths below are real and will light up as-is once a
// provider is plugged into `verifyCode`.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { cn } from '@/src/lib/utils';
import { getPlugPhone, maskPlugPhone, isPlugOnboarded } from '@/src/app/app/_lib/plugAuth';

const LENGTH = 6;
const RESEND_SECONDS = 30;
const EXPIRY_SECONDS = 10 * 60; // spec: OTP expires after 10 minutes

/** Stand-in for the SMS provider. Any 6 digits pass until a provider is wired. */
async function verifyCode(code: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 650));
  return /^\d{6}$/.test(code);
}

export function OtpScreen({ base }: { base: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [age, setAge] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submitting = useRef(false);

  useEffect(() => setPhone(getPlugPhone()), []);
  useEffect(() => inputs.current[0]?.focus(), []);

  // resend lock countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // 10-minute expiry
  useEffect(() => {
    if (expired) return;
    const t = setTimeout(() => setAge((a) => a + 1), 1000);
    if (age >= EXPIRY_SECONDS) {
      setExpired(true);
      setError('That code expired. Request a new one.');
    }
    return () => clearTimeout(t);
  }, [age, expired]);

  const fail = useCallback((msg: string) => {
    setError(msg);
    setShake(true);
    setDigits(Array(LENGTH).fill(''));
    setTimeout(() => {
      setShake(false);
      inputs.current[0]?.focus();
    }, 400);
  }, []);

  const submit = useCallback(
    async (code: string) => {
      if (submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setError(null);
      try {
        if (expired) {
          fail('That code expired. Request a new one.');
          return;
        }
        const ok = await verifyCode(code);
        if (!ok) {
          fail('Incorrect code. Try again.');
          return;
        }
        // returning plug skips onboarding entirely
        router.replace(isPlugOnboarded() ? `${base}/plug` : `${base}/onboarding`);
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    },
    [base, expired, fail, router]
  );

  function setAt(i: number, v: string) {
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    const code = next.join('');
    if (code.length === LENGTH && next.every(Boolean)) submit(code); // auto-submit on 6th
  }

  function onChange(i: number, raw: string) {
    if (busy) return;
    setError(null);
    const only = raw.replace(/\D/g, '');
    if (!only) return setAt(i, '');
    // paste / fast-type: distribute across boxes
    if (only.length > 1) {
      const next = [...digits];
      only.split('').slice(0, LENGTH - i).forEach((d, k) => (next[i + k] = d));
      setDigits(next);
      const landed = Math.min(i + only.length, LENGTH - 1);
      inputs.current[landed]?.focus();
      const code = next.join('');
      if (code.length === LENGTH && next.every(Boolean)) submit(code);
      return;
    }
    setAt(i, only);
    if (i < LENGTH - 1) inputs.current[i + 1]?.focus(); // auto-advance
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setAt(i - 1, '');
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  async function resend() {
    if (resendIn > 0 || resending) return;
    setResending(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 600));
    setDigits(Array(LENGTH).fill(''));
    setExpired(false);
    setAge(0);
    setResendIn(RESEND_SECONDS);
    setResending(false);
    inputs.current[0]?.focus();
  }

  return (
    <Shell
      eyebrow="Become a Plug"
      title="Enter the code"
      subtitle={phone ? `Sent to ${maskPlugPhone(phone)}` : 'Sent to your phone'}
      back={`${base}/auth/phone`}
    >
      {/* 6 auto-advancing boxes */}
      <div className={cn('flex gap-2 sm:gap-2.5', shake && 'otp-shake')}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            maxLength={LENGTH}
            readOnly={busy}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              'h-14 flex-1 min-w-0 rounded-xl border bg-white text-center font-display text-2xl text-midnight tnum transition-colors focus:outline-none',
              error ? 'border-red-400' : d ? 'border-gold' : 'border-midnight/10 focus:border-gold'
            )}
          />
        ))}
      </div>

      {busy && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate">
          <Loader2 className="w-4 h-4 animate-spin text-gold" /> Verifying…
        </div>
      )}

      {error && !busy && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 text-sm text-slate">
        {resendIn > 0 ? (
          <span>
            Resend code in <span className="font-bold text-midnight tnum">{resendIn}s</span>
          </span>
        ) : (
          <button
            onClick={resend}
            disabled={resending}
            className="font-bold text-midnight underline underline-offset-4 hover:text-gold transition-colors disabled:opacity-60"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>

      <p className="mt-6 text-xs text-slate/70">
        No SMS provider is wired yet — any 6 digits verify for now.
      </p>
    </Shell>
  );
}
