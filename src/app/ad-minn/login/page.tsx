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
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api, setToken, clearToken } from '@/src/lib/api';
import { cn } from '@/src/lib/utils';
import { Card, PrimaryButton } from '@/src/components/ui';
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
      setError('Enter a valid phone number (e.g., +2348000000001 or 08000000001).');
      return;
    }

    setBusy(true);
    try {
      await api.auth.requestOtp(formattedPhone);
      cooldown.start();
      setStep('otp');
      setNotice(`We sent a 6-digit code via WhatsApp to ${formattedPhone}.`);
      setDigits(Array(LENGTH).fill(''));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: any) {
      // Extracts backend exception message or falls back gracefully
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'Failed to send OTP code. Please verify server connection.';
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
      setNotice(`New code sent via WhatsApp to ${formattedPhone}.`);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data || err?.message || 'Could not resend the code.';
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
        setError('This number is not an admin account. Access denied.');
        setTimeout(() => inputs.current[0]?.focus(), 50);
        return;
      }

      setToken(accessToken);
      router.replace('/ad-minn');
    } catch (err: any) {
      setDigits(Array(LENGTH).fill(''));
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'Incorrect or expired OTP code.';
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
    <div className="flex min-h-screen items-center justify-center bg-bone p-6">
      <div className="w-full max-w-md rise">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Plugr" className="h-7 w-auto" />
          <span className="rounded-pill bg-pitch-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-bone">
            Admin
          </span>
        </div>

        <Card className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-gold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-xl text-pitch-black">Admin sign in</h1>
              <p className="text-sm text-slate">
                {step === 'phone' ? 'Verify your admin phone number' : 'Enter the code we sent you'}
              </p>
            </div>
          </div>

          {step === 'phone' ? (
            <form onSubmit={requestCode} className="space-y-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                Phone number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="+234 800 000 0001"
                className="w-full rounded-2xl border border-pitch-black/10 bg-white px-4 py-3.5 text-pitch-black placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow"
              />
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <PrimaryButton type="submit" loading={busy}>
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : 'Send code'}
              </PrimaryButton>
            </form>
          ) : (
            <div className="space-y-4">
              {notice && <p className="text-sm text-slate">{notice}</p>}
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
                    maxLength={LENGTH}
                    readOnly={busy}
                    aria-label={`Digit ${i + 1}`}
                    className={cn(
                      'h-14 flex-1 min-w-0 rounded-2xl border bg-white text-center font-display text-2xl text-pitch-black tnum transition-shadow focus:outline-none focus:ring-4 focus:ring-gold/10',
                      error ? 'border-red-400' : d ? 'border-gold' : 'border-pitch-black/10 focus:border-gold'
                    )}
                  />
                ))}
              </div>

              {busy && (
                <div className="flex items-center gap-2 text-sm text-slate">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" /> Verifying…
                </div>
              )}
              {error && !busy && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={cooldown.active || resending || busy}
                  className="text-sm font-bold text-pitch-black underline underline-offset-4 transition-colors hover:text-gold disabled:cursor-not-allowed disabled:text-slate disabled:no-underline disabled:hover:text-slate"
                >
                  {cooldown.active
                    ? `Resend in ${formatCooldown(cooldown.remaining)}`
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
        </Card>

        <p className="mt-6 text-center text-xs text-slate/70">Admin access only. All actions are logged.</p>
      </div>
    </div>
  );
}