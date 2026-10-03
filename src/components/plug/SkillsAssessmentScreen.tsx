// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment. Two ways to do it, both ending in pending review:
//
//   1. Request an assessment call. The Plug picks a day from a dropdown, then a time inside one of
//      the ops availability windows (afternoon / evening). The tap alerts the ops team in the
//      Telegram ops chat (backend). Ops confirm or adjust the slot and the Plug is told on WhatsApp,
//      then ops ring them at that time.
//   2. Send a WhatsApp voice note answering the ops lead's questions.
//
// Committing to either moves the item to pending review straight away. The item tracks that the Plug
// acted, not that the call has happened — ops decide pass or fail afterwards.
//
// CONFIG: NEXT_PUBLIC_SKILLS_WHATSAPP, the number voice notes go to. Unset renders the voice-note
// option as "coming soon" rather than a dead link. The call request needs no web config.
//
// OPS AVAILABILITY: edit WINDOWS below. Times are Lagos time (WAT, UTC+1, no DST).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Hourglass,
  Loader2,
  Mic,
  Moon,
  PhoneCall,
  Sun,
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

/** Earliest selectable call time, in hours from now. Gives ops time to react. */
const MIN_LEAD_HOURS = 1;

/** How many days (including today) the Plug can book into. */
const DAYS_AHEAD = 7;

/** Lagos is fixed UTC+1 (no daylight saving), so slots can be built as plain offset timestamps. */
const LAGOS_OFFSET = '+01:00';
const HOUR_MS = 3600_000;
const DAY_MS = 24 * HOUR_MS;

type WindowId = 'afternoon' | 'evening';

/** When ops are available. 24h "HH:MM", Lagos time. */
const WINDOWS: {
  id: WindowId;
  label: string;
  range: string;
  icon: React.ReactNode;
  times: string[];
}[] = [
  {
    id: 'afternoon',
    label: 'Afternoon window',
    range: '2:00 PM – 3:00 PM',
    icon: <Sun className="h-4 w-4" />,
    times: ['14:00', '14:30'],
  },
  {
    id: 'evening',
    label: 'Evening window',
    range: '5:30 PM – 9:00 PM',
    icon: <Moon className="h-4 w-4" />,
    times: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
  },
];

/** "14:30" -> "2:30 PM" */
function label12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Epoch ms of a Lagos-local day + time. dayKey is "YYYY-MM-DD", time is "HH:MM". */
function slotMs(dayKey: string, time: string) {
  return Date.parse(`${dayKey}T${time}:00${LAGOS_OFFSET}`);
}

/** Lagos-local midnight of "today", expressed as a UTC-midnight timestamp of the same calendar date. */
function lagosTodayKey(now: number) {
  const shifted = new Date(now + HOUR_MS); // Lagos wall clock, read through UTC getters
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

const dayFmt = new Intl.DateTimeFormat('en-NG', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function buildDays(now: number) {
  const base = lagosTodayKey(now);
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const ms = base + i * DAY_MS;
    const key = new Date(ms).toISOString().slice(0, 10);
    const date = dayFmt.format(ms);
    return { key, title: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date, date: i < 2 ? date : '' };
  });
}

/** Times in a window that are still far enough away to book. */
function openTimes(dayKey: string, windowId: WindowId, now: number) {
  const w = WINDOWS.find((x) => x.id === windowId)!;
  return w.times.filter((t) => slotMs(dayKey, t) >= now + MIN_LEAD_HOURS * HOUR_MS);
}

/** Display an ISO timestamp in Lagos time. */
function formatLagos(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}

