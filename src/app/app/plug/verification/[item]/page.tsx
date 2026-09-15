// src/app/app/plug/verification/[item]/page.tsx — placeholder for one Verification Hub item.
//
// Each item's real screen (Didit, BVN, guarantor, skills call, background, certificates) is built
// separately. Until then this page holds the route so the Hub's navigation is real, and says
// plainly that the step isn't available yet.
//
// Outside production it also shows the item's legal state-machine moves as buttons, so every Hub
// state can be reached and checked by hand. Those controls never render in a production build.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Hammer } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { StateChip } from '@/src/components/plug/VerificationHubScreen';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import {
  allowedNext,
  itemBySlug,
  loadItemStates,
  saveItemStates,
  seedsEnabled,
  transition,
  type ItemState,
  type ItemStates,
} from '@/src/app/app/_lib/verificationHub';

const BASE = '/app';
const HUB = `${BASE}/plug/verification`;

const MOVE_LABELS: Record<ItemState, string> = {
  not_started: 'Reset to not started',
  in_progress: 'Mark in progress',
  pending_review: 'Submit for review',
  verified: 'Mark verified',
};

export default function VerificationItemPlaceholder() {
  const { item: slug } = useParams<{ item: string }>();
  const router = useRouter();
  const item = itemBySlug(slug);
  const [states, setStates] = useState<ItemStates | null>(null);

  useEffect(() => {
    if (!item) {
      router.replace(HUB); // unknown item → back to the Hub rather than a blank screen
      return;
    }
    setStates(loadItemStates(getPlugId() ?? ''));
  }, [item, router]);

  if (!item || !states) return <div className="min-h-screen bg-bone" />;

  const state = states[item.key];

  function move(to: ItemState) {
    const next = transition(states!, item!.key, to);
    saveItemStates(getPlugId() ?? '', next);
    setStates(next);
  }

  return (
    <Shell eyebrow="Verification" title={item.title} subtitle={item.summary} back={HUB}>
      <div className="rise flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Status</span>
        <StateChip state={state} />
        {!item.required && (
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate/70">· Optional</span>
        )}
      </div>

      <div className="rise rise-1 mt-5 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-pitch-black/[0.04] text-slate">
          <Hammer className="h-6 w-6" />
        </span>
        <p className="font-bold text-pitch-black">This step isn&rsquo;t available yet</p>
        <p className="mt-1.5 max-w-[280px] text-sm leading-relaxed text-slate">
          We&rsquo;re still building it. Your other items aren&rsquo;t affected — you can do them in any order.
        </p>
      </div>

      {seedsEnabled && (
        <div className="mt-6 rounded-[18px] border border-dashed border-pitch-black/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">
            Dev only · state machine
          </p>
          <p className="mt-1 text-[12px] text-slate">
            Legal moves from <span className="font-bold text-pitch-black">{state.replace('_', ' ')}</span>
            {item.needsHumanReview ? ' (this item goes through human review)' : ''}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowedNext(item, state).length === 0 ? (
              <span className="text-[12px] text-slate">None — terminal state.</span>
            ) : (
              allowedNext(item, state).map((to) => (
                <button
                  key={to}
                  onClick={() => move(to)}
                  className="rounded-pill border border-pitch-black/15 bg-white px-3.5 py-1.5 text-[12px] font-bold text-pitch-black hover:border-gold"
                >
                  {MOVE_LABELS[to]}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
