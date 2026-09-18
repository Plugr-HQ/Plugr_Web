// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment. Two ways to do it, both ending in pending review:
//
//   1. Request an assessment call. There is no booking tool: the tap messages the ops team on
//      WhatsApp (backend, OPS_TEAM_WHATSAPP_NUMBERS) and whoever picks it up rings the Plug to agree
//      a time by hand.
//   2. Send a WhatsApp voice note answering the ops lead's questions.
//
// Committing to either moves the item to pending review straight away. The item tracks that the Plug
// acted, not that the call has happened — ops decide pass or fail afterwards.
//
// CONFIG: NEXT_PUBLIC_SKILLS_WHATSAPP, the number voice notes go to. Unset renders the voice-note
// option as "coming soon" rather than a dead link. The call request needs no web config.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Hourglass, Loader2, Mic, PhoneCall } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import type { ItemState } from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const START_URL = '/api/plug/verification/skills';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SKILLS_WHATSAPP ?? '';

const VOICE_NOTE_PROMPT =
  'Hi — I’d like to do my Plugr skills assessment by voice note. Please send me the questions.';

export function SkillsAssessmentScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [path, setPath] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.skills.state ?? 'not_started');
    setPath(snap.items?.skills.path ?? null);
    setReviewNote(snap.items?.skills.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Record the choice first, then hand off — so a Plug who never comes back still shows as started. */
  async function choose(which: 'CALL' | 'VOICE_NOTE', handOff: () => void = () => {}) {
    if (busy) return;
    setBusy(which);
    setError(null);
    try {
      await apiFetch(START_URL, { method: 'POST', body: JSON.stringify({ path: which }) }, { redirectTo: '/app/auth/login' });
      handOff();
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t start your assessment. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const waHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(VOICE_NOTE_PROMPT)}`
    : '';

  return (
    <Shell
      eyebrow="Verification"
      title="Skills assessment"
      subtitle="A short check of your trade."
      back={HUB}
    >
      {state === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : state === 'pending_review' ? (
        <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
            <Hourglass className="h-6 w-6" />
          </span>
          <p className="font-bold text-pitch-black">
            {path === 'CALL' ? 'We’ll call you' : 'Waiting on your voice note'}
          </p>
          <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-slate">
            {path === 'CALL'
              ? 'Someone from our team will ring you on your Plugr number to agree a time, then run through a few questions about your trade. We’ll update this once it’s done.'
              : 'Send your voice note on WhatsApp whenever you’re ready. Our team reviews it and updates this item — this can take a few days.'}
          </p>
          {path === 'VOICE_NOTE' && waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 rounded-pill border border-pitch-black/15 bg-white px-4 py-2 text-[13px] font-bold text-pitch-black hover:border-gold"
            >
              Open WhatsApp again
            </a>
          )}
        </div>
      ) : state === 'verified' ? (
        <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="font-bold text-pitch-black">Skills assessment passed</p>
          <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-slate">
            Our team confirmed your trade knowledge. Nothing else to do here.
          </p>
        </div>
      ) : (
        <>
          {reviewNote && (
            <div className="rise rounded-[18px] border border-gold/50 bg-gold/[0.07] p-4" role="alert">
              <p className="text-sm font-bold text-pitch-black">Let’s try that again</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">{reviewNote}</p>
            </div>
          )}

          <p className="rise mt-4 text-[13px] leading-relaxed text-slate">
            A few practical questions about your trade — the kind of thing you’d answer on a job. Pick whichever suits
            you; both count the same.
          </p>

          <div className="rise rise-1 mt-4 space-y-3">
            <Option
              icon={<PhoneCall className="h-5 w-5" />}
              title="Request assessment call"
              body="Our team will ring you to agree a time that suits you. The call itself takes about 15 minutes."
              cta="Request assessment call"
              loading={busy === 'CALL'}
              onClick={() => choose('CALL')}
            />

            <Option
              icon={<Mic className="h-5 w-5" />}
              title="Record your answers instead"
              body={
                WHATSAPP_NUMBER
                  ? 'Send a WhatsApp voice note answering our questions. Do it whenever you have a quiet minute.'
                  : 'This opens on WhatsApp — we’re switching the number on shortly.'
              }
              cta="Open WhatsApp"
              disabled={!WHATSAPP_NUMBER}
              loading={busy === 'VOICE_NOTE'}
              onClick={() => choose('VOICE_NOTE', () => window.open(waHref, '_blank', 'noopener,noreferrer'))}
            />
          </div>

          {error && (
            <p className="mt-4 text-[13px] font-bold text-red-600" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

function Option({
  icon,
  title,
  body,
  cta,
  disabled,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={cn('rounded-[18px] border border-pitch-black/[0.08] bg-white p-4', disabled && 'opacity-70')}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-pitch-black">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">{body}</p>
          <button
            onClick={onClick}
            disabled={disabled || loading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-gold px-4 py-2 text-[13px] font-bold text-pitch-black transition-all hover:bg-gold-light active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-pitch-black/[0.06] disabled:text-slate"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {disabled ? 'Coming soon' : cta}
          </button>
        </div>
      </div>
    </div>
  );
}
