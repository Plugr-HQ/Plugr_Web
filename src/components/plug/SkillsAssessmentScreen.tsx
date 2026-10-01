// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment. Two ways to do it, both ending in pending review:
//
//   1. Request an assessment call: the Plug proposes a preferred date and time (Lagos time / WAT).
//      Ops confirm that slot on WhatsApp (or agree another) and call the Plug to run through trade questions.
//   2. Send a WhatsApp voice note answering the ops lead's questions.
//
// Committing to either moves the item to pending review straight away. The item tracks that the Plug
// acted, not that the call has happened — ops decide pass or fail afterwards.
//
// CONFIG: NEXT_PUBLIC_SKILLS_WHATSAPP, the number voice notes go to. Unset renders the voice-note
// option as "coming soon" rather than a dead link.

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  Mic,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';
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

/** Formats an ISO UTC timestamp into Lagos time (WAT / UTC+1). */
function formatLagosTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  try {
    const formatted = new Intl.DateTimeFormat('en-NG', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${formatted} (WAT)`;
  } catch {
    return `${date.toLocaleString('en-NG')} (WAT)`;
  }
}

/** Formats a Date object to YYYY-MM-DDTHH:mm for datetime-local input. */
function toLocalDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function SkillsAssessmentScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [path, setPath] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [meetingTime, setMeetingTime] = useState<string | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeInputError, setTimeInputError] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  // Default suggested time: tomorrow at 10:00 AM
  const defaultSuggestedTime = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return toLocalDateTimeInput(d);
  }, []);

  const [timeInput, setTimeInput] = useState<string>(defaultSuggestedTime);

  // Min selectable: 1 hour from now
  const minTimeInput = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return toLocalDateTimeInput(d);
  }, []);

  // Max selectable: 30 days from now
  const maxTimeInput = useMemo(() => {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return toLocalDateTimeInput(d);
  }, []);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.skills.state ?? 'not_started');
    setPath(snap.items?.skills.path ?? null);
    setMeetingTime(snap.items?.skills.meetingTime ?? null);
    setConfirmedTime(snap.items?.skills.confirmedTime ?? null);
    setReviewNote(snap.items?.skills.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Record the choice with optional meeting time. */
  async function choose(
    which: 'CALL' | 'VOICE_NOTE',
    options?: { meetingTime?: string },
    handOff: () => void = () => {},
  ) {
    if (busy) return;
    setBusy(which);
    setError(null);
    setTimeInputError(null);

    try {
      const payload: { path: 'CALL' | 'VOICE_NOTE'; meetingTime?: string } = { path: which };
      if (which === 'CALL' && options?.meetingTime) {
        payload.meetingTime = options.meetingTime;
      }

      await apiFetch(
        START_URL,
        { method: 'POST', body: JSON.stringify(payload) },
        { redirectTo: '/app/auth/login' },
      );
      handOff();
      setResubmitting(false);
      await load();
    } catch (e: any) {
      const rawMsg = e?.message ?? e?.error;
      const msg = Array.isArray(rawMsg)
        ? rawMsg.join('; ')
        : typeof rawMsg === 'string'
          ? rawMsg
          : 'We couldn’t schedule your assessment. Please try again.';
      setError(msg);
    } finally {
      setBusy(null);
    }
  }

  function handleRequestCall() {
    if (!timeInput) {
      setTimeInputError('Please select a date and time for your call.');
      return;
    }

    const picked = new Date(timeInput);
    if (isNaN(picked.getTime())) {
      setTimeInputError('That date and time doesn’t look right.');
      return;
    }

    const now = Date.now();
    const diffMs = picked.getTime() - now;
    if (diffMs < 30 * 60 * 1000) {
      setTimeInputError('Please pick a time at least 1 hour from now.');
      return;
    }
    if (diffMs > 30 * 24 * 60 * 60 * 1000) {
      setTimeInputError('Please pick a time within the next 30 days.');
      return;
    }

    setTimeInputError(null);
    // Convert to UTC ISO string with timezone offset
    const isoString = picked.toISOString();
    choose('CALL', { meetingTime: isoString });
  }

  const waHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(VOICE_NOTE_PROMPT)}`
    : '';

  const isPending = state === 'pending_review' && !resubmitting;

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
      ) : isPending ? (
        <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center shadow-xs">
          {path === 'CALL' && confirmedTime ? (
            <>
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <p className="font-bold text-pitch-black text-lg">Assessment call confirmed</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-pill bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-800">
                <Calendar className="h-3.5 w-3.5" />
                {formatLagosTime(confirmedTime)}
              </div>
              <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-slate">
                Confirmed with our team. Please keep your phone close — someone from ops will ring your Plugr number at this time to run through a few questions about your trade.
              </p>
            </>
          ) : path === 'CALL' && meetingTime ? (
            <>
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                <Clock className="h-7 w-7" />
              </span>
              <p className="font-bold text-pitch-black text-lg">Call requested</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-pill bg-gold/10 border border-gold/30 px-4 py-1.5 text-xs font-bold text-[#8a5a08]">
                <Calendar className="h-3.5 w-3.5" />
                Preferred: {formatLagosTime(meetingTime)}
              </div>
              <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-slate">
                We received your preferred time. Our team will confirm this slot with you on WhatsApp (or agree another time), then ring your Plugr number.
              </p>
            </>
          ) : path === 'CALL' ? (
            <>
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                <Hourglass className="h-7 w-7" />
              </span>
              <p className="font-bold text-pitch-black text-lg">We’ll call you</p>
              <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-slate">
                Someone from our team will ring you on your Plugr number to agree a time, then run through a few questions about your trade. We’ll update this once it’s done.
              </p>
            </>
          ) : (
            <>
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                <Hourglass className="h-7 w-7" />
              </span>
              <p className="font-bold text-pitch-black text-lg">Waiting on your voice note</p>
              <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-slate">
                Send your voice note on WhatsApp whenever you’re ready. Our team reviews it and updates this item — this can take a few days.
              </p>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 rounded-pill border border-pitch-black/15 bg-white px-5 py-2.5 text-[13px] font-bold text-pitch-black hover:border-gold hover:bg-gold/5 transition-colors"
                >
                  Open WhatsApp again
                </a>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-pitch-black/[0.06] w-full flex justify-center">
            <button
              onClick={() => setResubmitting(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate hover:text-pitch-black transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Change time or method
            </button>
          </div>
        </div>
      ) : state === 'verified' ? (
        <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="font-bold text-pitch-black text-lg">Skills assessment passed</p>
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

          <div className="rise rise-1 mt-4 space-y-4">
            {/* Option 1: Call with time proposal */}
            <div className="rounded-[18px] border border-pitch-black/[0.08] bg-white p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
                  <PhoneCall className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-pitch-black">Request assessment call</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate">
                    Choose a preferred time for a 15-minute call. Ops will confirm this on WhatsApp and then call you.
                  </p>

                  <div className="mt-4 rounded-2xl bg-bone p-3.5 border border-pitch-black/[0.06]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="meeting-time" className="text-xs font-bold text-pitch-black">
                        Preferred Date & Time
                      </label>
                      <span className="text-[11px] font-semibold text-[#8a5a08] bg-gold/15 px-2 py-0.5 rounded-full">
                        Lagos time (WAT)
                      </span>
                    </div>

                    <input
                      id="meeting-time"
                      type="datetime-local"
                      value={timeInput}
                      min={minTimeInput}
                      max={maxTimeInput}
                      onChange={(e) => {
                        setTimeInput(e.target.value);
                        if (timeInputError) setTimeInputError(null);
                      }}
                      className={cn(
                        'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-pitch-black outline-none transition-colors focus:border-gold',
                        timeInputError ? 'border-red-400' : 'border-pitch-black/15',
                      )}
                    />

                    {timeInputError && (
                      <p className="mt-2 text-xs font-semibold text-red-600">{timeInputError}</p>
                    )}
                  </div>

                  <button
                    onClick={handleRequestCall}
                    disabled={busy !== null}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-gold px-5 py-2.5 text-[13px] font-bold text-pitch-black transition-all hover:bg-gold-light active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === 'CALL' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Request assessment call
                  </button>
                </div>
              </div>
            </div>

            {/* Option 2: Voice Note */}
            <div
              className={cn(
                'rounded-[18px] border border-pitch-black/[0.08] bg-white p-5 shadow-xs',
                !WHATSAPP_NUMBER && 'opacity-70',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
                  <Mic className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-pitch-black">Record your answers instead</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate">
                    {WHATSAPP_NUMBER
                      ? 'Send a WhatsApp voice note answering our questions. Do it whenever you have a quiet minute.'
                      : 'This opens on WhatsApp — we’re switching the number on shortly.'}
                  </p>

                  <button
                    onClick={() =>
                      choose('VOICE_NOTE', undefined, () =>
                        window.open(waHref, '_blank', 'noopener,noreferrer'),
                      )
                    }
                    disabled={!WHATSAPP_NUMBER || busy !== null}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-pitch-black px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-petrol active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-pitch-black/[0.06] disabled:text-slate"
                  >
                    {busy === 'VOICE_NOTE' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {!WHATSAPP_NUMBER ? 'Coming soon' : 'Open WhatsApp'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {resubmitting && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setResubmitting(false)}
                className="text-xs font-semibold text-slate hover:text-pitch-black underline"
              >
                Cancel and keep existing request
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-[13px] font-medium text-red-700" role="alert">
              {error}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
