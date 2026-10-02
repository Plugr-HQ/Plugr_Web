// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment.
//
// Artisans choose between:
//   1. Request an assessment call: select available day and window (2-3pm or 5:30-9pm) via dropdowns.
//      The specific time slot dropdown dynamically reveals upon selecting a window.
//   2. Send a WhatsApp voice note.
//
// Compact modern design styled to fit within 80-100vh.

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Hourglass,
  Loader2,
  Mic,
  PhoneCall,
  RefreshCw,
  Sparkles,
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
    id: 'afternoon' as const,
    label: 'Afternoon (2:00 PM – 3:00 PM)',
    shortLabel: '2:00 PM – 3:00 PM',
    slots: [
      { label: '2:00 PM', value: '14:00' },
      { label: '2:30 PM', value: '14:30' },
    ],
  },
  {
    id: 'evening' as const,
    label: 'Evening (5:30 PM – 9:00 PM)',
    shortLabel: '5:30 PM – 9:00 PM',
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

  // Dropdown schedule states
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<'afternoon' | 'evening' | ''>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slotError, setSlotError] = useState<string | null>(null);

  // Generate next 7 days in Lagos
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

  // Initialize selected date
  useEffect(() => {
    if (availableDays.length > 0 && !selectedDateStr) {
      // Default to today or tomorrow
      setSelectedDateStr(availableDays[0].dateStr);
    }
  }, [availableDays, selectedDateStr]);

  // Compute valid slots for current selection
  const validSlots = useMemo(() => {
    if (!selectedWindow) return [];
    const win = TIME_WINDOWS.find((w) => w.id === selectedWindow);
    if (!win) return [];

    const now = new Date();
    const todayLagosStr = toLagosDateString(now);

    if (selectedDateStr === todayLagosStr) {
      return win.slots.filter((slot) => {
        const iso = lagosSlotToUtcIso(selectedDateStr, slot.value);
        const slotTime = new Date(iso).getTime();
        return slotTime - now.getTime() >= 45 * 60 * 1000; // at least 45 mins buffer
      });
    }

    return win.slots;
  }, [selectedWindow, selectedDateStr]);

  // Auto-sync selected time slot whenever valid slots change
  useEffect(() => {
    if (selectedWindow && validSlots.length > 0) {
      if (!selectedTimeSlot || !validSlots.some((s) => s.value === selectedTimeSlot)) {
        setSelectedTimeSlot(validSlots[0].value);
      }
    } else if (validSlots.length === 0) {
      setSelectedTimeSlot('');
    }
  }, [selectedWindow, validSlots, selectedTimeSlot]);

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

  /** Record choice with selected meeting time. */
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
    if (!selectedDateStr || !selectedWindow || !selectedTimeSlot) {
      setSlotError('Please choose your window and time slot.');
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
      subtitle="A 15-min check of your trade knowledge."
      back={HUB}
    >
      <div className="mx-auto w-full max-w-sm">
        {state === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
          </div>
        ) : isPending ? (
          <div className="rise flex flex-col items-center rounded-2xl border border-pitch-black/[0.08] bg-white p-5 text-center shadow-xs">
            {path === 'CALL' && confirmedTime ? (
              <>
                <span className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="font-bold text-pitch-black text-sm">Assessment call confirmed</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  <Calendar className="h-3 w-3" />
                  {formatLagosTime(confirmedTime)}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate">
                  Confirmed with our ops team. Please keep your phone close — we’ll ring your Plugr number.
                </p>
              </>
            ) : path === 'CALL' && meetingTime ? (
              <>
                <span className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                  <Clock className="h-5 w-5" />
                </span>
                <p className="font-bold text-pitch-black text-sm">Call requested</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-gold/10 border border-gold/30 px-3 py-0.5 text-xs font-bold text-[#8a5a08]">
                  <Calendar className="h-3 w-3" />
                  {formatLagosTime(meetingTime)}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate">
                  We stored your selected slot. Ops will confirm via WhatsApp, then call your Plugr number.
                </p>
              </>
            ) : path === 'CALL' ? (
              <>
                <span className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                  <Hourglass className="h-5 w-5" />
                </span>
                <p className="font-bold text-pitch-black text-sm">We’ll call you</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate">
                  Someone from ops will ring your Plugr number to agree a time and run through trade questions.
                </p>
              </>
            ) : (
              <>
                <span className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]">
                  <Hourglass className="h-5 w-5" />
                </span>
                <p className="font-bold text-pitch-black text-sm">Waiting on your voice note</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate">
                  Send your voice note on WhatsApp whenever you’re ready. Ops reviews it and updates this item.
                </p>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 rounded-pill border border-pitch-black/15 bg-white px-3.5 py-1.5 text-xs font-bold text-pitch-black hover:border-gold hover:bg-gold/5 transition-colors"
                  >
                    Open WhatsApp again
                  </a>
                )}
              </>
            )}

            <div className="mt-4 pt-3 border-t border-pitch-black/[0.06] w-full flex justify-center">
              <button
                onClick={() => setResubmitting(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate hover:text-pitch-black transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Change time or method
              </button>
            </div>
          </div>
        ) : state === 'verified' ? (
          <div className="rise flex flex-col items-center rounded-2xl border border-pitch-black/[0.08] bg-white p-5 text-center shadow-xs">
            <span className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p className="font-bold text-pitch-black text-sm">Skills assessment passed</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">
              Our team confirmed your trade knowledge. Nothing else to do here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviewNote && (
              <div className="rounded-xl border border-gold/50 bg-gold/[0.07] p-2.5 text-xs" role="alert">
                <p className="font-bold text-pitch-black">Let’s try that again</p>
                <p className="mt-0.5 text-slate leading-relaxed">{reviewNote}</p>
              </div>
            )}

            {/* Main Option: Schedule Call with Chained Dropdowns */}
            <div className="rounded-2xl border border-pitch-black/[0.08] bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
                  <PhoneCall className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-pitch-black">Assessment Call</p>
                  <p className="text-[10px] text-slate">Choose your day, window & time (Lagos WAT)</p>
                </div>
              </div>

              {/* Chained Dropdowns */}
              <div className="space-y-2">
                {/* 1. Day Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">
                    1. Select Available Day
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDateStr}
                      onChange={(e) => {
                        setSelectedDateStr(e.target.value);
                        setSlotError(null);
                      }}
                      className="w-full appearance-none rounded-xl border border-pitch-black/15 bg-bone/40 px-3 py-1.5 text-xs font-semibold text-pitch-black outline-none transition-colors focus:border-gold"
                    >
                      {availableDays.map((d) => (
                        <option key={d.dateStr} value={d.dateStr}>
                          {d.label} ({d.date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate" />
                  </div>
                </div>

                {/* 2. Window Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">
                    2. Select Time Window
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWindow}
                      onChange={(e) => {
                        const win = e.target.value as 'afternoon' | 'evening' | '';
                        setSelectedWindow(win);
                        setSlotError(null);
                      }}
                      className="w-full appearance-none rounded-xl border border-pitch-black/15 bg-bone/40 px-3 py-1.5 text-xs font-semibold text-pitch-black outline-none transition-colors focus:border-gold"
                    >
                      <option value="">-- Choose window (Afternoon / Evening) --</option>
                      <option value="afternoon">Afternoon (2:00 PM – 3:00 PM)</option>
                      <option value="evening">Evening (5:30 PM – 9:00 PM)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate" />
                  </div>
                </div>

                {/* 3. Time Slot Selector (Appears once window is selected) */}
                {selectedWindow && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1 flex items-center justify-between">
                      <span>3. Pick Specific Call Time</span>
                      <span className="text-[9px] font-normal text-slate lowercase">15 min duration</span>
                    </label>
                    {validSlots.length > 0 ? (
                      <div className="relative">
                        <select
                          value={selectedTimeSlot}
                          onChange={(e) => {
                            setSelectedTimeSlot(e.target.value);
                            setSlotError(null);
                          }}
                          className="w-full appearance-none rounded-xl border border-pitch-black/15 bg-bone/40 px-3 py-1.5 text-xs font-semibold text-pitch-black outline-none transition-colors focus:border-gold"
                        >
                          {validSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label} (WAT)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-900">
                        No remaining slots today for this window. Please pick tomorrow or choose another window.
                      </div>
                    )}
                  </div>
                )}

                {slotError && <p className="text-[10px] font-semibold text-red-600">{slotError}</p>}

                <button
                  onClick={handleConfirmCallSlot}
                  disabled={busy !== null || !selectedWindow || !selectedTimeSlot}
                  className="mt-1 w-full inline-flex items-center justify-center gap-1.5 rounded-pill bg-gold py-2 text-xs font-bold text-pitch-black hover:bg-gold-light active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy === 'CALL' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirm & Request Call
                </button>
              </div>
            </div>

            {/* Secondary Option: Voice Note (Ultra-compact strip) */}
            <div
              className={cn(
                'rounded-2xl border border-pitch-black/[0.08] bg-white px-3 py-2.5 shadow-xs flex items-center justify-between gap-2.5',
                !WHATSAPP_NUMBER && 'opacity-70',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pitch-black/[0.05] text-slate">
                  <Mic className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-pitch-black truncate">Voice Note Option</p>
                  <p className="text-[10px] text-slate truncate">Answer questions on WhatsApp</p>
                </div>
              </div>

              <button
                onClick={() =>
                  choose('VOICE_NOTE', undefined, () =>
                    window.open(waHref, '_blank', 'noopener,noreferrer'),
                  )
                }
                disabled={!WHATSAPP_NUMBER || busy !== null}
                className="shrink-0 rounded-pill bg-pitch-black px-3 py-1 text-[11px] font-bold text-white hover:bg-petrol active:scale-95 transition-all disabled:opacity-40"
              >
                {busy === 'VOICE_NOTE' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'WhatsApp'
                )}
              </button>
            </div>

            {resubmitting && (
              <div className="pt-0.5 flex justify-center">
                <button
                  onClick={() => setResubmitting(false)}
                  className="text-[10px] font-semibold text-slate hover:text-pitch-black underline"
                >
                  Cancel and keep existing request
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-xs font-medium text-red-700" role="alert">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

