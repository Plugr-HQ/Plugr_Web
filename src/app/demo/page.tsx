// src/app/demo/page.tsx
// Role select — the fork reached from the landing's "Use Plugr". Two paths:
//   Book a Plug   -> browse (client)
//   Become a Plug -> plug sign-up
// No role toggle / phone here anymore; the auth screens collect sign-up details.

'use client';

import Link from 'next/link';
import { User, Wrench, ArrowRight } from 'lucide-react';
import { PlugrWordmark, Eyebrow } from './_components/ui';
import { Splash, useSplash } from '@/src/components/Splash';

export default function RoleSelectPage() {
  const splashDone = useSplash();

  return (
    <>
    <Splash done={splashDone} />
    <main className="min-h-screen bg-bone text-midnight font-body antialiased flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen flex flex-col px-6 pt-14 pb-10">
        <Link href="/" className="demo-rise">
          <PlugrWordmark className="h-8 text-midnight" />
        </Link>

        <div className="mt-14 demo-rise demo-rise-1">
          <Eyebrow>Get started</Eyebrow>
          <h1 className="mt-4 font-display text-[2.5rem] leading-[1.06] text-midnight">
            How do you want
            <br /> to use <span className="text-gold">Plugr?</span>
          </h1>
        </div>

        <div className="mt-10 space-y-4">
          <RoleTile
            href="/demo/browse"
            icon={<User className="w-6 h-6" />}
            title="Book a Plug"
            body="Hire a verified electrician or plumber and pay safely into escrow."
            className="demo-rise demo-rise-2"
          />
          <RoleTile
            href="/demo/auth/phone"
            icon={<Wrench className="w-6 h-6" />}
            title="Become a Plug"
            body="Get verified, build your identity, and get paid for great work."
            className="demo-rise demo-rise-3"
          />
        </div>

        <p className="mt-auto pt-10 text-xs text-slate/70 text-center demo-rise demo-rise-4">
          Escrow payments powered by ALATPay.
        </p>
      </div>
    </main>
    </>
  );
}

function RoleTile({
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
      className={
        'group flex items-center gap-4 rounded-[22px] bg-white border border-midnight/[0.06] demo-card-shadow p-5 hover:border-gold/40 transition-all ' +
        (className ?? '')
      }
    >
      <span className="grid place-items-center h-12 w-12 rounded-2xl bg-midnight text-gold shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-midnight">{title}</span>
        <span className="block text-[13px] text-slate leading-snug mt-0.5">{body}</span>
      </span>
      <ArrowRight className="w-5 h-5 text-slate/50 group-hover:text-gold transition-colors shrink-0" />
    </Link>
  );
}