export function SkillsAssessmentScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [path, setPath] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [meetingTime, setMeetingTime] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<'CALL' | 'VOICE_NOTE' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callDay, setCallDay] = useState<string | null>(null); // "YYYY-MM-DD", Lagos
  const [callTime, setCallTime] = useState<string | null>(null); // "HH:MM", Lagos

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.skills.state ?? 'not_started');
    setPath(snap.items?.skills.path ?? null);
    setMeetingTime(snap.items?.skills.meetingTime ?? null);
    setReviewNote(snap.items?.skills.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Record the choice first, then hand off — so a Plug who never comes back still shows as started. */
  async function choose(
    which: 'CALL' | 'VOICE_NOTE',
    opts: { handOff?: () => void; meetingTime?: string } = {},
  ) {
    if (busy) return;
    setBusy(which);
    setError(null);
    try {
      await apiFetch(
        START_URL,
        {
          method: 'POST',
          body: JSON.stringify({ path: which, ...(opts.meetingTime ? { meetingTime: opts.meetingTime } : {}) }),
        },
        { redirectTo: '/app/auth/login' },
      );
      opts.handOff?.();
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t start your assessment. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function requestCall() {
    if (!callDay || !callTime) {
      setError('Pick a day and a time for your call.');
      return;
    }
    const ms = slotMs(callDay, callTime);
    if (Number.isNaN(ms) || ms < Date.now() + MIN_LEAD_HOURS * HOUR_MS) {
      setError(`Pick a time at least ${MIN_LEAD_HOURS} hour from now.`);
      return;
    }
    choose('CALL', { meetingTime: new Date(ms).toISOString() });
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
            {path === 'CALL' ? 'Call requested' : 'Waiting on your voice note'}
          </p>
          <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-slate">
            {path === 'CALL'
              ? 'We’ll confirm your time on WhatsApp, then ring you on your Plugr number and run through a few questions about your trade. We’ll update this once it’s done.'
              : 'Send your voice note on WhatsApp whenever you’re ready. Our team reviews it and updates this item — this can take a few days.'}
          </p>
          {path === 'CALL' && meetingTime && (
            <div className="mt-4 rounded-[14px] bg-pitch-black/[0.04] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Your preferred time</p>
              <p className="mt-0.5 text-[13px] font-bold text-pitch-black">{formatLagos(meetingTime)}</p>
            </div>
          )}
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
              body="Set a time you’re available for a 15-minute phone call. We’ll confirm it on WhatsApp, then ring you."
              cta="Request assessment call"
              loading={busy === 'CALL'}
              ctaDisabled={!callDay || !callTime}
              onClick={requestCall}
            >
              <CallScheduler
                day={callDay}
                time={callTime}
                onDay={(d) => {
                  setCallDay(d);
                  setCallTime(null);
                  setError(null);
                }}
                onTime={(t) => {
                  setCallTime(t);
                  setError(null);
                }}
              />
            </Option>

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
              onClick={() =>
                choose('VOICE_NOTE', { handOff: () => window.open(waHref, '_blank', 'noopener,noreferrer') })
              }
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

/**
 * Day dropdown -> two availability windows (each a dropdown of times) -> summary of the chosen slot.
 * Fully controlled: the parent owns the chosen day/time so it can validate and submit them.
 */
function CallScheduler({
  day,
  time,
  onDay,
  onTime,
}: {
  day: string | null;
  time: string | null;
  onDay: (d: string) => void;
  onTime: (t: string | null) => void;
}) {
  const now = Date.now();
  const days = buildDays(now);
  const [dayOpen, setDayOpen] = useState(false);
  const [openWin, setOpenWin] = useState<WindowId | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close the day menu on outside tap or Escape.
  useEffect(() => {
    if (!dayOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setDayOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDayOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [dayOpen]);

  const selectedDay = days.find((d) => d.key === day) ?? null;
  const dayHasSlots = (key: string) => WINDOWS.some((w) => openTimes(key, w.id, now).length > 0);

  return (
    <div className="mt-3 space-y-3">
      {/* 1. Day */}
      <div ref={boxRef} className="relative">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-bold text-pitch-black">1. Choose day</span>
          <span className="rounded-pill bg-pitch-black/[0.06] px-2 py-0.5 text-[10.5px] font-bold text-slate">
            Lagos time (WAT)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setDayOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={dayOpen}
          className={cn(
            'flex w-full items-center justify-between rounded-[12px] border bg-white px-3 py-2.5 text-left text-[13px] transition-colors',
            dayOpen ? 'border-gold' : 'border-pitch-black/15 hover:border-gold/60',
          )}
        >
          <span className={selectedDay ? 'font-bold text-pitch-black' : 'text-slate'}>
            {selectedDay
              ? selectedDay.date
                ? `${selectedDay.title} · ${selectedDay.date}`
                : selectedDay.title
              : 'Select a day'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-slate transition-transform', dayOpen && 'rotate-180')} />
        </button>

        {dayOpen && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-[12px] border border-pitch-black/10 bg-white p-1 shadow-lg"
          >
            {days.map((d) => {
              const available = dayHasSlots(d.key);
              const active = d.key === day;
              return (
                <li key={d.key} role="option" aria-selected={active}>
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      onDay(d.key);
                      setOpenWin(null);
                      setDayOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px]',
                      active ? 'bg-gold/15 font-bold text-pitch-black' : 'text-pitch-black hover:bg-pitch-black/[0.04]',
                      !available && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                    )}
                  >
                    <span className="font-bold">{d.title}</span>
                    <span className="text-[11px] font-normal text-slate">{available ? d.date : 'No slots left'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 2. Availability windows, only once a day is picked */}
      {day && (
        <div className="space-y-2">
          <span className="block text-[12px] font-bold text-pitch-black">2. Select available window</span>

          {WINDOWS.map((w) => {
            const times = openTimes(day, w.id, now);
            const open = openWin === w.id;
            const full = times.length === 0;
            const pickedHere = time !== null && w.times.includes(time);

            return (
              <div key={w.id} className="overflow-hidden rounded-[12px] border border-pitch-black/10 bg-white">
                <button
                  type="button"
                  disabled={full}
                  onClick={() => setOpenWin(open ? null : w.id)}
                  aria-expanded={open}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
                    full ? 'cursor-not-allowed opacity-50' : 'hover:bg-pitch-black/[0.03]',
                  )}
                >
                  <span className="text-slate">{w.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-pitch-black">{w.label}</span>
                    <span className="block text-[11px] text-slate">
                      {full ? 'No slots left for this day' : w.range}
                    </span>
                  </span>
                  {pickedHere && time && (
                    <span className="rounded-pill bg-pitch-black px-2 py-0.5 text-[11px] font-bold text-white">
                      {label12(time)}
                    </span>
                  )}
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate transition-transform', open && 'rotate-180')} />
                </button>

                {open && !full && (
                  <div className="grid grid-cols-3 gap-2 border-t border-pitch-black/[0.07] p-3 sm:grid-cols-4">
                    {times.map((t) => {
                      const active = t === time;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            onTime(t);
                            setOpenWin(null);
                          }}
                          aria-pressed={active}
                          className={cn(
                            'inline-flex items-center justify-center gap-1 rounded-[10px] border px-2 py-2 text-[12.5px] font-bold transition-colors',
                            active
                              ? 'border-pitch-black bg-pitch-black text-white'
                              : 'border-pitch-black/15 bg-white text-pitch-black hover:border-gold',
                          )}
                        >
                          {active && <Check className="h-3 w-3" strokeWidth={3} />}
                          {label12(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chosen slot */}
      {day && time && (
        <div className="rounded-[12px] bg-pitch-black/[0.04] px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Your slot</p>
          <p className="mt-0.5 text-[13px] font-bold text-pitch-black">
            {formatLagos(new Date(slotMs(day, time)).toISOString())}
          </p>
        </div>
      )}
    </div>
  );
}

function Option({
  icon,
  title,
  body,
  cta,
  disabled,
  ctaDisabled,
  loading,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  disabled?: boolean;
  /** Disables the button without swapping its label to "Coming soon". */
  ctaDisabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
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
          {children}
          <button
            onClick={onClick}
            disabled={disabled || ctaDisabled || loading}
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