// src/app/app/_components/RequestPlugButton.tsx
// "Request this Plug" / "Book me on Plugr" — the single entry point for the booking action, on the
// browse cards, the in-app profile and the shared Digital ID at /p/[id].
//
// GATED for the Sept 1 launch, which is Plug-facing only. This button used to hand off to WhatsApp:
// a known client went straight to wa.me with a pre-filled request, and an unknown one was sent
// through /app/request/[plugId] to collect their details and then handed off. Both paths ended in a
// conversation the bot cannot yet handle, which meant a client — possibly one with an emergency —
// was left waiting on a reply that was never coming.
//
// The click now opens RequestPlugModal and goes nowhere near wa.me. Nothing else about how Plugs are
// displayed, browsed or shared has changed; only this action is gated.
//
// The WhatsApp builder (src/lib/whatsappLink.ts) and the intake route are intentionally left in
// place, unreferenced by this component, so restoring the hand-off when booking goes live is a
// matter of putting the call back rather than rebuilding the flow.

'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import { cn } from '@/src/lib/utils';
import { RequestPlugModal } from './RequestPlugModal';

export function RequestPlugButton({
  plugId,
  plugName,
  plugTrade: _plugTrade,
  compact = false,
  className,
  label = 'Request this Plug',
  afterIntake: _afterIntake,
}: {
  plugId: string;
  plugName?: string | null;
  /** Unused while booking is gated — kept so call sites don't churn when the hand-off returns. */
  plugTrade?: string | null;
  compact?: boolean;
  className?: string;
  label?: string;
  /** Unused while booking is gated (see above). */
  afterIntake?: 'whatsapp' | 'profile';
}) {
  const [open, setOpen] = useState(false);

  function go(e: React.MouseEvent) {
    // These buttons sit inside a card that is itself a link to the profile — without this, a tap
    // would both open the modal and navigate away from it.
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={go}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-pitch-black font-bold hover:bg-gold-light active:scale-[0.98] transition-all',
          compact ? 'px-4 py-2 text-[13px]' : 'w-full py-4 px-6',
          className
        )}
      >
        <FaWhatsapp className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
        {label}
      </button>

      {open && (
        <RequestPlugModal plugId={plugId} plugName={plugName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
