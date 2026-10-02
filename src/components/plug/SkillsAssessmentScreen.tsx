// src/components/plug/SkillsAssessmentScreen.tsx
// Verification Hub item: Skills assessment.
//
// Artisans choose between:
//   1. Request an assessment call: Custom chained selectors pulling a live 7-day schedule from the backend.
//      - Step 1: Available Day selector (synced with backend clock)
//      - Step 2: Time Window selector (Afternoon 2-3pm or Evening 5:30-9pm)
//      - Step 3: Specific Call Time selector (revealed dynamically once window is picked)
//   2. Send a WhatsApp voice note.
//
// Compact modern design styled to fit within 80-100vh with custom animated selectors.

'use client';

import { useCallback, useEffect, useId, useRef, useState, useMemo } from 'react';
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
const SCHEDULE_URL = '/api/plug/verification/skills/schedule';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SKILLS_WHATSAPP ?? '';

const VOICE_NOTE_PROMPT =
  'Hi — I’d like to do my Plugr skills assessment by voice note. Please send me the questions.';

// Types for backend schedule payload
export type ScheduleSlot = {
  label: string;
  value: string;
  isoUtc: string;
  available: boolean;
};

export type ScheduleWindow = {
  id: 'afternoon' | 'evening';
  label: string;
  shortLabel: string;
  slots: ScheduleSlot[];
  hasAvailableSlots: boolean;
};

export type ScheduleDay = {
  dateStr: string;
  label: string;
  formattedFull: string;
  hasAnySlots: boolean;
  windows: ScheduleWindow[];
};

export type ScheduleResponse = {
  serverTime: string;
  timezone: string;
  days: ScheduleDay[];
};

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

/** Converts a Lagos date ('YYYY-MM-DD') and slot ('HH:mm') into a UTC ISO string. */
function lagosSlotToUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // Lagos is UTC+1 (WAT) all year round: UTC hour = Lagos hour - 1
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0, 0));
  return utcDate.toISOString();
}

/** Custom Dropdown Option */
export type CustomSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
};

/**
 * Custom modern selector replacing native select
 */
