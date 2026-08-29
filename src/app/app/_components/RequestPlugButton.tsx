// src/app/app/_components/RequestPlugButton.tsx
// "Request this Plug" / "Book me on Plugr" — the single entry into the WhatsApp hand-off.
//
// Two things happen behind this button, decided by whether we already know the client:
//
//   KNOWN client   -> straight to WhatsApp, pre-filled with the Plug's context (and their own
//                     name). No form, no interruption.
//   UNKNOWN client -> the one-time intake form first (/app/request/[plugId]), carrying the Plug
//                     context through so nothing is lost across the hop.
//
// Where the form lands afterwards depends on where the client started, which is what `afterIntake`
// controls:
//   'whatsapp' (default, used by browse/listing cards) — submit goes straight on to WhatsApp,
//               because the client already chose this Plug and asked to be connected.
//   'profile'   (used by the shared Digital ID at /p/[id]) — submit returns to the profile they
//               were sent, because they arrived on a link and haven't necessarily decided yet.
//               Tapping the button again from there is a KNOWN client, so it goes straight to
//               WhatsApp with no second form.
//
// The URL itself is built in src/lib/whatsappLink.ts — the same builder the post-intake hand-off
// uses, so there is exactly one version of this message in the codebase.

'use client';

import { useRouter } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa6';
import { cn } from '@/src/lib/utils';
import { getClientIdentity } from '@/src/lib/clientIdentity';
import { openRequestPlugWhatsApp } from '@/src/lib/whatsappLink';

export function RequestPlugButton({
  plugId,
  plugName,
  plugTrade,
  compact = false,
  className,
  label = 'Request this Plug',
  afterIntake = 'whatsapp',
}: {
  plugId: string;
  plugName?: string | null;
  plugTrade?: string | null;
  compact?: boolean;
  className?: string;
  label?: string;
  /** Where the intake form sends a NEW client on submit. Ignored for a known client. */
  afterIntake?: 'whatsapp' | 'profile';
}) {
  const router = useRouter();

  function go(e: React.MouseEvent) {
    // These buttons sit inside a card that is itself a link to the profile — without this, a tap
    // would both open WhatsApp and navigate.
    e.preventDefault();
    e.stopPropagation();

    const client = getClientIdentity();

    if (client) {
      openRequestPlugWhatsApp({ plugId, plugName, plugTrade }, client.name);
      return;
    }

    // Unknown client: intake first. The Plug's name/trade ride along in the query so the form can
    // say who is being requested, and so the hand-off message is identical either way — the form
    // never has to re-fetch the Plug just to build the message.
    const params = new URLSearchParams({ after: afterIntake });
    if (plugName) params.set('name', plugName);
    if (plugTrade) params.set('trade', plugTrade);
    router.push(`/app/request/${encodeURIComponent(plugId)}?${params.toString()}`);
  }

  return (
    <button
      onClick={go}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-midnight font-bold hover:bg-gold-light active:scale-[0.98] transition-all',
        compact ? 'px-4 py-2 text-[13px]' : 'w-full py-4 px-6',
        className
      )}
    >
      <FaWhatsapp className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
      {label}
    </button>
  );
}
