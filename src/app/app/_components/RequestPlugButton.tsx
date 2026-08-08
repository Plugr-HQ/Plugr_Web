// src/app/app/_components/RequestPlugButton.tsx
// "Request this Plug" — opens the Plugr WhatsApp bot with a pre-filled message. Client
// (non-Plug) onboarding + the actual job request happen inside that WhatsApp conversation,
// so this hands off to the bot rather than routing into an in-app booking form.

'use client';

import { FaWhatsapp } from 'react-icons/fa6';
import { cn } from '@/src/lib/utils';

// Public bot number (same convention as the job-create proxy). Client-side, so it must be a
// NEXT_PUBLIC_ var to be readable in the browser.
const WA_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '2349119253019';

export function RequestPlugButton({
  plugId,
  plugName,
  plugTrade,
  compact = false,
  className,
  label = 'Request this Plug',
}: {
  plugId: string;
  plugName?: string | null;
  plugTrade?: string | null;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const who = plugName ? `${plugName}${plugTrade ? ` (${plugTrade})` : ''}` : 'a Plug';
    const message =
      `Hi Plugr 👋 I'd like to request ${who} for a job.\n` +
      `Plug ref: ${plugId.slice(-6)}`;

    const url = `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(message)}`;
    // Open the WhatsApp bot (app on mobile, web.whatsapp on desktop).
    window.open(url, '_blank', 'noopener,noreferrer');
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
