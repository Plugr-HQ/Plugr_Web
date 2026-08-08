// src/app/app/auth/login/page.tsx
// Returning-user login. Phone-only, hits the real backend (POST /auth/login) — no OTP yet,
// that lands separately once the WhatsApp send/verify loop is wired in. A phone with no
// account gets sent into the signup path instead of a dead-end error.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Label, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { api, setToken } from '@/src/lib/api';

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
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  const complete = digits.length === 10;

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
      const { accessToken, refreshToken, user } = await api.auth.login(phone);
      setToken(accessToken);
      if (typeof window !== 'undefined' && refreshToken) {
        localStorage.setItem('plugr_refresh_token', refreshToken);
      }
      router.replace(destinationFor(user.role));
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

  return (
    <Shell
      eyebrow="Welcome back"
      title="Log in to Plugr"
      subtitle="Enter the number your account is registered with."
      back="/app"
      footer={
        <GoldButton onClick={login} disabled={!complete} loading={busy}>
          {busy ? 'Signing in…' : 'Log In'}
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
          <span aria-hidden className="text-base leading-none">🇳🇬</span>
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
    </Shell>
  );
}
