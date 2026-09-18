// src/components/plug/BackgroundInfoScreen.tsx
// Verification Hub item: Background info. No vendor and no reviewer — submitting completes it.
//
// Nothing here is pre-filled from signup, because signup collects none of it: date of birth, state
// of origin and LGA are asked nowhere else in the app (the only other date-of-birth in the codebase
// belongs to vendor payloads). Years of experience and training overlap loosely with the free-text
// skills/experience on the profile screen, which are a public showcase rather than a record, so they
// are asked here plainly rather than guessed at.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { GoldButton, TextArea, TextInput } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import type { ItemState } from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const SUBMIT_URL = '/api/plug/verification/background';

type Form = {
  yearsExperience: string;
  training: string;
  jobHistory: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  lga: string;
};

const EMPTY: Form = { yearsExperience: '', training: '', jobHistory: '', dateOfBirth: '', stateOfOrigin: '', lga: '' };

export function BackgroundInfoScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  /** Ops' note when they sent this back — shown so the Plug knows what to correct. */
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.background.state ?? 'not_started');
    setReviewNote(snap.items?.background.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({
      ...f,
      [key]: key === 'yearsExperience' ? e.target.value.replace(/\D/g, '').slice(0, 2) : e.target.value,
    }));

  const complete = Object.values(form).every((v) => v.trim().length > 0);

  async function submit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(
        SUBMIT_URL,
        { method: 'POST', body: JSON.stringify({ ...form, yearsExperience: Number(form.yearsExperience) }) },
        { redirectTo: '/app/auth/login' },
      );
      setEditing(false);
      setForm(EMPTY);
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t save that. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const done = state === 'verified' && !editing;

  return (
    <Shell
      eyebrow="Verification"
      title="Background info"
      subtitle="A few details about you and your work."
      back={HUB}
    >
      {state === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : done ? (
        <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="font-bold text-pitch-black">Background info complete</p>
          <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-slate">
            This one’s done — no review needed. You can update it any time.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 rounded-pill border border-pitch-black/15 bg-white px-4 py-2 text-[13px] font-bold text-pitch-black hover:border-gold"
          >
            Update my details
          </button>
        </div>
      ) : (
        <div className="rise rise-1 mt-2 space-y-4">
          {reviewNote && (
            <div className="rounded-[18px] border border-gold/50 bg-gold/[0.07] p-4" role="alert">
              <p className="text-sm font-bold text-pitch-black">Please update your details</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">{reviewNote}</p>
            </div>
          )}
          <div>
            <label htmlFor="b-years" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
              Years of experience
            </label>
            <TextInput id="b-years" inputMode="numeric" value={form.yearsExperience} onChange={set('yearsExperience')} />
          </div>

          <div>
            <label htmlFor="b-training" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
              Training
            </label>
            <TextArea
              id="b-training"
              rows={3}
              value={form.training}
              onChange={set('training')}
              placeholder="Apprenticeship, trade school, on the job — whatever applies."
            />
          </div>

          <div>
            <label htmlFor="b-history" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
              Job history
            </label>
            <TextArea
              id="b-history"
              rows={4}
              value={form.jobHistory}
              onChange={set('jobHistory')}
              placeholder="Where you’ve worked and roughly when. A few lines is plenty."
            />
          </div>

          <div>
            <label htmlFor="b-dob" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
              Date of birth
            </label>
            <TextInput id="b-dob" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="b-state" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
                State of origin
              </label>
              <TextInput id="b-state" value={form.stateOfOrigin} onChange={set('stateOfOrigin')} />
            </div>
            <div>
              <label htmlFor="b-lga" className="mb-1.5 block text-[13px] font-bold text-pitch-black">
                LGA
              </label>
              <TextInput id="b-lga" value={form.lga} onChange={set('lga')} />
            </div>
          </div>

          {error && (
            <p className="text-[13px] font-bold text-red-600" role="alert">
              {error}
            </p>
          )}

          <GoldButton onClick={submit} disabled={!complete || submitting} loading={submitting} className="w-full">
            Save my details
          </GoldButton>
          <p className="text-center text-[12px] text-slate">No review needed — this item completes as soon as you save.</p>
        </div>
      )}
    </Shell>
  );
}
