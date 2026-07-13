// src/app/demo/browse/BrowseClient.tsx
// Trade-filter tabs + Plug grid for Screen 1. Each card routes to the booking screen.

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Star, BadgeCheck, ArrowUpRight, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Shell } from '../_components/Shell';
import { Card } from '../_components/ui';

export type HackPlug = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  jobs_completed: number;
  verified: boolean;
};

const TABS = ['all', 'electrician', 'plumber'] as const;

export default function BrowseClient({ plugs, configError }: { plugs: HackPlug[]; configError: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');

  const filtered = useMemo(
    () => (tab === 'all' ? plugs : plugs.filter((p) => p.trade?.toLowerCase() === tab)),
    [plugs, tab]
  );

  return (
    <Shell eyebrow="Step 1 · Browse" title="Find a Plug" subtitle="Verified artisans near Ikeja." back="/demo">
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-pill text-[13px] font-bold capitalize transition-all',
              tab === t
                ? 'bg-midnight text-white shadow-[0_8px_20px_-12px_rgba(15,31,61,0.6)]'
                : 'bg-white text-slate border border-midnight/[0.08] hover:border-midnight/20'
            )}
          >
            {t === 'all' ? 'All' : `${t}s`}
          </button>
        ))}
      </div>

      {configError && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-midnight mb-2">
            <Info className="w-4 h-4 text-gold" />
            <span className="font-bold text-sm">Database not connected</span>
          </div>
          <p className="text-sm text-slate leading-relaxed">
            Set <code className="text-midnight font-semibold">DATABASE_URL</code> in your env, then run the{' '}
            <code className="text-midnight font-semibold">hack_</code> schema + seed to list Plugs here.
          </p>
        </Card>
      )}

      {!configError && filtered.length === 0 && (
        <p className="text-slate text-sm">
          No Plugs yet — seed <code className="text-midnight">hack_plugs</code> to get started.
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((plug, i) => (
          <Card key={plug.id} className={cn('p-4', `demo-rise demo-rise-${Math.min(i + 1, 4)}`)}>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="grid place-items-center h-14 w-14 rounded-2xl bg-midnight text-white font-display text-xl">
                  {plug.name?.[0] ?? '?'}
                </div>
                {plug.verified && (
                  <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 rounded-full bg-bone">
                    <BadgeCheck className="w-5 h-5 text-gold fill-gold/20" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-midnight truncate">{plug.name}</h3>
                <p className="text-sm text-slate capitalize">{plug.trade}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-midnight font-semibold">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    {Number(plug.rating).toFixed(1)}
                  </span>
                  <span className="text-slate">{plug.jobs_completed} jobs done</span>
                </div>
              </div>
            </div>

            <Link
              href={`/demo/auth/client/${plug.id}`}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-pill bg-gold text-midnight text-sm font-bold py-2.5 hover:bg-gold-light transition-colors"
            >
              Request this Plug <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
