// src/app/ad-minn/_components/AdminShell.tsx
// The /ad-minn chrome on the /app design system (bone canvas, pitch-black + gold, Clash Display).
//
// Sidebar (ChatGPT / Claude style): a persistent icon rail that is ALWAYS visible. A toggle
// button expands it to the full labelled menu and collapses it back — it never disappears and
// never expands on hover. The choice is persisted. On desktop, expanding pushes the content; on
// mobile the expanded panel overlays the content with a scrim (so the narrow view isn't squished).
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, ShieldCheck, Flag, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Tags, LogOut, ClipboardList } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getAdminUser, getAdminInitials, getAdminFirstName, clearAdminUser, type AdminUser } from '@/src/lib/adminAuth';
import { clearToken } from '@/src/lib/api';

export type AdminTab = 'dispatch' | 'jobs' | 'flags' | 'plugs' | 'verifications' | 'categories' | 'audit';

const NAV: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: 'dispatch', label: 'Dispatch', icon: LayoutDashboard },
  { key: 'jobs', label: 'Job Pipeline', icon: Briefcase },
  { key: 'flags', label: 'Flags', icon: Flag },
  { key: 'plugs', label: 'Plugs', icon: Users },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'verifications', label: 'Verifications', icon: ShieldCheck },
  { key: 'audit', label: 'Reviewers', icon: ClipboardList },
];

const TITLES: Record<AdminTab, string> = {
  dispatch: 'Dispatch Queue',
  jobs: 'Job Pipeline',
  flags: 'Flags',
  plugs: 'Manage Plugs',
  categories: 'Categories',
  verifications: 'Verifications',
  audit: 'Admin Reviewers',
};

const EXPANDED_KEY = 'plugr-admin-sidebar-expanded';

// The exact brand asset from the repo — geometry/weight untouched, only the colour variant
// changes: the gold-mark + bold "plugr" light wordmark on the pitch-black sidebar, or the gold mark
// alone when collapsed. (eslint-disable: intentional <img> for the static SVG brand asset.)
function Brand({ expanded }: { expanded: boolean }) {
  return (
    <span className="flex items-center gap-2.5 overflow-hidden">
      {expanded ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_light.svg" alt="Plugr" className="h-6 w-auto shrink-0" />
          <span className="rounded-pill bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Admin</span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/plugr.svg" alt="Plugr" className="h-7 w-7 shrink-0" />
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
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [adminUser, setAdminUserState] = useState<AdminUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(EXPANDED_KEY);
    if (stored !== null) setExpanded(stored === 'true');
    setAdminUserState(getAdminUser());
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

  const handleLogout = () => {
    clearToken();
    clearAdminUser();
    router.replace('/ad-minn/login');
  };

  const initials = getAdminInitials(adminUser);
  const firstName = getAdminFirstName(adminUser);
  const fullName = adminUser?.name || 'Admin User';
  const email = adminUser?.email || '';
  const phone = adminUser?.phone || '';

  return (
    <div className="min-h-screen bg-bone text-pitch-black">
      {/* Scrim — only when the expanded panel is overlaying content on mobile. */}
      <div
        className={cn('fixed inset-0 z-30 bg-pitch-black/40 backdrop-blur-[2px] transition-opacity md:hidden', expanded ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={toggle}
      />

      {/* Persistent sidebar — icon rail (w-16) or expanded menu (w-64). Always visible. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-pitch-black text-bone transition-[width] duration-300 ease-in-out',
          expanded ? 'w-64' : 'w-16',
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-white/5', expanded ? 'px-4' : 'justify-center px-0')}>
          <Brand expanded={expanded} />
        </div>

        {/* Toggle — the collapse/expand control (never hover-driven). */}
        <div className="p-2">
          <button
            onClick={toggle}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex w-full items-center rounded-xl py-2.5 text-xs font-bold text-bone transition-colors hover:bg-white/5 hover:text-gold',
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
                    ? 'bg-gold text-pitch-black shadow-[0_8px_20px_-10px_rgba(232,160,32,0.8)]'
                    : 'text-bone hover:bg-white/5 hover:text-gold',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {expanded && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {expanded && (
          <p className="border-t border-white/5 px-5 py-4 text-[10px] uppercase tracking-[0.12em] text-bone-muted">Plugr Admin Dashboard V2.3</p>
        )}
      </aside>

      {/* Main column — always clears the rail (ml-16); pushed to ml-64 when expanded on desktop. */}
      <div className={cn('flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out ml-16', expanded && 'md:ml-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-pitch-black/[0.06] bg-bone/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="font-display text-xl text-pitch-black sm:text-2xl truncate">{TITLES[active]}</h1>
            <span className="hidden text-xs font-semibold text-slate sm:inline-block truncate">
              Welcome, {firstName}
            </span>
          </div>

          <div className="relative ml-auto flex items-center gap-3">
            <div className="group relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-pitch-black shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/50"
                title={`${fullName}${email ? ` (${email})` : ''}`}
                aria-label={`Logged in as ${fullName}`}
              >
                {initials}
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-56 rise rounded-2xl border border-pitch-black/10 bg-white p-3 shadow-xl">
                    <div className="border-b border-pitch-black/5 pb-2.5 mb-2 px-1">
                      <p className="truncate text-xs font-bold text-pitch-black">{fullName}</p>
                      {email && <p className="truncate text-[11px] text-slate">{email}</p>}
                      {phone && <p className="truncate text-[11px] text-slate/80">{phone}</p>}
                      <span className="mt-1.5 inline-block rounded-pill bg-gold/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#8a5a08]">
                        Admin Account
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
