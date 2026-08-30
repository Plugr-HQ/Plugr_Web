// src/components/PlugAvatar.tsx
// One avatar for every surface that shows a Plug.
//
// The rule, taken from the public Digital ID at /p/[id] which was the only surface implementing
// it correctly: if the Plug has a photo, show the photo. Initials are the fallback for a Plug who
// genuinely has none — never the default.
//
// This exists because the same three lines were written five times and only two of them checked
// photoUrl at all. The browse listing, the booking summary, the shareable Digital ID card and the
// admin verification queue all rendered a coloured square with a letter in it no matter what the
// Plug had uploaded — including on the screen where ops decide whether the person is who they say
// they are. Anything showing a Plug should use this, so the rule can only be wrong in one place.

import { cn } from '@/src/lib/utils';

type Tone = 'midnight' | 'gold' | 'bone';

const TONES: Record<Tone, string> = {
  midnight: 'bg-midnight text-white',
  gold: 'bg-gold text-midnight',
  bone: 'bg-midnight/[0.05] text-midnight',
};

export function PlugAvatar({
  name,
  photoUrl,
  className,
  tone = 'midnight',
  rounded = 'rounded-2xl',
}: {
  name?: string | null;
  /** The Plug's stored photo. Null/empty falls back to their initial. */
  photoUrl?: string | null;
  /** Sizing — pass the h-/w- utilities for the surface. */
  className?: string;
  tone?: Tone;
  rounded?: string;
}) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name ? `${name}'s profile photo` : 'Plug profile photo'}
        className={cn('shrink-0 object-cover', rounded, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center font-display', rounded, TONES[tone], className)}
    >
      {initial}
    </span>
  );
}