function CustomSelect({
  label,
  icon: Icon,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  badge,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  placeholder: string;
  options: CustomSelectOption[];
  onChange: (val: string) => void;
  disabled?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const selectedOption = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">
          {label}
        </label>
        {badge && <span className="text-[9px] font-medium text-slate">{badge}</span>}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          'group relative flex w-full items-center justify-between gap-2 rounded-xl border bg-bone/40 px-3 py-2 text-left text-xs font-semibold transition-all',
          open
            ? 'border-gold bg-white ring-3 ring-gold/15 shadow-xs'
            : 'border-pitch-black/15 hover:border-pitch-black/30 hover:bg-white',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-bone/40 hover:border-pitch-black/15',
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-colors',
                open || selectedOption ? 'text-gold' : 'text-slate',
              )}
            />
          )}
          {selectedOption ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="text-pitch-black">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="ml-1.5 text-[10px] font-normal text-slate">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate/70 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate transition-transform duration-200',
            open && 'rotate-180 text-pitch-black',
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {open && !disabled && (
        <div
          id={menuId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-xl border border-pitch-black/10 bg-white p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-center text-xs text-slate">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const isOptDisabled = !!opt.disabled;

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isOptDisabled}
                  onClick={() => {
                    if (!isOptDisabled) {
                      onChange(opt.value);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-gold/15 text-pitch-black font-bold'
                      : isOptDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate'
                        : 'text-pitch-black hover:bg-gold/10 active:bg-gold/20 font-medium',
                  )}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className={cn(isSelected && 'font-bold')}>{opt.label}</span>
                    {opt.sublabel && (
                      <span className="ml-1.5 text-[10px] font-normal text-slate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="rounded-full bg-pitch-black/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-gold" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
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

  // Backend Live 1-Week Schedule State
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);

  // Custom Selector States
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<'afternoon' | 'evening' | ''>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slotError, setSlotError] = useState<string | null>(null);

  // 1. Fetch live 1-week schedule from backend
  const loadSchedule = useCallback(async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetch(SCHEDULE_URL, { cache: 'no-store' });
      if (res.ok) {
        const data: ScheduleResponse = await res.json();
        setSchedule(data);

        // Pick initial valid day: today if it has available slots, otherwise tomorrow
        if (data.days && data.days.length > 0) {
          const firstAvailableDay = data.days.find((d) => d.hasAnySlots) || data.days[0];
          setSelectedDateStr(firstAvailableDay.dateStr);
        }
      }
    } catch (e) {
      console.error('Failed to load schedule from backend', e);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  // 2. Load verification snapshot
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
    loadSchedule();
  }, [load, loadSchedule]);

  // Derived options for Custom Day Selector
  const dayOptions: CustomSelectOption[] = useMemo(() => {
    if (!schedule?.days) return [];
    return schedule.days.map((d) => ({
      value: d.dateStr,
      label: d.label,
      sublabel: `(${d.formattedFull})`,
      badge: d.hasAnySlots ? undefined : 'No slots',
      disabled: !d.hasAnySlots,
    }));
  }, [schedule]);

  // Derived current day from selection
  const currentDay = useMemo(() => {
    if (!schedule?.days) return null;
    return schedule.days.find((d) => d.dateStr === selectedDateStr) ?? null;
  }, [schedule, selectedDateStr]);

  // Derived options for Custom Window Selector
  const windowOptions: CustomSelectOption[] = useMemo(() => {
    if (!currentDay) return [];
    return currentDay.windows.map((w) => ({
      value: w.id,
      label: w.label,
      badge: w.hasAvailableSlots ? undefined : 'Passed',
      disabled: !w.hasAvailableSlots,
    }));
  }, [currentDay]);

  // Derived current window from selection
  const currentWindow = useMemo(() => {
    if (!currentDay || !selectedWindow) return null;
    return currentDay.windows.find((w) => w.id === selectedWindow) ?? null;
  }, [currentDay, selectedWindow]);

  // Derived options for Custom Time Slot Selector
  const slotOptions: CustomSelectOption[] = useMemo(() => {
    if (!currentWindow) return [];
    return currentWindow.slots.map((s) => ({
      value: s.value,
      label: `${s.label} (WAT)`,
      badge: s.available ? undefined : 'Passed',
      disabled: !s.available,
    }));
  }, [currentWindow]);

  // Auto-sync selected time slot whenever window or day changes
  useEffect(() => {
    if (currentWindow) {
      const firstAvailableSlot = currentWindow.slots.find((s) => s.available);
      if (firstAvailableSlot) {
        if (!selectedTimeSlot || !currentWindow.slots.some((s) => s.value === selectedTimeSlot && s.available)) {
          setSelectedTimeSlot(firstAvailableSlot.value);
        }
      } else {
        setSelectedTimeSlot('');
      }
    } else {
      setSelectedTimeSlot('');
    }
  }, [currentWindow, selectedTimeSlot]);

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
      await load();
      await loadSchedule();
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
        {state === null || loadingSchedule ? (
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

            {/* Main Option: Schedule Call with Custom Chained Selectors */}
            <div className="rounded-2xl border border-pitch-black/[0.08] bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
                  <PhoneCall className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-pitch-black">Assessment Call</p>
                  <p className="text-[10px] text-slate">1-week live schedule (Lagos WAT)</p>
                </div>
              </div>

              {/* Custom Chained Selectors Stack */}
              <div className="space-y-2">
                {/* 1. Custom Day Selector (Synced from backend) */}
                <CustomSelect
                  label="1. Available Day (1-Week)"
                  icon={Calendar}
                  value={selectedDateStr}
                  placeholder="Select day…"
                  options={dayOptions}
                  onChange={(val) => {
                    setSelectedDateStr(val);
                    setSlotError(null);
                  }}
                />

                {/* 2. Custom Window Selector */}
                <CustomSelect
                  label="2. Time Window"
                  icon={Clock}
                  value={selectedWindow}
                  placeholder="Choose window (Afternoon / Evening)…"
                  options={windowOptions}
                  onChange={(val) => {
                    setSelectedWindow(val as 'afternoon' | 'evening' | '');
                    setSlotError(null);
                  }}
                />

                {/* 3. Custom Call Time Selector (Revealed dynamically) */}
                {selectedWindow && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <CustomSelect
                      label="3. Call Time Slot"
                      badge="15 min duration"
                      icon={Sparkles}
                      value={selectedTimeSlot}
                      placeholder="Pick specific call time…"
                      options={slotOptions}
                      onChange={(val) => {
                        setSelectedTimeSlot(val);
                        setSlotError(null);
                      }}
                    />
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
