// src/app/p/[id]/page.tsx
// The public, shareable Plug profile — the page behind a Plug's QR / share link.
//
// A SERVER component on purpose: this URL's whole job is to be pasted into WhatsApp, so it has to
// render a real link preview (generateMetadata below). The previous version was a client component
// that read `localStorage.getItem('plugProfile')` and ignored the [id] entirely — meaning a shared
// link showed the VIEWER's own onboarding draft, or a hardcoded fake person, never the Plug who
// shared it. Data now comes from the real M1 backend's public profile endpoint.
//
// Deliberately absent: ratings, review counts and jobs-completed. Every Plug at launch has zero
// history, and a "0 jobs / no reviews" panel reads worse than no panel at all. The previous version
// showed a hardcoded 4.9 with two invented reviews and a fabricated "Skills Assessed" credential;
// none of that was real.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { RequestPlugButton } from '@/src/app/app/_components/RequestPlugButton';
import { plugHandle } from '@/src/lib/plugHandle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type PublicPlug = {
  id: string;
  name: string;
  trade: string | null;
  trade_label: string | null;
  service_area: string | null;
  photo_url: string | null;
  verified: boolean;
  bio: string | null;
};

/**
 * Fetch straight from the backend's public, unauthenticated endpoint rather than through our own
 * /api proxy — a server component calling back into its own route handler is a needless hop.
 */
async function getPlug(id: string): Promise<PublicPlug | null> {
  try {
    const res = await fetch(`${API_URL}/plugs/${encodeURIComponent(id)}/profile`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.plug ?? null) as PublicPlug | null;
  } catch {
    return null;
  }
}

function tradeOf(plug: PublicPlug): string {
  if (plug.trade_label) return plug.trade_label;
  if (!plug.trade) return 'Verified artisan';
  return plug.trade.charAt(0).toUpperCase() + plug.trade.slice(1);
}

/** Real link preview when the URL is pasted into WhatsApp — the point of a shareable profile. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plug = await getPlug(id);
  if (!plug) return { title: 'Plug not found · Plugr' };

  const trade = tradeOf(plug);
  const title = `${plug.name} — ${trade} on Plugr`;
  const description = plug.verified
    ? `${plug.name} is identity-verified via NIN on Plugr${plug.service_area ? `, serving ${plug.service_area}` : ''}. Book them on WhatsApp.`
    : `${plug.name} on Plugr${plug.service_area ? `, serving ${plug.service_area}` : ''}. Book them on WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: plug.photo_url ? [{ url: plug.photo_url }] : undefined,
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function PublicPlugProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plug = await getPlug(id);
  if (!plug) notFound();

  const trade = tradeOf(plug);
  const handle = plugHandle(plug.id);
  const initial = (plug.name?.trim()?.[0] ?? 'P').toUpperCase();

  return (
    <div className="min-h-screen bg-bone text-midnight antialiased">
      {/* Branding — this page is often the first thing a client ever sees of Plugr. */}
      <header className="flex items-center justify-center border-b border-midnight/[0.06] bg-white/60 py-4">
        <PlugrWordmark className="h-6 text-midnight" />
      </header>

      <main className="mx-auto w-full max-w-xl px-6 pb-28 pt-8">
        <section className="flex flex-col items-center text-center">
          {/* Photo, prominent */}
          <div className="relative mb-5 h-32 w-32">
            <div className="h-full w-full overflow-hidden rounded-full bg-midnight shadow-sm ring-4 ring-white">
              {plug.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plug.photo_url} alt={plug.name} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-4xl text-gold">
                  {initial}
                </div>
              )}
            </div>
            {/* The seal only appears for a Plug who is actually verified — never decoration. */}
            {plug.verified && (
              <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-gold ring-4 ring-bone">
                <BadgeCheck className="h-5 w-5 text-midnight" strokeWidth={2.5} />
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl tracking-tight text-midnight">{plug.name}</h1>
          <p className="mt-1 text-base font-medium text-slate">{trade}</p>

          {plug.service_area && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {plug.service_area}
            </p>
          )}

          {/* The specific claim, not a generic tick — it says what was actually checked. */}
          {plug.verified && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-pill bg-[#E2F5EC] px-4 py-2 text-[13px] font-bold text-[#0D7A4A]">
              <BadgeCheck className="h-4 w-4" strokeWidth={2.5} />
              Identity Verified via NIN
            </span>
          )}

          <p className="mt-4 font-mono text-[11px] tracking-[0.12em] text-slate/50">{handle}</p>
        </section>

        {plug.bio && (
          <section className="mt-8 rounded-3xl border border-midnight/[0.06] bg-white p-6">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">About</h2>
            <p className="text-sm leading-relaxed text-midnight">{plug.bio}</p>
          </section>
        )}

        {/* Booking hands off to the WhatsApp bot, the same way every other "request a Plug"
            surface does — the message is pre-filled with who was found, so the conversation
            starts with context instead of a cold hello. */}
        <section className="mt-8">
          <RequestPlugButton
            plugId={plug.id}
            plugName={plug.name}
            plugTrade={trade}
            label="Book me on Plugr"
          />
          <p className="mt-3 text-center text-xs text-slate/70">
            Opens WhatsApp to book {plug.name.split(' ')[0]} through Plugr.
          </p>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-sm font-medium text-slate">
            Are you an artisan?{' '}
            <Link href="/become-a-plug" className="font-bold text-gold hover:underline">
              Become a Plug
            </Link>
          </p>
          <p className="mt-3 text-[11px] text-slate/60">
            Every Plug is identity-checked before they can take work on Plugr.
          </p>
        </footer>
      </main>
    </div>
  );
}
