// src/app/app/page.tsx
// AUTH-01 — Splash + Role Select. The entry reached from the landing's "Use Plugr".
// Splash (Pitch Black, loading bar) auto-fades to the role select on the same route.
//
// Two paths, disconnected after this point:
//   Book a Plug   -> client flow (browse -> book -> pay -> confirm -> receipt)
//   Become a Plug -> plug flow (single-page signup -> dashboard, verify identity after)

'use client';

import Link from 'next/link';
import { User, Wrench, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PlugrWordmark, Eyebrow } from '@/src/components/ui';
import { Splash, useSplash } from '@/src/components/Splash';
import { usePlugEntryRedirect } from '@/src/app/app/_lib/entryRouting';

export default function AppRoleSelect() {
  const splashDone = useSplash();
  // A Plug who already onboarded shouldn't be asked how they want to use Plugr again.
  // Not strict: someone mid-onboarding still gets the choice, so they aren't locked
  // out of the client side.
  const checking = usePlugEntryRedirect('/app', false);

  // The splash already covers this beat, so a returning Plug sees it and lands on their
  // dashboard — no flash of the role picker.
  if (checking) return <Splash done={false} />;

  return (
    <>
      <Splash done={splashDone} />

      <main className="min-h-screen bg-bone text-pitch-black font-body antialiased flex justify-center">
        <div className="w-full max-w-110 min-h-screen flex flex-col px-6 pt-14 pb-10">
          <a href="/" className="rise">
            <PlugrWordmark className="h-8 text-pitch-black" />
          </a>

          <div className="mt-14 rise rise-1">
            <Eyebrow>Get started</Eyebrow>
            <h1 className="mt-4 font-display text-[2.5rem] leading-[1.06] text-pitch-black">
              How do you want
              <br /> to use <span className="text-gold">Plugr?</span>
            </h1>
          </div>

          <div className="mt-10 space-y-4">
            <Tile
              href="/app/browse"
              icon={<User className="w-6 h-6" />}
              title="Book a Plug"
              body="Hire a verified electrician, plumber, or furniture maker and pay safely into escrow."
              className="rise rise-2"
            />
            <Tile
              href="/app/signup"
              icon={<Wrench className="w-6 h-6" />}
              title="Become a Plug"
              body="Get verified, build your profile, and get paid for great work."
              className="rise rise-3"
            />
            <p className="text-slate/70 text-center">
               Already have an account? <Link href="/app/auth/login" className="text-gold">Login</Link>
            </p>
          </div>

          <p className="mt-auto pt-10 text-xs text-slate/70 text-center rise rise-4">
            Escrow payments powered by Alatpay.
          </p>
        </div>
      </main>
    </>
)}

function Tile({
  href,
  icon,
  title,
  body,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-[22px] bg-white border border-pitch-black/6 card-shadow p-5 hover:border-gold/40 transition-all',
        className
      )}
    >
      <span className="grid place-items-center h-12 w-12 rounded-2xl bg-pitch-black text-gold shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-pitch-black">{title}</span>
        <span className="block text-[13px] text-slate leading-snug mt-0.5">{body}</span>
      </span>
      <ArrowRight className="w-5 h-5 text-slate/50 group-hover:text-gold transition-colors shrink-0" />
    </Link>
  );
}
