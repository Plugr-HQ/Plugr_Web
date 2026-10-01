// src/components/Splash.tsx
// AUTH-01 splash: Bone full-bleed, gold logo settle, tagline, and a determinate gold
// loading bar so the hold reads as progress rather than a hang. Fades out (300ms) to the
// role-select entry underneath — same route, no navigation.

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { PlugrWordmark } from './Brand';

const TAGLINE = 'Pledging allegiance to your success';

/** Holds the splash for `ms`, then reveals the screen underneath. */
export function useSplash(ms = 1800) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return done;
}

export function Splash({ done }: { done: boolean }) {
  return (
    <div
      aria-hidden={done}
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-bone transition-opacity duration-300',
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      <div className="splash-mark">
        <PlugrWordmark className="h-10 text-gold" />
      </div>

      <p className="splash-fade-up mt-5 font-body text-sm text-slate">{TAGLINE}</p>

      {/* determinate loading bar */}
      <div className="mt-10 h-[3px] w-40 overflow-hidden rounded-pill bg-pitch-black/10">
        <div className="splash-bar h-full w-full rounded-pill bg-gold" />
      </div>
    </div>
  );
}
