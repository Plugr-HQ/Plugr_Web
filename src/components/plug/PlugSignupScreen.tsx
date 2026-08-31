// src/components/plug/PlugSignupScreen.tsx
// Plug signup — ONE page, ONE submit (Part A).
//
// Replaces the six-step wizard (name -> consent -> phone+OTP -> trade -> location -> photo, then
// a separate NIN + liveness screen before the account existed at all). Everything below is on a
// single screen and creates the account in one call:
//
//   name · WhatsApp number · password · confirm password · email (optional, inline OTP) ·
//   trade · location
//
// Deliberately NOT here: NIN and liveness. Identity verification moved to the profile-completion
// screen, reached from the popup on first landing. The account is real before verification —
// which is safe because eligibility is enforced on the server (Plugr_Backend plug-eligibility.ts):
// an unverified Plug is invisible to dispatch and refused on job acceptance.
//
// The email OTP expands INLINE under the field — no page break, no route change — so the one-page
// promise holds. It is skippable in every failure mode, including "no email provider configured"
// (the backend answers 503 and we say so plainly): an optional field must never block signup.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Zap, Droplet, Hammer, Check, Eye, EyeOff,
} from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Label, TextInput, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { LocationInput } from '@/src/components/LocationInput';
import { setToken } from '@/src/lib/api';
import {
  savePlugDraft, setPlugId, setPlugOnboarded, setPlugPhone, type PlugTrade,
} from '@/src/app/app/_lib/plugAuth';

const TRADES: { value: PlugTrade; label: string; icon: React.ReactNode }[] = [
  { value: 'electrician', label: 'Electrician', icon: <Zap className="h-5 w-5" /> },
  { value: 'plumber', label: 'Plumber', icon: <Droplet className="h-5 w-5" /> },
  { value: 'furniture', label: 'Furniture', icon: <Hammer className="h-5 w-5" /> },
];

const MIN_PASSWORD = 8; // must match the backend's @MinLength(8) on RegisterDto

/** Display format: 0XX XXXX XXX. Stored as national digits, sent as +234…. */
function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 10)].filter(Boolean).join(' ');
}


