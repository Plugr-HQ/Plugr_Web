// src/app/ad-minn/login/page.tsx
// Admin sign-in. Uses the SAME backend phone+OTP flow as everyone else
// (POST /auth/otp/request -> /auth/otp/verify), then gates on role === ADMIN.
//
// A non-admin who verifies a real code is hard-rejected here: no token is stored, no
// redirect, no partial access. Only an ADMIN response stores the token and enters /ad-minn.
//
// This is a distinct screen (not the plug OtpScreen / [flow]/otp pages) because those are
// client-side mocks — they accept any 6 digits, call no backend, store no token and route
// into the plug/onboarding flow. There is no existing backend-wired OTP component to reuse.
//
// Layout: split card (welcome panel + sign-in form) on md+, single column on mobile.
// Only the presentation changed in the redesign; the auth logic is untouched.
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api, setToken, clearToken } from '@/src/lib/api';
import { setAdminUser } from '@/src/lib/adminAuth';
import { cn } from '@/src/lib/utils';
import { PrimaryButton } from '@/src/components/ui';
import { useResendCooldown, formatCooldown } from '@/src/lib/useResendCooldown';

const LENGTH = 6;

/** Helper to ensure local Nigerian numbers map to canonical E.164 (+234...) */
function formatPhone(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (trimmed.startsWith('0') && trimmed.length === 11) {
    return `+234${trimmed.slice(1)}`;
  }
  if (!trimmed.startsWith('+') && trimmed.startsWith('234')) {
    return `+${trimmed}`;
  }
  return trimmed;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submitting = useRef(false);
  // Same clock the Plug login uses. Started on the FIRST send too, not just resends, so the
  // button is never briefly enabled before a code could plausibly have arrived.
  const cooldown = useResendCooldown();
  const [resending, setResending] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setError(null);

    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length < 11) {
      setError('Enter a valid phone number, for example 08012345678 or +2348012345678.');
      return;
    }

    setBusy(true);
    try {
      await api.auth.requestOtp(formattedPhone);
      cooldown.start();
      setStep('otp');
      setNotice(`We sent a 6-digit code to ${formattedPhone} on WhatsApp.`);
      setDigits(Array(LENGTH).fill(''));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: any) {
      // Extracts backend exception message or falls back gracefully
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'We couldn’t send the code. Check your connection and try again.';
      setError(serverMessage);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Ask for another code. Deliberately the SAME call as the initial send
   * (api.auth.requestOtp -> POST /auth/otp/request): the backend stores one code per phone under
   * a single `otp:${phone}` Redis key, so issuing a new one overwrites the previous code and
   * resets its attempt counter. There is nothing extra to invalidate client-side.
   */
  async function resendCode() {
    if (cooldown.active || resending || busy) return;
    setResending(true);
    setError(null);
    try {
      const formattedPhone = formatPhone(phone);
      await api.auth.requestOtp(formattedPhone);
      cooldown.start();
      // The previous code is dead server-side, so clear what they typed rather than let them
      // submit digits that can no longer work.
      setDigits(Array(LENGTH).fill(''));
      setNotice(`A new code is on its way to ${formattedPhone} on WhatsApp.`);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'We couldn’t resend the code. Try again in a moment.';
      setError(serverMessage);
    } finally {
      setResending(false);
    }
  }

  async function submitCode(code: string) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);

    const formattedPhone = formatPhone(phone);

    try {
      const res = await api.auth.verifyOtp(formattedPhone, code);
      const role = res?.user?.role;
      const accessToken = res?.accessToken;

      if (role !== 'ADMIN' || !accessToken) {
        clearToken();
        setDigits(Array(LENGTH).fill(''));
        setError('This number isn’t linked to an admin account. Access denied.');
        setTimeout(() => inputs.current[0]?.focus(), 50);
        return;
      }

      setToken(accessToken);
      if (res?.user) setAdminUser(res.user);
      router.replace('/ad-minn');
    } catch (err: any) {
      setDigits(Array(LENGTH).fill(''));
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'That code is incorrect or has expired. Check the code or request a new one.';
      setError(serverMessage);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function onDigit(i: number, raw: string) {
    if (busy) return;
    setError(null);
    const only = raw.replace(/\D/g, '');
    const next = [...digits];
    if (!only) {
      next[i] = '';
      setDigits(next);
      return;
    }
    if (only.length > 1) {
      only.split('').slice(0, LENGTH - i).forEach((d, k) => (next[i + k] = d));
      setDigits(next);
      inputs.current[Math.min(i + only.length, LENGTH - 1)]?.focus();
    } else {
      next[i] = only;
      setDigits(next);
      if (i < LENGTH - 1) inputs.current[i + 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === LENGTH && next.every(Boolean)) submitCode(joined);
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bone p-4 sm:p-6">
      <div className="rise grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-pitch-black/5 ring-1 ring-pitch-black/5 md:grid-cols-2">
        {/* Welcome panel (hidden on mobile; the form header carries the brand there) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gold/10 p-10 md:flex">
          <div className="relative z-10 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Plugr" className="h-7 w-auto" />
            <span className="rounded-pill bg-pitch-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-bone">
              Admin
            </span>
          </div>

          <div className="relative z-10 max-w-sm">
            <h2 className="font-display text-4xl leading-[1.1] text-pitch-black">
              Welcome back to Plugr admin.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate">
              Sign in with your admin phone number to pick up where you left off.
            </p>
          </div>

          {/* Decorative shapes echoing the logo's round form. Purely visual. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-gold/20" />
            <div className="absolute -bottom-10 left-24 h-40 w-40 rounded-full bg-gold/15" />
            <div className="absolute -right-16 top-24 h-44 w-44 rounded-full bg-gold/10" />
          </div>
        </aside>

        {/* Sign-in panel */}
        <section className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Plugr" className="h-7 w-auto" />
            <span className="rounded-pill bg-pitch-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-bone">
              Admin
            </span>
          </div>

          <div className="mb-7 flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-2xl text-pitch-black">
                {step === 'phone' ? 'Sign in to your account' : 'Check WhatsApp for your code'}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate">
                {step === 'phone'
                  ? 'Enter the phone number linked to your admin account. We’ll send you a one-time code on WhatsApp.'
                  : 'Enter the 6-digit code to finish signing in.'}
              </p>
            </div>
          </div>

          {step === 'phone' ? (
            <form onSubmit={requestCode} className="space-y-4" noValidate>
              <div>
                <label htmlFor="admin-phone" className="mb-2 block text-sm font-semibold text-pitch-black">
                  Phone number
                </label>
                <input
                  id="admin-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  placeholder="+234 801 234 5678"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'admin-phone-error' : undefined}
                  className={cn(
                    'w-full rounded-2xl border bg-white px-4 py-3.5 text-pitch-black placeholder:text-slate/50 transition-shadow focus:outline-none focus:ring-4',
                    error
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-pitch-black/10 focus:border-gold focus:ring-gold/10'
                  )}
                />
                {error && (
                  <p id="admin-phone-error" role="alert" className="mt-2 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>
              <PrimaryButton type="submit" loading={busy}>
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending code…</>) : 'Send code'}
              </PrimaryButton>
            </form>
          ) : (
            <div className="space-y-4">
              {notice && <p className="text-sm leading-relaxed text-slate">{notice}</p>}
              <div className={cn('flex gap-2', error && 'otp-shake')}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => onDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={LENGTH}
                    readOnly={busy}
                    aria-label={`Digit ${i + 1} of ${LENGTH}`}
                    className={cn(
                      'h-14 min-w-0 flex-1 rounded-2xl border bg-white text-center font-display text-2xl text-pitch-black tnum transition-shadow focus:outline-none focus:ring-4 focus:ring-gold/10',
                      error ? 'border-red-400' : d ? 'border-gold' : 'border-pitch-black/10 focus:border-gold'
                    )}
                  />
                ))}
              </div>

              <div aria-live="polite" className="min-h-[1.25rem]">
                {busy && (
                  <div className="flex items-center gap-2 text-sm text-slate">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" /> Checking code…
                  </div>
                )}
                {error && !busy && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={cooldown.active || resending || busy}
                  className="text-sm font-bold text-pitch-black underline underline-offset-4 transition-colors hover:text-gold disabled:cursor-not-allowed disabled:text-slate disabled:no-underline disabled:hover:text-slate"
                >
                  {cooldown.active
                    ? `Resend code in ${formatCooldown(cooldown.remaining)}`
                    : resending
                      ? 'Sending…'
                      : 'Resend code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setNotice(null);
                    cooldown.reset();
                  }}
                  className="text-sm font-bold text-pitch-black underline underline-offset-4 transition-colors hover:text-gold"
                >
                  Use a different number
                </button>
              </div>
            </div>
          )}

          <p className="mt-10 text-xs leading-relaxed text-slate/70">
            For authorised administrators only. All activity is logged.
          </p>
        </section>
      </div>
    </main>
  );
}