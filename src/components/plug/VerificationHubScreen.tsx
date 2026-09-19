// src/components/plug/VerificationHubScreen.tsx
// The Verification Hub — six independent items, doable in any order, reached from the dashboard.
//
// This screen is the shell only: item states, the overall status, and navigation into each
// item's own screen. What happens inside an item (Didit, BVN, guarantor, skills call, background,
// certificates) is built separately; until then each item opens a placeholder.
//
// Item states and their visual language:
//   not_started     slate chip, "Start"
//   in_progress     gold chip, "Continue"
//   pending_review  static hourglass on a dashed card. It is NOT a spinner: a guarantor reply
//                   or a skills call can take days, and a spinner reads as "loading, wait here".
//   verified        emerald check
//
// When every required item is verified the header reads "All items complete — under review".
// That is a status, not a grant: eligibility is decided by ops and enforced server-side. Which items
// are required (and which are "Coming soon") comes from verificationHub.ts — see BVN_ENABLED.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileBadge,
  Hourglass,
  Landmark,
  Mic,
  ScanFace,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { cn } from '@/src/lib/utils';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import {
  VERIFICATION_ITEMS,
  SEEDS,
  seedsEnabled,
  isActionable,
  loadItemStates,
  saveItemStates,
  summarize,
  type ItemState,
  type ItemStates,
  type VerificationItem,
  type VerificationItemKey,
} from '@/src/app/app/_lib/verificationHub';

const ICONS: Record<VerificationItemKey, React.ComponentType<{ className?: string }>> = {
  nin_liveness: ScanFace,
  bvn: Landmark,
  guarantor: UserCheck,
  skills: Mic,
  background: ClipboardList,
  certificates: FileBadge,
};

export function VerificationHubScreen({ base }: { base: string }) {
  const [states, setStates] = useState<ItemStates | null>(null);

  // localStorage is client-only, so state resolves after mount (a skeleton renders until then).
  useEffect(() => {
    const plugId = getPlugId() ?? '';

    // Non-production test seeds: /app/plug/verification?seed=none|partial|review|all
    let seeded = false;
    if (seedsEnabled) {
      const seed = new URLSearchParams(window.location.search).get('seed');
      if (seed && SEEDS[seed]) {
        saveItemStates(plugId, SEEDS[seed]);
        seeded = true;
      }
    }

    setStates(loadItemStates(plugId));

    // Five of the six items are decided server-side — identity by Didit's signed webhook, the rest
    // by what the Plug submitted and what ops made of it. Skipped while a test seed is loaded; on
    // failure the last cached value stays on screen.
    if (!seeded) {
      loadVerificationSnapshot(plugId)
        .then((snap) => setStates(snap.states))
        .catch(() => {});
    }
  }, []);

  return (
    <Shell
      eyebrow="Verification"
      title="Get verified"
      subtitle="Six items, in any order. Your account works while you finish them."
      back={`${base}/plug`}
    >
      {states ? <HubBody base={base} states={states} /> : <HubSkeleton />}
    </Shell>
  );
}

