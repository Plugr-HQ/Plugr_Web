// src/components/plug/GuarantorScreen.tsx
// Verification Hub item: Guarantor. A plain form — someone who will vouch for the Plug — that goes
// to ops to read, so submitting moves the item to pending review rather than straight to verified.
//
// The typed name at the bottom is the guarantor's e-signature. It is the guarantor assenting, not
// the Plug, which is why the statement above it names both people and why the backend refuses a
// signature that isn't the guarantor's own name.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Hourglass, Loader2, UserCheck } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { GoldButton, TextInput } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import type { ItemState } from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const SUBMIT_URL = '/api/plug/verification/guarantor';

type Form = {
  fullName: string;
  phone: string;
  email: string;
  nin: string;
  relationship: string;
  signatureName: string;
};

const EMPTY: Form = { fullName: '', phone: '', email: '', nin: '', relationship: '', signatureName: '' };

const FIELDS: Array<{ key: keyof Form; label: string; hint?: string; type?: string; inputMode?: 'tel' | 'numeric' | 'email' }> = [
  { key: 'fullName', label: 'Guarantor’s full name' },
  { key: 'phone', label: 'Their phone number', hint: 'A number we can actually reach them on.', type: 'tel', inputMode: 'tel' },
  { key: 'email', label: 'Their email address', type: 'email', inputMode: 'email' },
  { key: 'nin', label: 'Their NIN', hint: '11 digits. Stored securely and never shown on your profile.', inputMode: 'numeric' },
  { key: 'relationship', label: 'Their relationship to you', hint: 'For example: former employer, landlord, church elder.' },
];

export function GuarantorScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  /** The Plug's own name, so the signature statement names both people rather than saying "you". */
  const [plugName, setPlugName] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.guarantor.state ?? 'not_started');
    setReviewNote(snap.items?.guarantor.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
    // Name only — the guarantor is signing a statement about a named person, and "vouch for you"
    // reads as boilerplate. A failure here just leaves the softer wording in place.
    apiFetch(`/api/plugs/${getPlugId() ?? ''}/dashboard`, {}, { skipAuthRedirect: true })
      .then((body: any) => setPlugName(body?.plug?.name ?? null))
      .catch(() => {});
  }, [load]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: key === 'nin' ? e.target.value.replace(/\D/g, '').slice(0, 11) : e.target.value }));

  const guarantorName = form.fullName.trim() || 'your guarantor';
  const who = plugName?.trim() || 'you';
  const complete = Object.values(form).every((v) => v.trim().length > 0);

  async function submit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(SUBMIT_URL, { method: 'POST', body: JSON.stringify(form) }, { redirectTo: '/app/auth/login' });
      setForm(EMPTY);
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t submit that. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      eyebrow="Verification"
      title="Guarantor"
      subtitle="Someone who can vouch for you."
      back={HUB}
    >
      {state === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : state === 'pending_review' ? (
        <StatusCard
          icon={<Hourglass className="h-6 w-6" />}
          title="With our team"
          body="We’ve got your guarantor’s details. Our team will contact them and confirm. This can take a few days — there’s nothing else for you to do."
        />
      ) : state === 'verified' ? (
        <StatusCard
          tone="done"
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Guarantor confirmed"
          body="Your guarantor vouched for you and our team confirmed it. Nothing else to do here."
        />
      ) : (
        <>
          {reviewNote && (
            <div className="rise rounded-[18px] border border-gold/50 bg-gold/[0.07] p-4" role="alert">
              <p className="text-sm font-bold text-pitch-black">We need a different guarantor</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">{reviewNote}</p>
            </div>
          )}

          <div className="rise rise-1 mt-4 rounded-[22px] border border-pitch-black/[0.08] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
                <UserCheck className="h-5 w-5" />
              </span>
              <p className="text-[13px] leading-relaxed text-slate">
                Pick someone who has known you a while and will answer their phone — a former employer, a landlord, or
                someone senior in your trade. It can’t be you, and we do contact them.
              </p>
            </div>
          </div>

          <div className="rise rise-2 mt-4 space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`g-${f.key}`} className="mb-1.5 block text-[13px] font-bold text-pitch-black">
                  {f.label}
                </label>
                <TextInput
                  id={`g-${f.key}`}
                  type={f.type ?? 'text'}
                  inputMode={f.inputMode}
                  value={form[f.key]}
                  onChange={set(f.key)}
                  autoComplete="off"
                />
                {f.hint && <p className="mt-1 text-[12px] leading-relaxed text-slate">{f.hint}</p>}
              </div>
            ))}

            {/* The e-signature. Deliberately last, and phrased as the guarantor speaking. */}
            <div className="rounded-[18px] border border-pitch-black/[0.08] bg-white p-4">
              <p className="text-[13px] leading-relaxed text-slate">
                By typing their name below, <span className="font-bold text-pitch-black">{guarantorName}</span> confirms
                they vouch for <span className="font-bold text-pitch-black">{who}</span> and agree to be contacted by
                Plugr about this.
              </p>
              <label htmlFor="g-signatureName" className="mt-3 mb-1.5 block text-[13px] font-bold text-pitch-black">
                Guarantor’s signature
              </label>
              <TextInput
                id="g-signatureName"
                value={form.signatureName}
                onChange={set('signatureName')}
                placeholder="Type their full name"
                autoComplete="off"
                className="font-display text-lg"
              />
              <p className="mt-1 text-[12px] text-slate">Must match the full name above.</p>
            </div>

            {error && (
              <p className="text-[13px] font-bold text-red-600" role="alert">
                {error}
              </p>
            )}

            <GoldButton onClick={submit} disabled={!complete || submitting} loading={submitting} className="w-full">
              Submit guarantor
            </GoldButton>
            <p className="text-center text-[12px] text-slate">
              We’ll check with them, then confirm this item. You can carry on with your other items meanwhile.
            </p>
          </div>
        </>
      )}
    </Shell>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone = 'wait',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: 'wait' | 'done';
}) {
  return (
    <div className="rise mt-2 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
      <span
        className={
          tone === 'done'
            ? 'mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700'
            : 'mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-[#8a5a08]'
        }
      >
        {icon}
      </span>
      <p className="font-bold text-pitch-black">{title}</p>
      <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-slate">{body}</p>
    </div>
  );
}
