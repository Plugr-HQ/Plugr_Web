'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { PrimaryButton } from './ui';
import { isAgeBlocked, readAgeConfirmation, storeAgeBlocked, storeAgeConfirmation } from '@/src/lib/consent';

function AgeGateDialog({ open, onYes, onNo, onCancel }: { open: boolean; onYes: () => void; onNo: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the dialog.
    const buttons = Array.from(dialogRef.current?.querySelectorAll('button') ?? []);
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        onKeyDown={onKeyDown}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="age-gate-title" className="text-xl font-bold text-slate">
          Are you 18 or older?
        </h2>
        <p id="age-gate-desc" className="mt-2 text-sm text-slate/70">
          Plugr is for people 18 and over. We ask before we take your name or phone number.
        </p>
        <div className="mt-6 space-y-3">
          <PrimaryButton onClick={onYes}>Yes, I’m 18 or older</PrimaryButton>
          <button
            type="button"
            onClick={onNo}
            className="w-full rounded-xl border border-slate/20 px-4 py-3 text-sm font-semibold text-slate hover:bg-slate/5"
          >
            No, I’m under 18
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Run an action only once the person has confirmed they are 18 or older. Asked once per browser.
 * `ask(action)` runs it straight away if they already said yes, otherwise opens the dialog first.
 */
export function useAgeGate(opts: { onUnderage?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    if (isAgeBlocked()) setBlocked(true);
  }, []);

  function ask(action: () => void) {
    if (readAgeConfirmation()) return action();
    pending.current = action;
    setOpen(true);
  }

  function yes() {
    storeAgeConfirmation();
    setOpen(false);
    const run = pending.current;
    pending.current = null;
    run?.();
  }

  function no() {
    storeAgeBlocked();
    pending.current = null;
    setOpen(false);
    opts.onUnderage?.();
    setBlocked(true);
  }

  function cancel() {
    pending.current = null;
    setOpen(false);
  }

  const dialog = <AgeGateDialog open={open} onYes={yes} onNo={no} onCancel={cancel} />;
  return { ask, dialog, blocked };
}