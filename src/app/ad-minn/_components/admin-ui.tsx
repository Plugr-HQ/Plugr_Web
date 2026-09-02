// src/app/ad-minn/_components/admin-ui.tsx
// Shared admin building blocks, styled to the /app design system (rounded-[22px] cards, warm
// elevation, pill chips with a status dot, gold focus rings, Clash Display). Used by every
// /ad-minn data view so the surface reads as one system, and responsive by default.
'use client';

import { Loader2, X, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/* ------------------------------------------------------------- Table surface */

// A Card whose table scrolls horizontally on small screens instead of breaking the layout.
export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-pitch-black/[0.06] bg-white card-shadow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">{children}</table>
      </div>
    </div>
  );
}

export function Thead({ cols }: { cols: { label: string; right?: boolean }[] }) {
  return (
    <thead>
      <tr className="border-b border-pitch-black/[0.06] bg-bone/40">
        {cols.map((c, i) => (
          <th
            key={i}
            className={cn(
              'px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate whitespace-nowrap',
              c.right && 'text-right',
            )}
          >
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const rowClass = 'border-b border-pitch-black/[0.05] last:border-0 transition-colors hover:bg-bone/40';
export const cellClass = 'px-5 py-4 align-middle';

/* -------------------------------------------------------------------- Chips */

export type Tone = 'neutral' | 'gold' | 'green' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber';

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate/12 text-slate',
  gold: 'bg-gold/15 text-[#8a5a08]',
  green: 'bg-emerald-500/12 text-emerald-700',
  red: 'bg-red-500/12 text-red-600',
  blue: 'bg-blue-500/12 text-blue-700',
  indigo: 'bg-indigo-500/12 text-indigo-700',
  purple: 'bg-purple-500/12 text-purple-700',
  amber: 'bg-amber-500/15 text-amber-700',
};

export function Chip({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Avatar */

/**
 * Admin avatar. Takes an optional photo — this is used in the verification queue, where ops are
 * deciding whether a Plug is who they claim to be, and showing them a letter instead of the
 * photograph that was submitted made that judgement impossible to actually make.
 */
export function Avatar({
  name,
  photoUrl,
  tone = 'bone',
}: {
  name?: string | null;
  photoUrl?: string | null;
  tone?: 'bone' | 'pitch-black' | 'gold';
}) {
  const styles = {
    bone: 'bg-pitch-black/[0.05] text-pitch-black',
    'pitch-black': 'bg-pitch-black text-bone',
    gold: 'bg-gold text-pitch-black',
  };

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name ? `${name}'s submitted photo` : 'Submitted photo'}
        className="h-9 w-9 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm', styles[tone])}>
      {(name?.trim()?.[0] ?? '?').toUpperCase()}
    </span>
  );
}

/* ---------------------------------------------------------------- Controls */

export function FilterSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'rounded-pill border border-pitch-black/10 bg-white px-4 py-2.5 text-sm font-bold text-pitch-black',
        'focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow',
        className,
      )}
      {...props}
    />
  );
}

export function RefreshButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-pill border border-pitch-black/10 bg-white px-3.5 py-2 text-xs font-bold text-slate transition-colors hover:text-pitch-black disabled:opacity-60"
    >
      <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
    </button>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">{children}</div>;
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
      {children}
      {hint && <span className="ml-1 font-normal normal-case tracking-normal text-slate/60">{hint}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ Toast */

export function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[18px] border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 rise">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------- Table states */

export function StateRow({
  colSpan,
  variant,
  title,
  body,
  icon,
  onRetry,
}: {
  colSpan: number;
  variant: 'loading' | 'empty' | 'error';
  title?: string;
  body?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        {variant === 'loading' ? (
          <>
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
            <p className="text-sm text-slate">{title ?? 'Loading…'}</p>
          </>
        ) : (
          <>
            {icon && (
              <div
                className={cn(
                  'mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl',
                  variant === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500',
                )}
              >
                {icon}
              </div>
            )}
            <h3 className={cn('font-bold', variant === 'error' ? 'text-red-600' : 'text-pitch-black')}>{title}</h3>
            {body && <p className="mt-1 text-sm text-slate">{body}</p>}
            {variant === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 rounded-pill bg-pitch-black px-4 py-2 text-xs font-bold text-bone transition-colors hover:bg-petrol"
              >
                Try again
              </button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

/* --------------------------------------------------------------- Pagination */

export function Pager({
  page,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate">Page {page}</span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-pill border border-pitch-black/10 bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-pitch-black disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-pill border border-pitch-black/10 bg-white px-4 py-2 text-xs font-bold text-slate transition-colors hover:text-pitch-black disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

// Card-based modal. On mobile it slides up as a bottom sheet; on ≥sm it's a centered dialog.
export function Modal({
  title,
  sub,
  onClose,
  children,
  footer,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-pitch-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] bg-white card-shadow rise sm:max-h-[88vh] sm:max-w-lg sm:rounded-[26px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-pitch-black/[0.06] px-6 py-4">
          <div>
            <h3 className="font-display text-lg text-pitch-black">{title}</h3>
            {sub && <p className="text-sm text-slate">{sub}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate transition-colors hover:bg-bone hover:text-pitch-black">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-pitch-black/[0.06] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalError({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
      <span>{children}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- Buttons */

export function PillButton({
  variant = 'primary',
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'gold' | 'ghost' | 'outline'; loading?: boolean }) {
  const styles = {
    primary: 'bg-pitch-black text-bone hover:bg-petrol shadow-[0_10px_24px_-14px] shadow-pitch-black/60',
    gold: 'bg-gold text-pitch-black hover:bg-gold-light shadow-[0_10px_24px_-14px_rgba(232,160,32,0.7)]',
    ghost: 'text-slate hover:text-pitch-black',
    outline: 'border border-pitch-black/10 bg-white text-pitch-black hover:bg-bone',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none',
        styles[variant],
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
