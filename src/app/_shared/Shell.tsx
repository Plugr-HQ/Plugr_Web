// src/app/_shared/Shell.tsx
// Mobile-width premium shell shared by every demo/app screen. Bone light-mode canvas,
// centered column, brand mark + eyebrow/title header, and an optional sticky footer.
//
// Back button uses real browser history (router.back) so it always returns to wherever you
// actually came from. The `back` prop is only a fallback for direct loads (no history).

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PlugrMark, Eyebrow } from './ui';

export function Shell({
  eyebrow,
  title,
  subtitle,
  back,
  onBack,
  mark = true,
  children,
  footer,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: string;
  /** Overrides history-back — e.g. to step backwards inside a multi-step screen. */
  onBack?: () => void;
  mark?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();

  function goBack() {
    if (onBack) return onBack();
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(back || '/');
  }

  return (
    <main className="min-h-screen bg-bone text-midnight font-body antialiased flex justify-center">
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col">
        <div className="flex-1 px-5 pt-6 pb-32">
          {(back || onBack || mark || title || eyebrow) && (
            <header className="mb-7">
              <div className="flex items-center justify-between mb-6 min-h-[22px]">
                {back || onBack ? (
                  <button
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-midnight transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <span />
                )}
                {mark && (
                  <Link
                    href="/"
                    aria-label="Plugr home"
                    className="rounded-md p-1 -m-1 transition-opacity hover:opacity-70 active:opacity-50"
                  >
                    <PlugrMark className="w-[18px] h-[18px] text-midnight/75" />
                  </Link>
                )}
              </div>

              {eyebrow && (
                <div className="mb-3 demo-rise">
                  <Eyebrow>{eyebrow}</Eyebrow>
                </div>
              )}
              {title && (
                <h1 className="font-display text-[2rem] leading-[1.1] text-midnight demo-rise demo-rise-1">{title}</h1>
              )}
              {subtitle && <p className="mt-2.5 text-sm text-slate demo-rise demo-rise-2">{subtitle}</p>}
            </header>
          )}

          <div className="demo-rise demo-rise-3">{children}</div>
        </div>

        {footer && (
          <div className="sticky bottom-0 z-20">
            <div className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-bone to-transparent" />
            <div className="relative bg-bone/92 backdrop-blur px-5 pb-6 pt-3 border-t border-midnight/[0.06]">{footer}</div>
          </div>
        )}
      </div>
    </main>
  );
}
