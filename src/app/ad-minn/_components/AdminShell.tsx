// src/app/ad-minn/_components/AdminShell.tsx
// The /ad-minn chrome, rebuilt on the /app design system (bone canvas, midnight + gold, Clash
// Display, soft warm elevation). Responsive:
//   - Desktop: a fixed sidebar the user collapses/expands with a button (persisted). It does NOT
//     expand on hover — width only changes on an explicit click.
//   - Mobile: the sidebar is a slide-in drawer opened from a header hamburger, with a scrim.
'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, ShieldCheck, Flag, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PlugrMark, PlugrWordmark } from '@/src/app/demo/_components/ui';

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

const COLLAPSE_KEY = 'plugr-admin-sidebar-collapsed';

export function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const go = (tab: AdminTab) => {
    onNavigate(tab);
    setMobileOpen(false);
  };

  const Sidebar = (
    <aside
      className={cn(
        'flex h-full flex-col bg-midnight text-white transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className={cn('flex h-16 items-center border-b border-white/5 px-4', collapsed ? 'justify-center' : 'gap-2.5')}>
        {collapsed ? (
          <PlugrMark className="h-7 w-7 text-gold" />
        ) : (
          <>
            <PlugrWordmark className="h-6 w-auto text-white" />
            <span className="rounded-pill bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold">
              Admin
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => go(key)}
              title={collapsed ? label : undefined}
              className={cn(
                'group flex w-full items-center rounded-pill py-3 text-sm font-bold transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
                isActive
                  ? 'bg-gold text-midnight shadow-[0_8px_20px_-10px_rgba(232,160,32,0.8)]'
                  : 'text-steel-blue hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse control (desktop) + footer */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={toggleCollapsed}
          className={cn(
            'hidden md:flex w-full items-center rounded-pill py-2.5 text-xs font-bold text-steel-blue transition-colors hover:bg-white/5 hover:text-white',
            collapsed ? 'justify-center px-0' : 'gap-3 px-4',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0" /> : <PanelLeftClose className="h-5 w-5 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && <p className="mt-2 px-4 text-[10px] uppercase tracking-[0.12em] text-steel-blue/60">Plugr Admin v1.0</p>}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-bone text-midnight">
      {/* Desktop sidebar — fixed, width driven only by the collapse button (never hover). */}
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{Sidebar}</div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity duration-300',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="absolute inset-0 bg-midnight/50 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="relative h-full">
            {/* On mobile the drawer is always full-width nav (never collapsed). */}
            <div className="h-full w-64">
              <aside className="flex h-full w-64 flex-col bg-midnight text-white">
                <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
                  <div className="flex items-center gap-2.5">
                    <PlugrWordmark className="h-6 w-auto text-white" />
                    <span className="rounded-pill bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold">
                      Admin
                    </span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-steel-blue hover:bg-white/10 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
                  {NAV.map(({ key, label, icon: Icon }) => {
                    const isActive = active === key;
                    return (
                      <button
                        key={key}
                        onClick={() => go(key)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-pill px-4 py-3 text-sm font-bold transition-colors',
                          isActive ? 'bg-gold text-midnight' : 'text-steel-blue hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </nav>
                <p className="border-t border-white/5 px-6 py-4 text-[10px] uppercase tracking-[0.12em] text-steel-blue/60">
                  Plugr Admin v1.0
                </p>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Main column — margin follows the desktop sidebar width. */}
      <div className={cn('flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out', collapsed ? 'md:ml-20' : 'md:ml-64')}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-midnight/[0.06] bg-bone/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-midnight/10 bg-white text-midnight md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl text-midnight sm:text-2xl">{TITLES[active]}</h1>
          <div className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-midnight">
            AD
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
