// src/app/demo/page.tsx
// Screen 9 — Role select (entry point). Client / Plug toggle + phone field for flavor
// (not validated, not real auth). Routes into the client browse flow or the plug view.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Wrench, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { setDemoIdentity, type DemoRole } from './_lib/demo';
import { PlugrWordmark, Eyebrow, TextInput, Label, PrimaryButton } from './_components/ui';

export default function RoleSelectPage() {
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>('client');
  const [phone, setPhone] = useState('');

  function enter() {
    setDemoIdentity(role, phone || '0800 000 0000');
    router.push(role === 'client' ? '/demo/browse' : '/demo/plug');
  }

  return (
    <main className="min-h-screen bg-bone text-midnight font-body antialiased flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen flex flex-col px-6 pt-14 pb-8">
        <PlugrWordmark className="h-8 text-midnight demo-rise" />

        <div className="mt-14 demo-rise demo-rise-1">
          <Eyebrow>Escrow payments</Eyebrow>
          <h1 className="mt-4 font-display text-[2.5rem] leading-[1.06] text-midnight">
            Paid the moment
            <br /> the job is <span className="text-gold">done.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate max-w-[19rem]">
            Book a verified artisan, pay into escrow, release on completion. Real money movement, powered by ALATPay.
          </p>
        </div>

        <div className="mt-10 demo-rise demo-rise-2">
          <Label className="mb-3">Continue as</Label>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              active={role === 'client'}
              onClick={() => setRole('client')}
              icon={<User className="w-5 h-5" />}
              label="Client"
              hint="Book & pay"
            />
            <RoleCard
              active={role === 'plug'}
              onClick={() => setRole('plug')}
              icon={<Wrench className="w-5 h-5" />}
              label="Plug"
              hint="Get paid"
            />
          </div>
        </div>

        <div className="mt-6 demo-rise demo-rise-3">
          <Label className="mb-2">Phone number</Label>
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="0801 234 5678"
          />
          <p className="mt-2 text-xs text-slate/70">For flavor — not validated.</p>
        </div>

        <div className="mt-auto pt-10 demo-rise demo-rise-4">
          <PrimaryButton onClick={enter}>
            Continue as {role === 'client' ? 'Client' : 'Plug'}
            <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative text-left rounded-[20px] p-4 border transition-all',
        active
          ? 'bg-white border-gold ring-4 ring-gold/10 demo-card-shadow'
          : 'bg-white/40 border-midnight/10 hover:border-midnight/25'
      )}
    >
      <span
        className={cn(
          'grid place-items-center h-10 w-10 rounded-full mb-3 transition-colors',
          active ? 'bg-gold text-midnight' : 'bg-midnight/[0.06] text-midnight'
        )}
      >
        {icon}
      </span>
      <span className="block font-bold text-midnight">{label}</span>
      <span className="block text-xs text-slate">{hint}</span>
      {active && (
        <span className="absolute top-3 right-3 grid place-items-center h-5 w-5 rounded-full bg-gold text-midnight">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
