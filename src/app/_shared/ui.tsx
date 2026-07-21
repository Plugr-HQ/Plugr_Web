// src/app/_shared/ui.tsx
// Shared premium UI primitives for the /app screens. Light-mode ("bone") throughout.
// Brand marks are inlined from Plugr's real logo SVG so they can be tinted via currentColor.

'use client';

import { cn } from '@/src/lib/utils';

/* ------------------------------------------------------------------ Brand */

// The plug icon mark (viewBox 0 0 200 200). Inherits color via currentColor.
export function PlugrMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M113.333 199.117C108.971 199.699 104.52 200 100 200C95.4795 200 91.029 199.699 86.6666 199.117V166.667C86.6666 155.628 77.7049 146.667 66.6666 146.667C55.6283 146.667 46.6665 155.628 46.6665 166.667V184.586C18.6323 166.862 0 135.59 0 100C0 44.8085 44.8085 0 100 0C155.191 0 200 44.8085 200 100C200 135.59 181.367 166.862 153.333 184.586V166.667C153.333 155.628 144.372 146.667 133.333 146.667C122.295 146.667 113.333 155.628 113.333 166.667V199.117Z"
        fill="currentColor"
      />
    </svg>
  );
}

// The full "plugr" wordmark lockup (viewBox 0 0 806 200). Inherits color via currentColor.
export function PlugrWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 806 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plugr">
      <path fillRule="evenodd" clipRule="evenodd" d="M113.333 199.117C108.971 199.699 104.52 200 100 200C95.4795 200 91.029 199.699 86.6666 199.117V166.667C86.6666 155.628 77.7049 146.667 66.6666 146.667C55.6283 146.667 46.6665 155.628 46.6665 166.667V184.586C18.6323 166.862 0 135.59 0 100C0 44.8085 44.8085 0 100 0C155.191 0 200 44.8085 200 100C200 135.59 181.367 166.862 153.333 184.586V166.667C153.333 155.628 144.372 146.667 133.333 146.667C122.295 146.667 113.333 155.628 113.333 166.667V199.117Z" fill="currentColor" />
      <path d="M738.983 138.2C738.983 144.164 734.147 149 728.183 149C722.218 149 717.383 144.164 717.383 138.2V59.4996C717.383 54.032 721.815 49.5996 727.283 49.5996C732.75 49.5996 737.183 54.032 737.183 59.4996V76.3996H738.583C741.583 60.3996 752.383 47.5996 772.783 47.5996C795.383 47.5996 805.183 63.7996 805.183 82.5996V84.8996C805.183 90.8091 800.392 95.5996 794.483 95.5996H792.583C787.723 95.5996 783.783 91.6597 783.783 86.7996C783.783 72.5996 777.783 65.9996 762.983 65.9996C745.983 65.9996 738.983 75.3996 738.983 93.1996V138.2Z" fill="currentColor" />
      <path d="M634.997 140C605.397 140 587.797 121.4 587.797 93.7996C587.797 66.1996 606.197 47.5996 636.397 47.5996C657.197 47.5996 672.797 56.9996 676.397 74.3996H677.597V59.4996C677.597 54.032 682.029 49.5996 687.497 49.5996C692.965 49.5996 697.397 54.032 697.397 59.4996V137.4C697.397 170.8 676.597 185 643.997 185C619.225 185 600.843 175.203 595.669 157.762C593.989 152.097 598.987 147.2 604.897 147.2C610.806 147.2 614.965 152.381 617.827 157.551C621.551 164.279 630.15 167 645.197 167C667.797 167 675.997 160.8 675.997 138.6V114.2H674.597C670.997 129.2 657.597 140 634.997 140ZM609.597 93.7996C609.597 114.2 621.597 121.4 641.997 121.4C663.997 121.4 675.997 112.2 675.997 94.5996V91.7996C675.997 74.9996 663.597 66.3996 642.597 66.3996C621.797 66.3996 609.597 73.3996 609.597 93.7996Z" fill="currentColor" />
      <path d="M509.173 151C481.173 151 467.573 132.4 467.573 109.4V60.2996C467.573 54.3902 472.364 49.5996 478.273 49.5996C484.183 49.5996 488.973 54.3902 488.973 60.2996V103.6C488.973 122.2 497.573 131.6 518.573 131.6C540.573 131.6 550.773 120.4 550.773 98.7996V60.2996C550.773 54.3902 555.564 49.5996 561.473 49.5996C567.383 49.5996 572.173 54.3902 572.173 60.2996V139.1C572.173 144.567 567.741 149 562.273 149C556.806 149 552.373 144.567 552.373 139.1V118.2H551.173C547.973 135 534.773 151 509.173 151Z" fill="currentColor" />
      <path d="M447.772 138.2C447.772 144.165 442.937 149 436.972 149C431.007 149 426.172 144.165 426.172 138.2V25.8C426.172 19.8353 431.007 15 436.972 15C442.937 15 447.772 19.8353 447.772 25.8V138.2Z" fill="currentColor" />
      <path d="M321.6 172.2C321.6 178.164 316.765 183 310.8 183C304.835 183 300 178.164 300 172.2V59.4996C300 54.032 304.432 49.5996 309.9 49.5996C315.368 49.5996 319.8 54.032 319.8 59.4996V77.1996H321.6C325.6 58.7996 339.6 47.5996 363 47.5996C393.8 47.5996 411.2 68.5996 411.2 99.3996C411.2 130.2 394.2 151 363.2 151C340.8 151 326.4 139.2 322.4 121H321.6V172.2ZM321.6 101C321.6 121.4 334.6 131.4 355.8 131.4C377.2 131.4 389.6 123.2 389.6 99.3996C389.6 75.3996 377 67.3996 356.2 67.3996C334 67.3996 321.6 77.7996 321.6 99.1996V101Z" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Type bits */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold', className)}>
      <span className="h-px w-5 bg-gold/50" />
      {children}
    </span>
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('block text-[11px] font-bold uppercase tracking-[0.14em] text-slate', className)}>{children}</span>
  );
}

