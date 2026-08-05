// src/components/plug/OnboardingProfileScreen.tsx
// PLG-ON-01 — Plug Profile Setup. Four steps: name -> trade -> location -> photo.
// Progress is saved to the draft at each step, so a Plug who drops off resumes here.
//
// Shared by /app and /demo — `base` keeps links inside the right namespace.

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Droplet, Hammer, Camera, Check, MapPin } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Label, TextInput, GoldButton } from '@/src/app/demo/_components/ui';
import { cn } from '@/src/lib/utils';
import { getPlugDraft, savePlugDraft, type PlugTrade } from '@/src/app/app/_lib/plugAuth';
import { LocationInput } from '@/src/components/LocationInput';

const TRADES: { value: PlugTrade; label: string; icon: React.ReactNode; blurb: string }[] = [
  { value: 'electrician', label: 'Electrician', icon: <Zap className="w-5 h-5" />, blurb: 'Wiring, sockets, faults, lighting' },
  { value: 'plumber', label: 'Plumber', icon: <Droplet className="w-5 h-5" />, blurb: 'Pipes, leaks, fixtures, drainage' },
  { value: 'furniture', label: 'Furniture', icon: <Hammer className="w-5 h-5" />, blurb: 'Cabinets, wardrobes, repairs' },
];

const MIN_PX = 400; // minimum source resolution we ask for

/** Downscale to a square-ish 320px JPEG data URL so the photo can live on the profile. */
function fileToDataUrl(file: File): Promise<{ url: string; tooSmall: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file isn’t a valid image.'));
      img.onload = () => {
        const tooSmall = Math.min(img.width, img.height) < MIN_PX;
        const size = 320;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // center-crop to a square, then scale
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve({ url: canvas.toDataURL('image/jpeg', 0.82), tooSmall });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function OnboardingProfileScreen({ base }: { base: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [trade, setTrade] = useState<PlugTrade | ''>('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string>('');
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // resume where they left off
  useEffect(() => {
    const d = getPlugDraft();
    if (d.firstName) setFirstName(d.firstName);
    if (d.lastName) setLastName(d.lastName);
    if (d.trade) setTrade(d.trade);
    if (d.photo) setPhoto(d.photo);
    if (d.address) setAddress(d.address as string);
    if (typeof d.latitude === 'number') setLatitude(d.latitude);
    if (typeof d.longitude === 'number') setLongitude(d.longitude);
    if (typeof d.step === 'number') setStep(Math.min(d.step, 3));
  }, []);

  const canContinue =
    step === 0
      ? firstName.trim().length > 1 && lastName.trim().length > 1
      : step === 1
      ? !!trade
      : step === 2
      ? !!latitude && !!longitude
      : !!photo;

  function next() {
    if (!canContinue) return;
    if (step === 0) savePlugDraft({ firstName: firstName.trim(), lastName: lastName.trim(), step: 1 });
    if (step === 1) savePlugDraft({ trade: trade as PlugTrade, step: 2 });
    if (step === 2) savePlugDraft({ address, latitude, longitude, step: 3 });
    if (step === 3) {
      savePlugDraft({ photo, step: 4 });
      router.push(`${base}/onboarding/verify`);
      return;
    }
    setStep((s) => s + 1);
  }

  async function onPick(file?: File) {
    if (!file) return;
    setError(null);
    setWarn(null);
    try {
      const { url, tooSmall } = await fileToDataUrl(file);
      setPhoto(url);
      savePlugDraft({ photo: url });
      if (tooSmall) setWarn(`That image is a little small — ${MIN_PX}px or larger looks sharpest.`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not use that image.');
    }
  }

  return (
    <Shell
      eyebrow="Become a Plug"
      title={
        step === 0
          ? 'What’s your name?'
          : step === 1
          ? 'What do you do?'
          : step === 2
          ? 'Where are you based?'
          : 'Add your photo'
      }
      subtitle={
        step === 0
          ? 'This is the name clients will see.'
          : step === 1
          ? 'Pick the trade you want jobs for.'
          : step === 2
          ? 'Clients match with Plugs nearby.'
          : 'Clients trust a face. This is the front of your identity.'
      }
      back={base}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      footer={
        <GoldButton onClick={next} disabled={!canContinue}>
          {step === 3 ? 'Continue to verification' : 'Continue'} <ArrowRight className="w-4 h-4" />
        </GoldButton>
      }
    >
      {/* Progress — 4 steps */}
      <div className="flex gap-1.5 mb-8" aria-label={`Step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-pill transition-colors', i <= step ? 'bg-gold' : 'bg-midnight/10')}
          />
        ))}
      </div>

      {/* Step 1 — Name */}
      {step === 0 && (
        <div className="space-y-5 demo-rise">
          <div>
            <Label className="mb-2">First name</Label>
            <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Emeka" autoFocus />
          </div>
          <div>
            <Label className="mb-2">Last name</Label>
            <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nwosu" />
          </div>
        </div>
      )}

      {/* Step 2 — Trade */}
      {step === 1 && (
        <div className="space-y-3 demo-rise" role="radiogroup" aria-label="Trade">
          {TRADES.map((t) => {
            const active = trade === t.value;
            return (
              <button
                key={t.value}
                role="radio"
                aria-checked={active}
                onClick={() => setTrade(t.value)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-[22px] border bg-white p-4 text-left transition-colors',
                  active ? 'border-gold' : 'border-midnight/6 hover:border-midnight/20'
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center h-11 w-11 rounded-2xl shrink-0',
                    active ? 'bg-gold text-midnight' : 'bg-midnight text-gold'
                  )}
                >
                  {t.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-midnight">{t.label}</span>
                  <span className="block text-[13px] text-slate">{t.blurb}</span>
                </span>
                <span
                  className={cn(
                    'grid place-items-center h-5 w-5 rounded-full border-2 shrink-0',
                    active ? 'border-gold bg-gold' : 'border-midnight/20'
                  )}
                >
                  {active && <Check className="w-3 h-3 text-midnight" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 3 — Location */}
      {step === 2 && (
        <div className="space-y-4 demo-rise">
          <LocationInput
            onLocationSelect={(loc) => {
              setAddress(loc.address);
              setLatitude(loc.latitude);
              setLongitude(loc.longitude);
              savePlugDraft({
                address: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude,
              });
            }}
          />

          {latitude && longitude && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs font-medium">
              <MapPin className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Photo */}
      {step === 3 && (
        <div className="demo-rise flex flex-col items-center">
          <button
            onClick={() => fileRef.current?.click()}
            className="group relative grid place-items-center h-40 w-40 rounded-full border-2 border-dashed border-midnight/15 bg-white overflow-hidden hover:border-gold transition-colors"
            aria-label="Upload profile photo"
          >
            {photo ? (
              <img src={photo} alt="Your profile photo" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-slate group-hover:text-gold transition-colors">
                <Camera className="w-7 h-7" />
                <span className="text-xs font-bold">Add photo</span>
              </span>
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          {photo && (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 text-sm font-bold text-midnight underline underline-offset-4 hover:text-gold transition-colors"
            >
              Change photo
            </button>
          )}

          {warn && <p className="mt-4 text-center text-xs text-[#8a5a08]">{warn}</p>}
          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          {!photo && !error && (
            <p className="mt-5 text-center text-xs text-slate/80">
              Camera or gallery. Face clearly visible, {MIN_PX}px or larger.
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}