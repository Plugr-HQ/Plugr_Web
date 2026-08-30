// src/app/app/browse/AppBrowseClient.tsx
// Trade-filter tabs (incl. Furniture) + Plug grid. Tapping a card opens the profile;
// each card also has a "Request this Plug" button that goes straight to booking (or auth).

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Star, BadgeCheck, ArrowUpRight, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Shell } from '@/src/components/Shell';
import { Card } from '@/src/components/ui';
import { RequestPlugButton } from '../_components/RequestPlugButton';

export type HackPlug = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  jobs_completed: number;
  verified: boolean;
};

const TABS = ['all', 'electrician', 'plumber', 'furniture'] as const;

export default function AppBrowseClient({ plugs, configError }: { plugs: HackPlug[]; configError: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const filtered = useMemo(
    () => (tab === 'all' ? plugs : plugs.filter((p) => p.trade?.toLowerCase() === tab)),
    [plugs, tab]
  );

  return (
    <Shell eyebrow="Client · Browse" title="Find a Plug" subtitle="Verified artisans near Yaba." back="/app">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-pill text-[13px] font-bold capitalize transition-all',
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
          <p className="text-sm text-slate leading-relaxed">Set <code>DATABASE_URL</code> and seed the schema.</p>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((plug, i) => (
          <Card key={plug.id} className={cn('p-4', `rise rise-${Math.min(i + 1, 4)}`)}>
            <Link href={`/app/plugs/${plug.id}`} className="flex items-center gap-4 group">
              <div className="relative shrink-0">
                <div className="grid place-items-center h-14 w-14 rounded-2xl bg-midnight text-white font-display text-xl">{plug.name?.[0] ?? '?'}</div>
                {plug.verified && (
                  <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 rounded-full bg-bone">
                    <BadgeCheck className="w-5 h-5 text-gold fill-gold/20" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-midnight truncate">{plug.name}</h3>
                <p className="text-sm text-slate capitalize">{plug.trade}</p>
                {/* A Plug with no completed jobs has no rating to show. "0.0" beside a gold star
                    reads as a score they earned and lost; "New to Plugr" is what is actually true. */}
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  {Number(plug.jobs_completed ?? 0) > 0 && Number(plug.rating ?? 0) > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-midnight font-semibold"><Star className="w-3.5 h-3.5 fill-gold text-gold" />{Number(plug.rating).toFixed(1)}</span>
                      <span className="text-slate">{plug.jobs_completed} jobs done</span>
                    </>
                  ) : (
                    <span className="text-slate">New to Plugr</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-gold shrink-0 inline-flex items-center gap-0.5 group-hover:gap-1 transition-all">Profile <ArrowUpRight className="w-3.5 h-3.5" /></span>
            </Link>
            <div className="mt-3 flex justify-end">
              <RequestPlugButton plugId={plug.id} plugName={plug.name} plugTrade={plug.trade} compact />
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
