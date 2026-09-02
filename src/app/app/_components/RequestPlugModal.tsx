// src/app/app/_components/RequestPlugModal.tsx
// The gate that stands where the WhatsApp hand-off used to be.
//
// Client-side booking is not live for the Sept 1 launch (Plug-facing only), and the bot cannot yet
// handle a request that arrives this way. Sending someone to WhatsApp with a pre-filled "I'd like
// to request X" would put them in a conversation nothing answers — worst of all for someone with
// an emergency, who would sit waiting on a reply that is not coming.
//
// So the click stops here. It says plainly that booking is not open yet, and offers to take a
// contact detail instead — email or phone, whichever they are comfortable giving.
//
// Used by RequestPlugButton, which is the single entry point on browse, the in-app profile and the
// public Digital ID — so all three are gated by this one component, not three copies of it.

'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestPlugModal({
  plugId,
  plugName,
  onClose,
}: {
  plugId: string;
  plugName?: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Esc closes, and focus starts in the form rather than wherever the page happened to be.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    firstFieldRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const emailTouched = email.trim() !== '';
  const phoneTouched = phone.trim() !== '';
  const emailLooksValid = !emailTouched || EMAIL_RE.test(email.trim());
  // Either field alone is enough — the point is to let them choose. Both blank is not.
  const canSubmit = (emailTouched || phoneTouched) && emailLooksValid && !saving;

  const who = plugName?.trim() || 'This Plug';

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/plugs/${encodeURIComponent(plugId)}/request-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Could not save that just now.');
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save that just now.');
    } finally {
      setSaving(false);
    }
  }

  const field =
    'w-full rounded-2xl border border-pitch-black/10 bg-white px-4 py-3 text-sm text-pitch-black ' +
    'placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pitch-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Booking ${who} is not open yet`}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-bone p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl leading-snug text-pitch-black">
            {done ? 'Got it, we’ll let you know' : 'Booking opens soon'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-slate transition-colors hover:bg-pitch-black/[0.06] hover:text-pitch-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              We’ll reach out as soon as you can book {who} directly on Plugr.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-pill bg-pitch-black py-3.5 text-sm font-bold text-white transition-colors hover:bg-petrol"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              <span className="font-semibold text-pitch-black">{who}</span> is verified and ready.
              Direct booking opens soon — check back shortly.
            </p>

            <p className="mt-5 text-[13px] font-semibold text-pitch-black">
              Want to know the moment it opens?
            </p>

            <div className="mt-3 space-y-3">
              <input
                ref={firstFieldRef}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email address"
                aria-label="Email address"
                className={cn(field, !emailLooksValid && 'border-red-400')}
              />
              <input
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(null); }}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Phone number"
                aria-label="Phone number"
                className={field}
              />
            </div>

            {!emailLooksValid ? (
              <p className="mt-2 text-xs text-red-600">That doesn’t look like a valid email address.</p>
            ) : error ? (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            ) : (
              <p className="mt-2 text-xs text-slate/70">Either one is enough — whichever you prefer.</p>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-pill bg-gold py-3.5 text-sm font-bold text-pitch-black transition-all hover:bg-gold-light active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Notify me'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
