// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment.
//
// Artisans choose between:
//   1. Request an assessment call: they set their available time slot within the daily windows:
//      - Afternoon: 2:00 PM – 3:00 PM
//      - Evening: 5:30 PM – 9:00 PM
//      The chosen time is stored under their account on the backend.
//   2. Send a WhatsApp voice note answering trade questions.

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hourglass,
  Loader2,
  Mic,
  PhoneCall,
  RefreshCw,
  Sun,
  Moon,
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

// Defined call availability windows (every day)
const TIME_WINDOWS = [
  {
    id: 'afternoon',
    title: 'Afternoon Window',
    range: '2:00 PM – 3:00 PM',
    icon: Sun,
    slots: [
      { label: '2:00 PM', value: '14:00' },
      { label: '2:30 PM', value: '14:30' },
    ],
  },
  {
    id: 'evening',
    title: 'Evening Window',
    range: '5:30 PM – 9:00 PM',
    icon: Moon,
    slots: [
      { label: '5:30 PM', value: '17:30' },
      { label: '6:00 PM', value: '18:00' },
      { label: '6:30 PM', value: '18:30' },
      { label: '7:00 PM', value: '19:00' },
      { label: '7:30 PM', value: '19:30' },
      { label: '8:00 PM', value: '20:00' },
      { label: '8:30 PM', value: '20:30' },
    ],
  },
];

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

/** Formats a Date to YYYY-MM-DD in Lagos time */
function toLagosDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Converts a Lagos date ('YYYY-MM-DD') and slot ('HH:mm') into a UTC ISO string. */
function lagosSlotToUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // Lagos is UTC+1 (WAT) all year round, so UTC hour = Lagos hour - 1
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0, 0));
  return utcDate.toISOString();
}

