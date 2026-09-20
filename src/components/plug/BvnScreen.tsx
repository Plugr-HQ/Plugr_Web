// src/components/plug/BvnScreen.tsx
// Verification Hub item: BVN.
//
// The item was "Coming soon" while it had nothing behind it — the Fincra lookup is built but stopped
// pending Fincra's own KYC review of Plugr. This is the interim path: the Plug types their BVN, it
// is encrypted at rest with the same key as their NIN, and our own team confirms the digits. So it
// is a required item again, and submitting sends it to pending review like the guarantor item.
//
// Nothing about a bank account is asked for or shown. A BVN is not an account number and cannot move
// money; the copy says so, because being asked for one out of the blue is alarming otherwise.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Hourglass, Landmark, Loader2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { GoldButton, Label, TextInput } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import type { ItemState } from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const SUBMIT_URL = '/api/plug/verification/bvn';

export function BvnScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [bvn, setBvn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.bvn.state ?? 'not_started');
    setReviewNote(snap.items?.bvn.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (bvn.length !== 11 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(SUBMIT_URL, { method: 'POST', body: JSON.stringify({ bvn }) }, { redirectTo: '/app/auth/login' });
      setBvn(''); // sent — nothing it needs to stay on screen for
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
      title="BVN"
      subtitle="Your Bank Verification Number."
      back={HUB}
      footer={
        state === 'not_started' || state === 'in_progress' ? (
          <GoldButton onClick={submit} disabled={bvn.length !== 11 || submitting} loading={submitting}>
            {submitting ? 'Sending…' : 'Submit for review'}
          </GoldButton>
        ) : null
      }
    >
      {state === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : state === 'pending_review' ? (
        <StatusCard
          icon={<Hourglass className="h-6 w-6" />}
          title="With our team"
          body="We’ve got your BVN. Someone on our team confirms it by hand — this usually takes a day or two, and there’s nothing else for you to do."
        />
      ) : state === 'verified' ? (
        <StatusCard
          tone="done"
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="BVN confirmed"
          body="Your BVN checked out. Nothing else to do here."
        />
      ) : (
        <>
          {reviewNote && (
            <div className="rise rounded-[18px] border border-gold/50 bg-gold/[0.07] p-4" role="alert">
              <p className="text-sm font-bold text-pitch-black">We need you to send this again</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">{reviewNote}</p>
            </div>
          )}

          <div className={cn('rounded-[22px] border border-pitch-black/[0.08] bg-white p-5', reviewNote ? 'rise rise-1 mt-4' : 'rise')}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.05] text-slate">
                <Landmark className="h-5 w-5" />
              </span>
              <p className="text-[13px] leading-relaxed text-slate">
                <span className="font-bold text-pitch-black">A BVN is not an account number.</span> It can’t be used to
                move money and it doesn’t give anyone access to your bank. We ask for it because it ties your name to one
                verified identity across every Nigerian bank — which is what makes you hard to impersonate. It’s stored
                encrypted, never shown on your profile, and never shared with clients.
              </p>
            </div>
          </div>

          <div className="rise rise-2 mt-4 rounded-[22px] border border-pitch-black/[0.08] bg-white p-5">
            <Label className="mb-2">Bank Verification Number</Label>
            <TextInput
              value={bvn}
              onChange={(e) => {
                setBvn(e.target.value.replace(/\D/g, '').slice(0, 11));
                if (error) setError(null);
              }}
              inputMode="numeric"
              placeholder="22222222222"
              aria-label="Bank Verification Number"
              data-testid="bvn-input"
              className="tnum tracking-wide"
            />
            <p className="mt-2 text-[12px] text-slate">
              11 digits. Dial <span className="font-bold text-pitch-black">*565*0#</span> from the number registered with
              your bank if you don’t know yours.
            </p>
          </div>

          {error && (
            <p className="mt-4 text-[13px] font-bold text-red-600" role="alert" data-testid="bvn-error">
              {error}
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone = 'review',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: 'review' | 'done';
}) {
  return (
    <div
      className={cn(
        'rise rounded-[22px] border p-5',
        tone === 'done' ? 'border-emerald-500/20 bg-white' : 'border-dashed border-gold/60 bg-gold/[0.06]',
      )}
      role="status"
      data-testid="bvn-status"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
            tone === 'done' ? 'bg-emerald-500/12 text-emerald-700' : 'bg-gold/15 text-[#8a5a08]',
          )}
        >
          {icon}
        </span>
        <div>
          <p className="font-bold text-pitch-black">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">{body}</p>
        </div>
      </div>
    </div>
  );
}
