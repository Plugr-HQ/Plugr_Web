// src/app/app/auth/login/page.tsx
// Returning-user login. Phone entry first, requests OTP via backend (POST /auth/login),
// then transitions to the OTP entry screen inline before signing and storing JWT tokens.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Label, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { api, setToken } from '@/src/lib/api';
import { setPlugPhone, setPlugId, setPlugOnboarded, maskPlugPhone } from '@/src/app/app/_lib/plugAuth';

/** Where each role lands after a successful login. */
function destinationFor(role: string): string {
  if (role === 'PLUG') return '/app/plug';
  if (role === 'ADMIN') return '/ad-minn';
  return '/app/browse';
}

function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 10)].filter(Boolean).join(' ');
}

export default function AppLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [resending, setResending] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingOtp = useRef(false);

  const complete = digits.length === 10;

  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn, step]);

  function onChange(v: string) {
    setError(null);
    setNotRegistered(false);
    let d = v.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.slice(1); // so +234 0801… can't happen
    setDigits(d.slice(0, 10));
  }

  async function login() {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    setNotRegistered(false);
    try {
      const phone = `+234${digits}`;
      const res = await api.auth.login(phone);
      if (res.requiresOtp) {
        setPlugPhone(digits);
        setOtpDigits(Array(6).fill(''));
        setResendIn(30);
        setStep('otp');
        setTimeout(() => otpInputs.current[0]?.focus(), 50);
      } else {
        setError('Login failed. Unexpected response from server.');
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Could not sign you in. Try again.';
      // Backend throws a specific "no registered account" message for unknown numbers —
      // catch that case and offer the signup path instead of a bare error.
      if (/no registered account/i.test(msg)) {
        setNotRegistered(true);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  const submitOtp = useCallback(
    async (code: string) => {
      if (submittingOtp.current) return;
      submittingOtp.current = true;
      setVerifying(true);
      setError(null);
      try {
        const phone = `+234${digits}`;
        const { accessToken, refreshToken, user, isNewUser, plugId } = await api.auth.verifyOtp(phone, code);

        setToken(accessToken);
        if (typeof window !== 'undefined' && refreshToken) {
          localStorage.setItem('plugr_refresh_token', refreshToken);
        }

        // Store user status if available
        if (typeof window !== 'undefined' && user?.status) {
          localStorage.setItem('plugr_user_status', user.status);
        }

        if (user.role === 'PLUG') {
          if (isNewUser || !plugId || user.status === 'PENDING_ONBOARDING') {
            setPlugOnboarded(false);
            router.replace('/app/onboarding');
            return;
          }
          setPlugId(plugId);
          setPlugOnboarded(true);
          router.replace('/app/plug');
        } else if (user.role === 'ADMIN') {
          router.replace('/ad-minn');
        } else {
          router.replace('/app/browse');
        }
      } catch (e: any) {
        setError(e?.message ?? 'Incorrect code. Try again.');
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => {
          otpInputs.current[0]?.focus();
        }, 400);
      } finally {
        submittingOtp.current = false;
        setVerifying(false);
      }
    },
    [digits, router]
  );

  function setOtpAt(i: number, v: string) {
    const next = [...otpDigits];
    next[i] = v;
    setOtpDigits(next);
    const code = next.join('');
    if (code.length === 6 && next.every(Boolean)) submitOtp(code);
  }

  function onOtpChange(i: number, raw: string) {
    if (verifying) return;
    setError(null);
    const only = raw.replace(/\D/g, '');
    if (!only) return setOtpAt(i, '');
    if (only.length > 1) {
      const next = [...otpDigits];
      only.split('').slice(0, 6 - i).forEach((d, k) => (next[i + k] = d));
      setOtpDigits(next);
      const landed = Math.min(i + only.length, 5);
      otpInputs.current[landed]?.focus();
      const code = next.join('');
      if (code.length === 6 && next.every(Boolean)) submitOtp(code);
      return;
    }
    setOtpAt(i, only);
    if (i < 5) otpInputs.current[i + 1]?.focus();
  }

  function onOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpInputs.current[i - 1]?.focus();
      setOtpAt(i - 1, '');
    }
    if (e.key === 'ArrowLeft' && i > 0) otpInputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) otpInputs.current[i + 1]?.focus();
  }

  async function resend() {
    if (resendIn > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const phone = `+234${digits}`;
      await api.auth.requestOtp(phone);
      setOtpDigits(Array(6).fill(''));
      setResendIn(30);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <Shell
      eyebrow={step === 'phone' ? "Welcome back" : "Enter the code"}
      title={step === 'phone' ? "Log in to Plugr" : "Enter the code"}
      subtitle={
        step === 'phone'
          ? "Enter the number your account is registered with."
          : `Sent to ${maskPlugPhone(`+234${digits}`)}`
      }
      back={step === 'phone' ? "/app" : undefined}
      onBack={
        step === 'otp'
          ? () => {
              setStep('phone');
              setError(null);
            }
          : undefined
      }
      footer={
        step === 'phone' ? (
          <GoldButton onClick={login} disabled={!complete} loading={busy}>
            {busy ? 'Signing in…' : 'Log In'}
            {!busy && <ArrowRight className="w-4 h-4" />}
          </GoldButton>
        ) : null
      }
    >
      {step === 'phone' ? (
        <>
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
              onKeyDown={(e) => e.key === 'Enter' && login()}
              className="flex-1 min-w-0 bg-transparent px-4 py-3.5 font-body text-base text-midnight tnum tracking-wide placeholder:text-slate/40 focus:outline-none"
            />

            {busy && (
              <span className="flex items-center pr-4">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
              </span>
            )}
          </div>

          {notRegistered ? (
            <div className="mt-3 rounded-xl bg-gold/10 border border-gold/30 px-4 py-3">
              <p className="text-sm text-midnight font-medium">
                No account found for that number.
              </p>
              <button
                onClick={() => router.push('/app/auth/phone')}
                className="mt-1 text-sm font-bold text-midnight underline underline-offset-4 hover:text-gold transition-colors"
              >
                Sign up as a Plug instead
              </button>
            </div>
          ) : error ? (
            <p className="mt-2.5 text-sm text-red-600">{error}</p>
          ) : (
            <p className="mt-2.5 text-xs text-slate/80">
              This is a temporary phone-only login. OTP verification is next.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 sm:gap-2.5">
            {otpDigits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpInputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => onOtpChange(i, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                maxLength={6}
                readOnly={verifying}
                aria-label={`Digit ${i + 1}`}
                className={cn(
                  'h-14 flex-1 min-w-0 rounded-xl border bg-white text-center font-display text-2xl text-midnight tnum transition-colors focus:outline-none',
                  error ? 'border-red-400' : d ? 'border-gold' : 'border-midnight/10 focus:border-gold'
                )}
              />
            ))}
          </div>

          {verifying && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate">
              <Loader2 className="w-4 h-4 animate-spin text-gold" /> Verifying…
            </div>
          )}

          {error && !verifying && <p className="mt-4 text-sm text-red-600">{error}</p>}

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
        </>
      )}
    </Shell>
  );
}
