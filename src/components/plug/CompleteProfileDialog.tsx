// src/components/plug/CompleteProfileDialog.tsx
// "Complete your profile to start receiving jobs" — shown once a Plug lands in the real app
// after the new single-page signup (Part A).
//
// Signup no longer collects NIN, so a brand-new Plug has a working account, a dashboard, and a
// profile, but cannot be dispatched to anyone. This is what tells them so, and points at where
// verification actually happens (/onboarding/verify).
//
// IMPORTANT — this is a NUDGE, not a gate. It can be dismissed, and dismissing it is fine: the
// real enforcement is server-side (Plugr_Backend: plug-eligibility.ts), where an unverified Plug
// is excluded from dispatch and refused on job acceptance regardless of anything the UI shows.
// Never treat this dialog as the thing that stops unverified work.
//
// STRUCTURE FOR LIVENESS: the body is a step LIST, not a single NIN paragraph. Liveness is
// already listed as the second step with `pending` styling and no link of its own, because it
// happens on the same /onboarding/verify screen right after the NIN step. When the liveness SDK
// is wired, that step gets its own state here and nothing else in this component changes.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, ScanFace, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const DISMISS_KEY = 'plugr_profile_prompt_dismissed';

/** One outstanding item on the way to taking jobs. */
type Step = {
  key: string;
  icon: React.ReactNode;
  label: string;
  body: string;
  /** 'now' = the step they can do this second. 'next' = follows immediately after, same screen. */
  state: 'now' | 'next';
};

const STEPS: Step[] = [
  {
    key: 'nin',
    icon: <ShieldCheck className="h-4 w-4" />,
    label: 'Verify your NIN',
    body: 'Checked against the national register. Never shown on your profile.',
    state: 'now',
  },
  {
    key: 'liveness',
    icon: <ScanFace className="h-4 w-4" />,
    label: 'Face scan',
    body: 'A quick liveness check, right after your NIN — same screen.',
    state: 'next',
  },
];

export function CompleteProfileDialog({ base, onClose }: { base: string; onClose?: () => void }) {
  const [open, setOpen] = useState(true);

  // Close on Escape — a modal that can only be dismissed by hitting a small × is a trap on
  // desktop, and this is a nudge, not something to corner anyone with.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      // Per-device, and only for this session's nagging — the dashboard still shows a persistent
      // card, so dismissing here doesn't hide the fact that they're unverified.
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — fine, they'll just see it again next visit */
    }
    onClose?.();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/40 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-t-[28px] bg-bone p-6 pb-8 shadow-xl sm:rounded-[28px]"
        // Clicks inside must not fall through to the backdrop's dismiss.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold text-midnight">
            <BadgeCheck className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-full text-slate transition-colors hover:bg-midnight/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="complete-profile-title" className="mt-4 font-display text-2xl leading-tight text-midnight">
          Complete your profile to start receiving jobs
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate">
          You&rsquo;re in — your account is live. Before Plugr can send you work, we need to confirm
          who you are. It takes about two minutes.
        </p>

        <ul className="mt-5 space-y-2">
          {STEPS.map((step) => (
            <li
              key={step.key}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-3.5',
                step.state === 'now'
                  ? 'border-gold/40 bg-white'
                  : 'border-midnight/[0.06] bg-white/50'
              )}
            >
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-xl',
                  step.state === 'now' ? 'bg-midnight text-gold' : 'bg-midnight/[0.06] text-slate'
                )}
              >
                {step.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-bold',
                    step.state === 'now' ? 'text-midnight' : 'text-slate'
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-slate">{step.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href={`${base}/onboarding/verify`}
          onClick={dismiss}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill bg-gold px-6 py-4 font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.98]"
        >
          Verify my identity
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          onClick={dismiss}
          className="mt-3 w-full py-2 text-sm font-semibold text-slate transition-colors hover:text-midnight"
        >
          I&rsquo;ll do this later
        </button>
      </div>
    </div>
  );
}

/** Whether the nudge was already dismissed this session. */
export function profilePromptDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}
