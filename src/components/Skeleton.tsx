// src/components/Skeleton.tsx
// Loading placeholders shaped like the thing that is loading.
//
// Every waiting surface in the app previously showed the same centred "Loader2 + Loading…", which
// tells someone that something is happening but not what, and makes the page jump when the real
// content lands at a different height. A skeleton that matches the real layout reserves the space,
// so the arrival is a fill rather than a reflow.
//
// `animate-pulse` only — no shimmer sweep. A moving highlight on half a dozen blocks at once is
// more distracting than the wait it is covering.

import { cn } from '@/src/lib/utils';

/** One placeholder block. Pass the same sizing utilities the real element uses. */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-lg bg-midnight/[0.07]', className)} />;
}

/**
 * Wrapper for a loading region. `aria-busy` plus a visually-hidden label means a screen reader is
 * told the region is loading instead of reading out a pile of empty boxes.
 */
export function SkeletonRegion({
  label = 'Loading',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Browse listing */
/*
 * NOT WIRED to a route-level loading.tsx. Both routes that were given one (/app/browse and
 * /p/[id]) left the fallback mounted after the content resolved in a production build, so the
 * finished page rendered alongside a still-pulsing skeleton that stole layout width. The
 * state-driven skeletons below (dashboard, profile, job detail) do not stream and behave
 * correctly, which is why they are wired and these are not.
 *
 * Browse also no longer has a wait worth covering: it is ISR-cached for 60s, so it renders from
 * cache immediately. Kept for whenever the streaming boundary is sorted out.
 */

/** Matches AppBrowseClient's card: avatar, two text lines, meta row, and the request button. */
export function PlugCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-midnight/[0.06] bg-white p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="mt-2 h-3 w-1/4" />
          <Skeleton className="mt-3 h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Skeleton className="h-9 w-36 rounded-pill" />
      </div>
    </div>
  );
}

export function BrowseSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading verified Plugs" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PlugCardSkeleton key={i} />
      ))}
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ Plug profile */

/** Matches /app/plugs/[plugId]: cover, avatar, name, verification pill, stat, about, skills. */
export function PlugProfileSkeleton() {
  return (
    <SkeletonRegion label="Loading profile">
      <div className="overflow-hidden rounded-[24px] border border-midnight/[0.06] bg-white">
        <Skeleton className="h-24 rounded-none" />
        <div className="-mt-10 px-5 pb-5">
          <Skeleton className="h-20 w-20 rounded-3xl" />
          <Skeleton className="mt-3 h-6 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/4" />
          <Skeleton className="mt-3 h-3 w-2/3" />
        </div>
      </div>

      <Skeleton className="mt-4 h-11 w-52 rounded-pill" />

      <div className="mt-3 rounded-2xl border border-midnight/[0.06] bg-white p-3">
        <Skeleton className="mx-auto h-10 w-24" />
      </div>

      <div className="mt-4 rounded-[22px] border border-midnight/[0.06] bg-white p-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-11/12" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>

      <div className="mt-4 rounded-[22px] border border-midnight/[0.06] bg-white p-5">
        <Skeleton className="h-3 w-14" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-pill" />
          <Skeleton className="h-8 w-20 rounded-pill" />
          <Skeleton className="h-8 w-24 rounded-pill" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ Plug dashboard */

/** Matches DashboardScreen: hero card, earnings pair, wallet row, active job, recent jobs. */
export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading your dashboard">
      <Skeleton className="h-[104px] rounded-[22px]" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-[22px]" />
        <Skeleton className="h-24 rounded-[22px]" />
      </div>

      <Skeleton className="mt-3 h-28 rounded-[22px]" />

      <div className="mt-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-32 rounded-[22px]" />
      </div>

      <div className="mt-6">
        <Skeleton className="h-3 w-20" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16 rounded-[18px]" />
          <Skeleton className="h-16 rounded-[18px]" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ Digital ID (/p/[id]) */

/**
 * NOT CURRENTLY WIRED — kept because the shape is right and the work is done.
 *
 * /p/[id] was given a loading state twice: once as a route-level loading.tsx, once as a Suspense
 * boundary inside the page. Both left the fallback mounted after the content resolved in a
 * PRODUCTION build — the route streams, and the fallback was never swapped out, so the finished
 * profile rendered next to a still-pulsing skeleton that stole ~48px of width and pushed the
 * whole page off-centre. Backed out rather than shipped: this is the page a client opens from a
 * WhatsApp link, and a wrong layout there is worse than a brief blank.
 *
 * To finish it, work out why the boundary does not resolve on this route (it resolves correctly
 * for the client-fetched screens, which use component state rather than streaming) and verify
 * against `next build && next start`, not dev — dev hid the problem in both directions.
 */
export function PublicProfileSkeleton() {
  return (
    <SkeletonRegion label="Loading Plug profile" className="mx-auto w-full max-w-xl px-6 pb-28 pt-8">
      <div className="flex flex-col items-center">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="mt-5 h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-28" />
        <Skeleton className="mt-3 h-3 w-40" />
        <Skeleton className="mt-5 h-9 w-52 rounded-pill" />
      </div>

      <div className="mt-8 rounded-3xl border border-midnight/[0.06] bg-white p-6">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-10/12" />
      </div>

      <Skeleton className="mt-8 h-14 rounded-pill" />
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ Job detail */

/** Matches the Plug's job screen: status rail, client card, job body, then the action row. */
export function JobDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading job">
      <Skeleton className="h-14 rounded-[18px]" />

      <div className="mt-4 rounded-[22px] border border-midnight/[0.06] bg-white p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="mt-5 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
      </div>

      <div className="mt-4 rounded-[22px] border border-midnight/[0.06] bg-white p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
      </div>

      <div className="mt-6 flex gap-3">
        <Skeleton className="h-13 flex-1 rounded-pill" />
        <Skeleton className="h-13 w-28 rounded-pill" />
      </div>
    </SkeletonRegion>
  );
}

/**
 * Wallet (PLG-03) — balance card, the withdraw row, then the transaction list.
 * Added so the wallet matches the dashboard's skeleton instead of the bare "⟳ Loading…" line it
 * used to show; the two screens sit one tap apart and the change in treatment was noticeable.
 */
export function WalletSkeleton() {
  return (
    <SkeletonRegion label="Loading your wallet">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-32 rounded-[22px]" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-[22px]" />
        <Skeleton className="h-20 rounded-[22px]" />
      </div>

      <div className="mt-6">
        <Skeleton className="h-3 w-28" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-14 rounded-[18px]" />
          <Skeleton className="h-14 rounded-[18px]" />
          <Skeleton className="h-14 rounded-[18px]" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/**
 * A list of job rows (My Jobs). Replaces a hand-rolled inline block that rendered literal
 * "Loading..." text inside placeholder cards.
 */
export function JobListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading your jobs">
      <Skeleton className="h-3 w-20" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-[22px]" />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Settings — profile card, payout account, then the logout row. */
export function SettingsSkeleton() {
  return (
    <SkeletonRegion label="Loading your settings">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-40 rounded-[22px]" />

      <div className="mt-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-20 rounded-[22px]" />
      </div>

      <Skeleton className="mt-8 h-12 rounded-pill" />
    </SkeletonRegion>
  );
}