function HubBody({ base, states }: { base: string; states: ItemStates }) {
  const summary = summarize(states);
  const required = VERIFICATION_ITEMS.filter((i) => i.required);
  const optional = VERIFICATION_ITEMS.filter((i) => !i.required && !i.comingSoon);
  const comingSoon = VERIFICATION_ITEMS.filter((i) => i.comingSoon);

  return (
    <>
      <StatusHeader states={states} />

      <section className="mt-6" aria-labelledby="required-heading">
        <h2 id="required-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate">
          Required · {summary.requiredVerified} of {summary.requiredTotal} verified
        </h2>
        <ul className="space-y-2.5">
          {required.map((item, i) => (
            <li key={item.key} className={cn('rise', `rise-${Math.min(i + 1, 4)}`)}>
              <ItemRow base={base} item={item} state={states[item.key]} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7" aria-labelledby="optional-heading">
        <h2 id="optional-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate">
          Optional
        </h2>
        <ul className="space-y-2.5">
          {optional.map((item) => (
            <li key={item.key}>
              <ItemRow base={base} item={item} state={states[item.key]} />
            </li>
          ))}
        </ul>
      </section>

      {comingSoon.length > 0 && (
        <section className="mt-7" aria-labelledby="coming-soon-heading">
          <h2 id="coming-soon-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate">
            Coming soon · not needed yet
          </h2>
          <ul className="space-y-2.5">
            {comingSoon.map((item) => (
              <li key={item.key}>
                <ItemRow base={base} item={item} state={states[item.key]} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Overall status: progress segments for the required items, and a plain status line. */
function StatusHeader({ states }: { states: ItemStates }) {
  const summary = summarize(states);
  const required = VERIFICATION_ITEMS.filter((i) => i.required);

  if (summary.status === 'under_review') {
    return (
      <div className="rise rounded-[22px] bg-pitch-black p-5 text-bone" role="status">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15">
            <ShieldCheck className="h-5 w-5 text-gold" />
          </span>
          <div>
            <p className="font-display text-lg leading-tight">All items complete — under review</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-bone-muted">
              Our team is reviewing your verification. We&rsquo;ll let you know as soon as it&rsquo;s done —
              there&rsquo;s nothing else you need to do.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const line =
    summary.status === 'not_started'
      ? 'Start with any item. None of them depends on another.'
      : summary.awaitingReview > 0
        ? `${summary.requiredVerified} of ${summary.requiredTotal} verified · ${summary.awaitingReview} waiting on review`
        : `${summary.requiredVerified} of ${summary.requiredTotal} verified`;

  return (
    <div className="rise rounded-[22px] border border-pitch-black/[0.08] bg-white p-5" role="status">
      <div className="flex gap-1.5" aria-hidden="true">
        {required.map((item) => (
          <span
            key={item.key}
            className={cn(
              'h-1.5 flex-1 rounded-pill',
              states[item.key] === 'verified'
                ? 'bg-emerald-500'
                : states[item.key] === 'pending_review'
                  ? 'bg-[repeating-linear-gradient(90deg,var(--color-gold)_0_4px,transparent_4px_7px)]'
                  : states[item.key] === 'in_progress'
                    ? 'bg-gold'
                    : 'bg-pitch-black/10',
            )}
          />
        ))}
      </div>
      <p className="mt-3.5 text-sm font-bold text-pitch-black">{line}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate">
        When all {countWord(summary.requiredTotal)} required items are verified, our team reviews your profile.
      </p>
    </div>
  );
}

/** "4" → "four", so the copy follows the required count instead of hard-coding a number. */
function countWord(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][n] ?? String(n);
}

function ItemRow({ base, item, state }: { base: string; item: VerificationItem; state: ItemState }) {
  if (item.comingSoon) return <ComingSoonRow item={item} />;

  const Icon = ICONS[item.key];
  const actionable = isActionable(state);
  const pending = state === 'pending_review';

  const body = (
    <div
      className={cn(
        'flex items-center gap-3.5 rounded-[18px] border p-4 transition-colors',
        pending
          ? 'border-dashed border-gold/60 bg-gold/[0.06]'
          : state === 'verified'
            ? 'border-emerald-500/20 bg-white'
            : 'border-pitch-black/[0.08] bg-white',
        actionable && 'hover:border-gold/60 active:scale-[0.99]',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
          state === 'verified'
            ? 'bg-emerald-500/12 text-emerald-700'
            : pending
              ? 'bg-gold/15 text-[#8a5a08]'
              : state === 'in_progress'
                ? 'bg-pitch-black text-gold'
                : 'bg-pitch-black/[0.05] text-slate',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[15px] font-bold text-pitch-black">{item.title}</p>
          <StateChip state={state} />
        </div>
        <p className="mt-1 text-[13px] leading-snug text-slate">
          {pending
            ? item.key === 'guarantor'
              ? 'Waiting for your guarantor to respond and our team to confirm. This can take a few days.'
              : item.key === 'nin_liveness'
                ? 'Your ID check is with a reviewer. We’ll update this when there’s a decision.'
                : 'Waiting on your skills call to be reviewed. This can take a few days.'
            : item.summary}
        </p>
      </div>

      {/* The chip already names the state; the arrow is the affordance. A text label here pushed
          the chip under longer titles on a 375px screen. */}
      {actionable && (
        <ArrowRight className="h-4 w-4 shrink-0 text-pitch-black" aria-label={state === 'in_progress' ? 'Continue' : 'Start'} />
      )}
    </div>
  );

  // Pending review and verified are read-only — there is nothing for the Plug to do there.
  return actionable ? (
    <Link href={`${base}/plug/verification/${item.slug}`} className="block rounded-[18px] focus-visible:outline-2 focus-visible:outline-gold">
      {body}
    </Link>
  ) : (
    body
  );
}

/** An item that exists but can't be done yet. Never a link, never counted, whatever was cached. */
function ComingSoonRow({ item }: { item: VerificationItem }) {
  const Icon = ICONS[item.key];
  return (
    <div
      className="flex items-center gap-3.5 rounded-[18px] border border-dashed border-pitch-black/[0.12] bg-white/60 p-4"
      aria-disabled="true"
      data-testid={`item-${item.key}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black/[0.04] text-slate/70">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[15px] font-bold text-pitch-black/60">{item.title}</p>
          <span className="inline-flex items-center rounded-pill bg-pitch-black/[0.06] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-slate">
          Not needed to finish verifying right now. We’ll let you know when it opens.
        </p>
      </div>
    </div>
  );
}

export function StateChip({ state }: { state: ItemState }) {
  const map: Record<ItemState, { label: string; cls: string; icon?: React.ReactNode }> = {
    not_started: { label: 'Not started', cls: 'bg-slate/12 text-slate' },
    in_progress: { label: 'In progress', cls: 'bg-gold/15 text-[#8a5a08]' },
    pending_review: {
      label: 'Pending review',
      cls: 'bg-pitch-black text-gold',
      icon: <Hourglass className="h-3 w-3" aria-hidden="true" />,
    },
    verified: {
      label: 'Verified',
      cls: 'bg-emerald-500/12 text-emerald-700',
      icon: <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />,
    },
  };
  const { label, cls, icon } = map[state];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]', cls)}>
      {icon}
      {label}
    </span>
  );
}

function HubSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-[104px] rounded-[22px] bg-pitch-black/[0.05]" />
      <div className="mt-6 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[76px] rounded-[18px] bg-pitch-black/[0.04]" />
        ))}
      </div>
    </div>
  );
}