export function SkillsAssessmentScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [path, setPath] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [meetingTime, setMeetingTime] = useState<string | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  // Call slot selection state
  const [activeMethod, setActiveMethod] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:00');
  const [slotError, setSlotError] = useState<string | null>(null);

  // Generate the next 7 days in Lagos
  const availableDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = toLagosDateString(d);
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else {
        label = d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
      }
      days.push({ dateStr, label, date: d });
    }
    return days;
  }, []);

  // Initialize selected date to tomorrow (or today if slots available)
  useEffect(() => {
    if (availableDays.length > 1 && !selectedDateStr) {
      setSelectedDateStr(availableDays[1].dateStr); // Default: Tomorrow
    }
  }, [availableDays, selectedDateStr]);

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

  /** Record the choice with selected meeting time. */
  async function choose(
    which: 'CALL' | 'VOICE_NOTE',
    options?: { meetingTime?: string },
    handOff: () => void = () => {},
  ) {
    if (busy) return;
    setBusy(which);
    setError(null);
    setSlotError(null);

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
      setActiveMethod(null);
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

  function handleConfirmCallSlot() {
    if (!selectedDateStr || !selectedTimeSlot) {
      setSlotError('Please select both a date and an available time slot.');
      return;
    }

    const isoUtcString = lagosSlotToUtcIso(selectedDateStr, selectedTimeSlot);
    const targetDate = new Date(isoUtcString);
    const now = Date.now();

    if (targetDate.getTime() - now < 30 * 60 * 1000) {
      setSlotError('Please pick a time slot at least 1 hour from now.');
      return;
    }

    setSlotError(null);
    choose('CALL', { meetingTime: isoUtcString });
  }

  const waHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(VOICE_NOTE_PROMPT)}`
    : '';

  const isPending = state === 'pending_review' && !resubmitting;

  return (
    <Shell
      eyebrow="Verification"
      title="Skills assessment"
      subtitle="A short check of your trade knowledge."
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
                Your availability: {formatLagosTime(meetingTime)}
              </div>
              <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-slate">
                We stored your selected available time. Our team will confirm this slot with you on WhatsApp (or agree another time), then ring your Plugr number.
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
            A quick 15-minute conversation about your trade with our technical ops team. Choose your preferred method below:
          </p>

          <div className="rise rise-1 mt-5 space-y-4">
            {/* Option 1: Assessment Call with Time Slots */}
            <div className="rounded-[20px] border border-pitch-black/[0.08] bg-white p-5 shadow-xs transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
                    <PhoneCall className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-pitch-black">Request assessment call</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate">
                      Set a time you’re available for a 15-minute phone call.
                    </p>
                  </div>
                </div>

                {activeMethod !== 'CALL' && (
                  <button
                    onClick={() => setActiveMethod('CALL')}
                    className="shrink-0 rounded-pill bg-gold px-4 py-2 text-xs font-bold text-pitch-black hover:bg-gold-light active:scale-95 transition-all"
                  >
                    Set time
                  </button>
                )}
              </div>

              {/* Step 2: Time Selection Interface */}
              {activeMethod === 'CALL' && (
                <div className="mt-5 border-t border-pitch-black/[0.06] pt-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate">1. Choose Day</span>
                    <span className="text-[11px] font-semibold text-[#8a5a08] bg-gold/15 px-2.5 py-0.5 rounded-full">
                      Lagos time (WAT)
                    </span>
                  </div>

                  {/* Day Picker Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
                    {availableDays.map((d) => {
                      const isSelected = selectedDateStr === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDateStr(d.dateStr);
                            setSlotError(null);
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all',
                            isSelected
                              ? 'border-gold bg-gold text-pitch-black shadow-xs'
                              : 'border-pitch-black/10 bg-bone hover:border-gold/50 text-slate hover:text-pitch-black',
                          )}
                        >
                          <span>{d.label}</span>
                          <span className="text-[10px] font-normal opacity-80 mt-0.5">
                            {d.date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate">
                      2. Select Available Window (2-3pm or 5:30-9pm)
                    </span>
                  </div>

                  {/* Windows & Specific Slots */}
                  <div className="space-y-3 mb-5">
                    {TIME_WINDOWS.map((window) => {
                      const Icon = window.icon;
                      return (
                        <div
                          key={window.id}
                          className="rounded-xl border border-pitch-black/[0.07] bg-bone/70 p-3.5"
                        >
                          <div className="flex items-center gap-2 mb-2.5">
                            <Icon className="h-4 w-4 text-gold" />
                            <span className="text-xs font-bold text-pitch-black">{window.title}</span>
                            <span className="text-[11px] font-medium text-slate">({window.range})</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {window.slots.map((slot) => {
                              const isSelected = selectedTimeSlot === slot.value;
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimeSlot(slot.value);
                                    setSlotError(null);
                                  }}
                                  className={cn(
                                    'px-3.5 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5',
                                    isSelected
                                      ? 'border-pitch-black bg-pitch-black text-white shadow-xs'
                                      : 'border-pitch-black/10 bg-white text-pitch-black hover:border-gold',
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-gold" />}
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary & Submit Call Slot */}
                  {selectedDateStr && selectedTimeSlot && (
                    <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mb-4 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate font-medium">Selected Availability:</span>{' '}
                        <span className="font-bold text-pitch-black">
                          {availableDays.find((d) => d.dateStr === selectedDateStr)?.label ?? selectedDateStr} at{' '}
                          {TIME_WINDOWS.flatMap((w) => w.slots).find((s) => s.value === selectedTimeSlot)?.label} (WAT)
                        </span>
                      </div>
                    </div>
                  )}

                  {slotError && (
                    <p className="mb-3 text-xs font-semibold text-red-600">{slotError}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleConfirmCallSlot}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-pill bg-gold px-6 py-2.5 text-xs font-bold text-pitch-black hover:bg-gold-light active:scale-98 transition-all disabled:opacity-50"
                    >
                      {busy === 'CALL' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Confirm availability & request call
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMethod(null)}
                      className="text-xs font-bold text-slate hover:text-pitch-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Record Voice Note on WhatsApp */}
            <div
              className={cn(
                'rounded-[20px] border border-pitch-black/[0.08] bg-white p-5 shadow-xs transition-all',
                !WHATSAPP_NUMBER && 'opacity-70',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
                    <Mic className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-pitch-black">Record answers on WhatsApp</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate">
                      {WHATSAPP_NUMBER
                        ? 'Answer our trade questions via WhatsApp voice note at your convenience.'
                        : 'Opens on WhatsApp — number switching on shortly.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    choose('VOICE_NOTE', undefined, () =>
                      window.open(waHref, '_blank', 'noopener,noreferrer'),
                    )
                  }
                  disabled={!WHATSAPP_NUMBER || busy !== null}
                  className="shrink-0 rounded-pill bg-pitch-black px-4 py-2 text-xs font-bold text-white hover:bg-petrol active:scale-95 transition-all disabled:opacity-50"
                >
                  {busy === 'VOICE_NOTE' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Open WhatsApp'
                  )}
                </button>
              </div>
            </div>
          </div>

          {resubmitting && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setResubmitting(false);
                  setActiveMethod(null);
                }}
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
