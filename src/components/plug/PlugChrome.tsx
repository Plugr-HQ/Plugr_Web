// src/components/plug/PlugChrome.tsx
// Shared chrome for the Plug main app (PLG-01/02/03): sticky top nav, bottom tab bar,
// tier Badge Chip and a plain-language job Status Chip.
//
// Tiers (spec): Basic = not yet approved (Slate) · Verified = NIN + liveness done (Gold)
// · Pro = 10+ jobs and 4.5+ rating (filled Gold).

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Wallet, Bell, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PlugrMark } from '@/src/components/Brand';

export type Tier = 'basic' | 'verified' | 'pro';

/**
 * Launch tier is Basic for EVERY Plug — including ones who've cleared NIN + liveness.
 * Verification makes you trusted, not a higher tier. Tier is raised by the upgrade stack
 * (BVN + guarantor + skills assessment), and none of that ships at launch, so nothing
 * reaches Verified/Pro yet. The `upgrades` check is the seam those flows drop into.
 */
export function plugTier(plug: any): Tier {
  const upgrades = Array.isArray(plug?.tier_upgrades) ? plug.tier_upgrades : [];
  if (upgrades.length >= 3) return 'pro';
  if (upgrades.length >= 1) return 'verified';
  return 'basic';
}

export function BadgeChip({ tier, className }: { tier: Tier; className?: string }) {
  const map: Record<Tier, { label: string; cls: string }> = {
    // Note: spec says white text on every chip; on Gold that fails contrast, so verified/pro
    // use Pitch Black text instead. Same shape/scale, legible.
    basic: { label: 'Basic', cls: 'bg-slate text-white' },
    verified: { label: 'Verified', cls: 'bg-gold text-pitch-black' },
    pro: { label: 'Pro', cls: 'bg-gold text-pitch-black ring-2 ring-gold/30' },
  };
  const { label, cls } = map[tier];
  return (
    <span className={cn('inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-medium', cls, className)}>
      {label}
    </span>
  );
}

/** Plain-language job status — no jargon (spec). */
export function JobStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    requested: { label: 'Requested', cls: 'bg-slate/15 text-slate' },
    paid_escrow: { label: 'In Progress', cls: 'bg-emerald-500/12 text-emerald-700' },
    accepted: { label: 'In Progress', cls: 'bg-emerald-500/12 text-emerald-700' },
    completed: { label: 'In Progress', cls: 'bg-emerald-500/12 text-emerald-700' },
    released: { label: 'Paid', cls: 'bg-emerald-500/12 text-emerald-700' },
    withdrawn: { label: 'Paid', cls: 'bg-emerald-500/12 text-emerald-700' },
    disputed: { label: 'Disputed', cls: 'bg-gold/15 text-[#8a5a08]' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate/15 text-slate' };
  return (
    <span className={cn('inline-flex items-center rounded-pill px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]', s.cls)}>
      {s.label}
    </span>
  );
}

/** Centered flat illustration-free empty state (spec: no gradients). */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <span className="grid place-items-center h-14 w-14 rounded-2xl bg-pitch-black/[0.04] text-slate mb-4">{icon}</span>
      <p className="font-bold text-pitch-black">{title}</p>
      <p className="mt-1.5 max-w-[260px] text-sm text-slate leading-relaxed">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '' },
  { key: 'profile', label: 'Profile', icon: User, path: '/profile' },
  { key: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  // Settings doesn't ship at launch — the tab exists, the screen is an honest "not yet".
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

/**
 * Plug app shell: sticky top nav + content + bottom tabs.
 * `base` keeps every link inside the right namespace.
 */
export function PlugShell({
  base,
  plug,
  children,
}: {
  base: string;
  plug: any | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const root = `${base}/plug`;
  const tier = plugTier(plug);

  return (
    <div className="min-h-screen bg-bone text-pitch-black font-body antialiased flex justify-center">
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col">
        {/* Top nav — sticky, Bone, mark left, bell + badge right */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-pitch-black/[0.06] bg-bone/90 px-5 py-3.5 backdrop-blur">
          <Link href={root} aria-label="Home">
            <PlugrMark className="w-[22px] h-[22px] text-pitch-black" />
          </Link>

          <div className="flex items-center gap-3">
            {plug && (
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-pitch-black truncate max-w-[120px]">
                  {String(plug.name).split(' ')[0]}
                </span>
                <BadgeChip tier={tier} />
              </span>
            )}
            <Link
              href={`${root}/notifications`}
              aria-label="Notifications"
              className="grid place-items-center h-9 w-9 rounded-full text-pitch-black hover:bg-pitch-black/[0.04] transition-colors"
            >
              <Bell className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-5 pt-5 pb-28">{children}</main>

        {/* Bottom tabs */}
        <nav className="sticky bottom-0 z-30 border-t border-pitch-black/[0.06] bg-bone/95 backdrop-blur">
          <div className="grid grid-cols-4">
            {TABS.map((t) => {
              const href = `${root}${t.path}`;
              const active = t.path === '' ? pathname === root : pathname.startsWith(href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 min-h-[56px] justify-center transition-colors',
                    active ? 'text-gold' : 'text-slate hover:text-pitch-black'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-wide">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
