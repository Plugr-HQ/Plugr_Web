// src/app/app/onboarding/page.tsx
// Plug onboarding — feels like real KYC for the demo. Steps: details -> NIN (any 11 digits
// accepted for now; real NIMC verification plugs in later) -> profile photo -> done.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ShieldCheck, Camera, Loader2, BadgeCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Label, TextInput, PrimaryButton } from '@/src/app/demo/_components/ui';
import { setDemoIdentity } from '@/src/app/demo/_lib/demo';

const TRADES = ['electrician', 'plumber', 'furniture'] as const;

export default function PlugOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 details, 1 nin, 2 photo, 3 done
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState<(typeof TRADES)[number]>('electrician');
  const [nin, setNin] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function next() {
    setError(null);
    if (step === 0) {
      if (!name.trim() || !phone.trim()) return setError('Enter your name and phone number.');
      setStep(1);
    } else if (step === 1) {
      if (!/^\d{11}$/.test(nin.trim())) return setError('Enter a valid 11-digit NIN.');
      // Simulate a verification call (real NIMC service plugs in here later).
      setVerifying(true);
      setTimeout(() => { setVerifying(false); setStep(2); }, 1200);
    } else if (step === 2) {
      if (!photo) return setError('Add a profile photo.');
      setDemoIdentity('plug', phone.trim(), name.trim());
      setStep(3);
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhoto(URL.createObjectURL(f));
  }

  const titles = ['Your details', 'Verify your identity', 'Add a profile photo', 'You’re verified'];
  const eyebrows = ['Become a Plug · 1 of 3', 'Become a Plug · 2 of 3', 'Become a Plug · 3 of 3', 'Welcome to Plugr'];

  return (
    <Shell
      eyebrow={eyebrows[step]}
      title={titles[step]}
      back={step === 0 ? '/' : undefined}
      footer={
        step < 3 ? (
          <PrimaryButton onClick={next} loading={verifying}>
            {verifying ? 'Verifying with NIMC…' : step === 2 ? 'Finish & get verified' : 'Continue'}
            {!verifying && <ArrowRight className="w-4 h-4" />}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => router.push('/app/plug')}>Go to my dashboard <ArrowRight className="w-4 h-4" /></PrimaryButton>
        )
      }
    >
      {/* progress */}
      {step < 3 && (
        <div className="flex gap-1.5 mb-8">
          {[0, 1, 2].map((s) => (
            <span key={s} className={cn('h-1.5 flex-1 rounded-full transition-colors', s <= step ? 'bg-gold' : 'bg-midnight/10')} />
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-5">
          <div><Label className="mb-2">Full name</Label><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Musa Ibrahim" autoFocus /></div>
          <div><Label className="mb-2">Phone number</Label><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0801 234 5678" /></div>
          <div>
            <Label className="mb-2">Your trade</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRADES.map((t) => (
                <button key={t} onClick={() => setTrade(t)} className={cn('rounded-2xl border py-3 text-[13px] font-bold capitalize transition-all', trade === t ? 'bg-white border-gold ring-4 ring-gold/10 text-midnight' : 'bg-white/50 border-midnight/10 text-slate')}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-white border border-midnight/[0.06] p-4 mb-6 demo-card-shadow">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-emerald-500/12 shrink-0"><ShieldCheck className="w-5 h-5 text-emerald-600" /></span>
            <p className="text-[13px] leading-relaxed text-slate">We verify every Plug's National Identity Number so clients can trust who they're hiring. <span className="text-midnight font-semibold">Your NIN is never shown publicly.</span></p>
          </div>
          <Label className="mb-2">National Identity Number (NIN)</Label>
          <TextInput value={nin} onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))} inputMode="numeric" placeholder="12345678901" className="font-display text-xl tnum tracking-wide" autoFocus />
          <p className="mt-2 text-xs text-slate/70">11 digits. Verification is stubbed for the demo — any 11-digit number is accepted.</p>
        </>
      )}

      {step === 2 && (
        <div className="text-center">
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <div className={cn('mx-auto grid place-items-center h-40 w-40 rounded-full border-2 border-dashed transition-colors overflow-hidden', photo ? 'border-gold' : 'border-midnight/20 hover:border-gold')}>
              {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : (
                <span className="text-center text-slate"><Camera className="w-8 h-8 mx-auto mb-2" /><span className="text-xs font-semibold">Tap to upload</span></span>
              )}
            </div>
          </label>
          <p className="mt-5 text-sm text-slate">A clear photo helps clients recognise you. <br />(Liveness check comes in the full app.)</p>
        </div>
      )}

      {step === 3 && (
        <Card className="p-7 text-center">
          <div className="relative inline-block mb-4">
            {photo ? <img src={photo} alt="You" className="h-20 w-20 rounded-3xl object-cover mx-auto" /> : <div className="h-20 w-20 rounded-3xl bg-gold text-midnight grid place-items-center font-display text-3xl mx-auto">{name[0]}</div>}
            <span className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-white"><BadgeCheck className="w-6 h-6 text-gold" /></span>
          </div>
          <h3 className="font-display text-2xl text-midnight">You’re verified, {name.split(' ')[0]}!</h3>
          <p className="mt-2 text-sm text-slate leading-relaxed">Your <span className="capitalize font-semibold text-midnight">{trade}</span> profile is live. Clients can now find and request you — and pay safely into escrow.</p>
          <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check className="w-4 h-4" strokeWidth={3} /> NIN verified · Profile created</div>
        </Card>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </Shell>
  );
}