/* ------------------------------------------------------------------ Surface */

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[22px] bg-white border border-midnight/[0.06] demo-card-shadow', className)}>{children}</div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-midnight/[0.07]', className)} />;
}

/* ------------------------------------------------------------------- Money */

export function Money({
  amount,
  size = 'lg',
  className,
}: {
  amount: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const n = Number(amount || 0).toLocaleString('en-NG');
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-[3.25rem] leading-[1.05]',
  };
  return (
    <span className={cn('font-display tnum text-midnight inline-flex items-start', sizes[size], className)}>
      <span className="text-gold/90 mr-0.5">₦</span>
      {n}
    </span>
  );
}

/* ------------------------------------------------------------------ Buttons */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function PrimaryButton({ children, className, loading, disabled, ...props }: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2 rounded-pill bg-midnight text-white font-bold py-4 px-6',
        'transition-all hover:bg-deep-blue active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none',
        'shadow-[0_10px_24px_-12px_rgba(15,31,61,0.55)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GoldButton({ children, className, loading, disabled, ...props }: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-midnight font-bold py-4 px-6',
        'transition-all hover:bg-gold-light active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none',
        'shadow-[0_10px_24px_-12px_rgba(232,160,32,0.7)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('w-full text-center text-sm font-semibold text-slate hover:text-midnight transition-colors py-2', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- Inputs */

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl bg-white border border-midnight/10 px-4 py-3.5 text-midnight',
        'placeholder:text-slate/50 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-shadow',
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-2xl bg-white border border-midnight/10 px-4 py-3.5 text-midnight resize-none',
        'placeholder:text-slate/50 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-shadow',
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------- Status chip */

const STATUS_TONE: Record<string, string> = {
  requested: 'bg-slate/12 text-slate',
  paid_escrow: 'bg-gold/15 text-[#8a5a08]',
  escrow_funded: 'bg-gold/15 text-[#8a5a08]',
  plug_accepted: 'bg-steel-blue/20 text-midnight',
  quoted: 'bg-steel-blue/20 text-midnight',
  client_accepted: 'bg-steel-blue/20 text-midnight',
  plug_declined: 'bg-red-100 text-red-700',
  client_declined_quote: 'bg-red-100 text-red-700',
  cancelled: 'bg-midnight/10 text-slate',
  accepted: 'bg-gold/15 text-[#8a5a08]',
  completed: 'bg-gold/15 text-[#8a5a08]',
  released: 'bg-emerald-500/12 text-emerald-700',
  withdrawn: 'bg-emerald-500/12 text-emerald-700',
  pending: 'bg-gold/15 text-[#8a5a08]',
  successful: 'bg-emerald-500/12 text-emerald-700',
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em]',
        STATUS_TONE[status] ?? 'bg-slate/12 text-slate',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status.replace('_', ' ')}
    </span>
  );
}

/* --------------------------------------------------------------- Status rail
 * The signature element: a vertical spine showing where the money is in the
 * escrow lifecycle. Encodes real state, not decoration.
 */

export type RailStep = { key: string; label: string; sub?: string | null };

export function StatusRail({ steps, activeIndex }: { steps: RailStep[]; activeIndex: number }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={s.key} className="flex gap-3.5 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'relative z-10 grid place-items-center h-5 w-5 rounded-full border-2 transition-colors',
                  done && 'bg-gold border-gold',
                  active && 'border-gold bg-bone',
                  !done && !active && 'border-midnight/15 bg-bone'
                )}
              >
                {done && <span className="h-1.5 w-1.5 rounded-full bg-midnight" />}
                {active && <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />}
              </span>
              {i < steps.length - 1 && (
                <span className={cn('w-0.5 flex-1 -mt-0.5', done ? 'bg-gold/60' : 'bg-midnight/10')} />
              )}
            </div>
            <div className="-mt-0.5 pb-1">
              <p className={cn('text-sm font-semibold', done || active ? 'text-midnight' : 'text-slate')}>{s.label}</p>
              {s.sub && <p className="text-xs text-slate mt-0.5">{s.sub}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
