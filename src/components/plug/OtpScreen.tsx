// src/components/plug/OtpScreen.tsx
// AUTH-03 — OTP Verification. 6 auto-advancing boxes, auto-submit on the 6th digit,
// resend locked 30s with a visible countdown, shake+clear on error.
//
// On success: new plug -> PLG-ON-01, returning plug -> PLG-01. Expiry is server-driven
// (backend TTL is 5 minutes) — verifyOtp's own error message covers "expired", so this
// screen no longer runs its own separate 10-minute countdown that could disagree with it.
//
// `base` keeps links inside the right namespace.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { cn } from '@/src/lib/utils';
import { getPlugPhone, maskPlugPhone, setPlugId, setPlugOnboarded } from '@/src/app/app/_lib/plugAuth';
import { api, setToken } from '@/src/lib/api';

const LENGTH = 6;
const RESEND_SECONDS = 30;

export function OtpScreen({ base }: { base: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
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
        const e164 = `+234${getPlugPhone()}`;
        const { accessToken, refreshToken, user, isNewUser, plugId } = await api.auth.verifyOtp(e164, code);

        // A non-Plug number (client/admin) can't sign into the Plug app — routing them to
        // /app/plug would 403 the dashboard ("Access Denied: Required Role is [PLUG, ADMIN]").
        if (!isNewUser && user.role !== 'PLUG') {
          fail(`This number is registered as a ${String(user.role).toLowerCase()} account, not a Plug. Use a different number to become a Plug.`);
          return;
        }

        setToken(accessToken);
        if (typeof window !== 'undefined' && refreshToken) {
          localStorage.setItem('plugr_refresh_token', refreshToken);
        }

        // A new number, or a Plug who hasn't finished onboarding (no PlugProfile yet) -> onboarding.
        // Only a fully-onboarded Plug goes to the dashboard, keyed by their PlugProfile id (the
        // id every /plugs/:id route expects — NOT the User id).
        if (isNewUser || !plugId || user.status === 'PENDING_ONBOARDING') {
          setPlugOnboarded(false);
          router.replace(`${base}/onboarding`);
          return;
        }

        setPlugId(plugId);
        setPlugOnboarded(true);
        router.replace(`${base}/plug`);
      } catch (e: any) {
        fail(e?.message ?? 'Incorrect code. Try again.');
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    },
    [base, fail, router]
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
    try {
      await api.auth.requestOtp(`+234${getPlugPhone()}`, 'PLUG');
      setDigits(Array(LENGTH).fill(''));
      setResendIn(RESEND_SECONDS);
      inputs.current[0]?.focus();
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend the code.');
    } finally {
      setResending(false);
    }
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
        Code expires 5 minutes after it's sent.
      </p>
    </Shell>
  );
}