export function PlugSignupScreen({ base }: { base: string }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [digits, setDigits] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState<PlugTrade | ''>('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [emailNote, setEmailNote] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordLongEnough = password.length >= MIN_PASSWORD;
  const passwordsMatch = password.length > 0 && password === confirm;

  const canSubmit =
    firstName.trim().length > 1 &&
    lastName.trim().length > 1 &&
    digits.length === 10 &&
    passwordLongEnough &&
    passwordsMatch &&
    !!trade &&
    latitude !== null &&
    longitude !== null &&
    // Email is optional (marketing only). Blank is fine; a half-typed address is not, so the only
    // rule is "if you typed something, it has to look like an address". No verification gate:
    // requiring one made a blank email block signup entirely, and an unconfigured mail provider
    // locked out every applicant.
    (email.trim() === '' || emailValid);

  function onPhoneChange(v: string) {
    setError(null);
    let d = v.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.slice(1); // so +234 0801… can't happen
    setDigits(d.slice(0, 10));
  }

  /* --------------------------------------------------------------- submit */

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);

    const phone = `+234${digits}`;

    try {
      const res = await fetch('/api/plugs/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          password,
          email: email.trim() || undefined,
          trade,
          address,
          latitude,
          longitude,
        }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(body?.error || 'Could not create your account.');

      // Session — same storage the rest of the Plug app reads.
      if (body.accessToken) setToken(body.accessToken);
      if (body.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem('plugr_refresh_token', body.refreshToken);
      }
      if (body.plug?.id) setPlugId(body.plug.id);
      setPlugPhone(phone);
      setPlugOnboarded(true);

      // Keep what the verification screen will need, so the Plug doesn't retype it there.
      savePlugDraft({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
        trade: trade as PlugTrade,
        address,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });

      // Into the real app. The dashboard raises the "complete your profile" popup from here.
      router.replace(`${base}/plug`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create your account. Try again.');
      setBusy(false);
    }
  }

  return (
    <Shell
      eyebrow="Become a Plug"
      title="Create your account"
      subtitle="One page. You'll be in the app in under a minute."
      back={base}
      footer={
        <GoldButton onClick={submit} disabled={!canSubmit} loading={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </GoldButton>
      }
    >
      <div className="space-y-6">
        {/* ---------------------------------------------------------------- name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-2">First name</Label>
            <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Suleiman" autoFocus />
          </div>
          <div>
            <Label className="mb-2">Last name</Label>
            <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Yusuf" />
          </div>
        </div>

        {/* --------------------------------------------------------------- phone */}
        <div>
          <Label className="mb-2">WhatsApp number</Label>
          <div className="flex items-stretch overflow-hidden rounded-2xl border border-midnight/10 bg-white transition-colors focus-within:border-gold">
            <span className="grid place-items-center border-r border-midnight/10 bg-bone/60 px-4 text-sm font-bold text-slate">
              +234
            </span>
            <input
              value={formatPhone(digits)}
              onChange={(e) => onPhoneChange(e.target.value)}
              inputMode="tel"
              placeholder="801 2345 678"
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-midnight outline-none placeholder:text-slate/40"
            />
          </div>
          <p className="mt-2 text-xs text-slate/70">Jobs and updates reach you here.</p>
        </div>

        {/* ------------------------------------------------------------ password */}
        <div>
          <Label className="mb-2">Password</Label>
          <div className="flex items-stretch overflow-hidden rounded-2xl border border-midnight/10 bg-white transition-colors focus-within:border-gold">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-midnight outline-none placeholder:text-slate/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="grid place-items-center px-4 text-slate transition-colors hover:text-midnight"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && !passwordLongEnough && (
            <p className="mt-2 text-xs text-slate">Use at least {MIN_PASSWORD} characters.</p>
          )}
        </div>

        <div>
          <Label className="mb-2">Confirm password</Label>
          <TextInput
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
            className={cn(confirm.length > 0 && !passwordsMatch && 'border-red-400')}
          />
          {confirm.length > 0 && !passwordsMatch && (
            <p className="mt-2 text-xs text-red-600">Passwords don&rsquo;t match.</p>
          )}
        </div>

        {/* ------------------------------------------------------------- email */}
        {/* Optional, and collected for marketing only. No verify button, no OTP, and no
            "unverified" state shown to the Plug — nothing downstream treats a verified address
            differently, so asking them to prove it was friction with no payoff. */}
        <div>
          <Label className="mb-2">Email</Label>
          <TextInput
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailNote(null);
            }}
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          {email.trim() !== '' && !emailValid ? (
            <p className="mt-2 text-xs text-red-600">That does not look like a valid email address.</p>
          ) : (
            <p className="mt-2 text-xs text-slate/70">Optional — for receipts and updates.</p>
          )}
        </div>

        {/* --------------------------------------------------------------- trade */}
        <div>
          <Label className="mb-2">What do you do?</Label>
          <div className="grid grid-cols-3 gap-2">
            {TRADES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTrade(t.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all',
                  trade === t.value
                    ? 'border-gold bg-white shadow-[0_8px_20px_-14px_rgba(15,31,61,0.5)]'
                    : 'border-midnight/[0.08] bg-white/60 hover:border-midnight/20'
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl',
                    trade === t.value ? 'bg-midnight text-gold' : 'bg-midnight/[0.06] text-slate'
                  )}
                >
                  {t.icon}
                </span>
                <span className={cn('text-[12px] font-bold', trade === t.value ? 'text-midnight' : 'text-slate')}>
                  {t.label}
                </span>
                {trade === t.value && <Check className="h-3.5 w-3.5 text-gold" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------ location */}
        <div>
          <Label className="mb-2">Where are you based?</Label>
          <LocationInput
            onLocationSelect={({ latitude: lat, longitude: lng, address: addr }) => {
              setLatitude(lat);
              setLongitude(lng);
              setAddress(addr);
            }}
          />
          {latitude !== null && longitude !== null && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={3} /> Location set
            </p>
          )}
          <p className="mt-2 text-xs text-slate/70">We use this to send you jobs nearby.</p>
        </div>
      </div>

      {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-xs leading-relaxed text-slate/70">
        You&rsquo;ll verify your identity (NIN) from your profile before you can receive jobs. By
        continuing you agree to our{' '}
        <Link href="/terms" className="font-semibold text-gold hover:underline">Terms</Link> and{' '}
        <Link href="/privacy" className="font-semibold text-gold hover:underline">Privacy Policy</Link>.
      </p>

      <p className="mt-4 text-center text-sm text-slate/70">
        Already have an account?{' '}
        <Link href={`${base}/auth/login`} className="font-semibold text-gold hover:underline">Log in</Link>
      </p>
    </Shell>
  );
}
