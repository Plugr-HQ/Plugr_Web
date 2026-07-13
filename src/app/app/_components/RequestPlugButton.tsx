// src/app/app/_components/RequestPlugButton.tsx
// A "Request this Plug" button that always leads to the actual job-request form — asking
// for sign-up first only if the client isn't signed in yet. Once signed in, it remembers
// and routes straight to booking.

'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import { getDemoIdentity } from '@/src/app/demo/_lib/demo';

export function RequestPlugButton({
  plugId,
  compact = false,
  className,
  label = 'Request this Plug',
}: {
  plugId: string;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { role, name } = getDemoIdentity();
    const signedInAsClient = role === 'client' && !!name;
    router.push(signedInAsClient ? `/app/book/${plugId}` : `/app/auth/client/${plugId}`);
  }

  return (
    <button
      onClick={go}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-pill bg-gold text-midnight font-bold hover:bg-gold-light active:scale-[0.98] transition-all',
        compact ? 'px-4 py-2 text-[13px]' : 'w-full py-4 px-6',
        className
      )}
    >
      {label}
    </button>
  );
}
