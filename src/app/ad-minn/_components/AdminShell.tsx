// src/app/ad-minn/_components/AdminShell.tsx
// The /ad-minn chrome on the /app design system (bone canvas, midnight + gold, Clash Display).
//
// Sidebar (ChatGPT / Claude style): a persistent icon rail that is ALWAYS visible. A toggle
// button expands it to the full labelled menu and collapses it back — it never disappears and
// never expands on hover. The choice is persisted. On desktop, expanding pushes the content; on
// mobile the expanded panel overlays the content with a scrim (so the narrow view isn't squished).
'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, ShieldCheck, Flag, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PlugrMark } from '@/src/app/demo/_components/ui';

export type AdminTab = 'dispatch' | 'jobs' | 'flags' | 'plugs' | 'verifications';

const NAV: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: 'dispatch', label: 'Dispatch', icon: LayoutDashboard },
  { key: 'jobs', label: 'Job Pipeline', icon: Briefcase },
  { key: 'flags', label: 'Flags', icon: Flag },
  { key: 'plugs', label: 'Plugs', icon: Users },
  { key: 'verifications', label: 'Verifications', icon: ShieldCheck },
];

const TITLES: Record<AdminTab, string> = {
  dispatch: 'Dispatch Queue',
  jobs: 'Job Pipeline',
  flags: 'Flags',
  plugs: 'Manage Plugs',
  verifications: 'Verifications',
};

const EXPANDED_KEY = 'plugr-admin-sidebar-expanded';

// Gold plug mark + wordtext — the brandmark stays gold everywhere (as Ramon used /plugr.svg).
function Brand({ expanded, textClass }: { expanded: boolean; textClass: string }) {
  return (
    <span className="flex items-center gap-2.5 overflow-hidden">
      <PlugrMark className="h-7 w-7 shrink-0 text-gold" />
      {expanded && (
        <>
          <span className={cn('font-display text-2xl leading-none tracking-tight', textClass)}>plugr</span>
          <span className="rounded-pill bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Admin</span>
        </>
      )}
    </span>
  );
}

export function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(EXPANDED_KEY);
    if (stored !== null) setExpanded(stored === 'true');
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(EXPANDED_KEY, String(next));
      return next;
    });
  };

  const go = (tab: AdminTab) => {
    onNavigate(tab);
    setExpanded((prev) => {
      // Collapse the mobile overlay after choosing, but leave a desktop preference alone.
      if (prev && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
        localStorage.setItem(EXPANDED_KEY, 'false');
        return false;
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-bone text-midnight">
      {/* Scrim — only when the expanded panel is overlaying content on mobile. */}
      <div
        className={cn('fixed inset-0 z-30 bg-midnight/40 backdrop-blur-[2px] transition-opacity md:hidden', expanded ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={toggle}
      />

      {/* Persistent sidebar — icon rail (w-16) or expanded menu (w-64). Always visible. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-midnight text-white transition-[width] duration-300 ease-in-out',
          expanded ? 'w-64' : 'w-16',
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-white/5', expanded ? 'px-4' : 'justify-center px-0')}>
          <Brand expanded={expanded} textClass="text-white" />
        </div>

        {/* Toggle — the collapse/expand control (never hover-driven). */}
        <div className="p-2">
          <button
            onClick={toggle}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex w-full items-center rounded-xl py-2.5 text-xs font-bold text-steel-blue transition-colors hover:bg-white/5 hover:text-white',
              expanded ? 'gap-3 px-3' : 'justify-center px-0',
            )}
          >
            {expanded ? <PanelLeftClose className="h-5 w-5 shrink-0" /> : <PanelLeftOpen className="h-5 w-5 shrink-0" />}
            {expanded && <span>Collapse</span>}
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-2 pb-3">
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => go(key)}
                title={!expanded ? label : undefined}
                className={cn(
                  'flex w-full items-center rounded-xl py-3 text-sm font-bold transition-colors',
                  expanded ? 'gap-3 px-3' : 'justify-center px-0',
                  isActive
                    ? 'bg-gold text-midnight shadow-[0_8px_20px_-10px_rgba(232,160,32,0.8)]'
                    : 'text-steel-blue hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {expanded && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {expanded && (
          <p className="border-t border-white/5 px-5 py-4 text-[10px] uppercase tracking-[0.12em] text-steel-blue/60">Plugr Admin v1.0</p>
        )}
      </aside>

      {/* Main column — always clears the rail (ml-16); pushed to ml-64 when expanded on desktop. */}
      <div className={cn('flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out ml-16', expanded && 'md:ml-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-midnight/[0.06] bg-bone/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <h1 className="font-display text-xl text-midnight sm:text-2xl">{TITLES[active]}</h1>
          <div className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-midnight">AD</div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
