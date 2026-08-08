// src/components/plug/OnboardingProfileScreen.tsx
// PLG-ON-01 — Plug Profile Setup.
// Six steps: name -> consent (optional) -> phone & WhatsApp OTP -> trade -> location -> photo.
//
// IMPORTANT: the consent step below does NOT block signup — a Plug can continue without
// ticking it. That means consentAgreed may be false by the time this draft reaches
// /onboarding/verify. Identity verification submits a NIN, which is sensitive data — the
// verify screen (or its API route) MUST check consentAgreed (or re-prompt) before accepting
// that submission. Do not treat "made it through onboarding" as implied consent.

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Zap, Droplet, Hammer, Camera, Check, MapPin, Phone, MessageSquare, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Label, TextInput, GoldButton } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/lib/api';
import {
  getPlugDraft,
  savePlugDraft,
  setPlugPhone,
  getPlugPhone,
  type PlugTrade,
} from '@/src/app/app/_lib/plugAuth';
import { LocationInput } from '@/src/components/LocationInput';

const TRADES: { value: PlugTrade; label: string; icon: React.ReactNode; blurb: string }[] = [
  { value: 'electrician', label: 'Electrician', icon: <Zap className="w-5 h-5" />, blurb: 'Wiring, sockets, faults, lighting' },
  { value: 'plumber', label: 'Plumber', icon: <Droplet className="w-5 h-5" />, blurb: 'Pipes, leaks, fixtures, drainage' },
  { value: 'furniture', label: 'Furniture', icon: <Hammer className="w-5 h-5" />, blurb: 'Cabinets, wardrobes, repairs' },
];

const MIN_PX = 400;

// Bump this whenever the consent copy on /consent changes — it's what gets stamped onto
// the draft (and eventually the ConsentRecord rows) so you can tell which version a Plug agreed to.
const CONSENT_DOC_VERSION = '2026-08-06';

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

/** Standardize input phone number to +234... format */
function formatNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

export function OnboardingProfileScreen({ base }: { base: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 0 - Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 1 - Consent
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Step 2 - Phone & OTP
  const [phone, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Step 3 - Trade
  const [trade, setTrade] = useState<PlugTrade | ''>('');

  // Step 4 - Location
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Step 5 - Photo
  const [photo, setPhoto] = useState<string>('');
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resume draft state
  useEffect(() => {
    const d = getPlugDraft();
    const existingPhone = getPlugPhone() || d.phone;
    if (d.firstName) setFirstName(d.firstName);
    if (d.lastName) setLastName(d.lastName);
    if (d.consentAgreed) setConsentAgreed(true);
    if (existingPhone) {
      setPhoneInput(existingPhone);
      setOtpVerified(true); // if returning with saved draft phone
    }
    if (d.trade) setTrade(d.trade);
    if (d.address) setAddress(d.address);
    if (typeof d.latitude === 'number') setLatitude(d.latitude);
    if (typeof d.longitude === 'number') setLongitude(d.longitude);
    if (d.photo) setPhoto(d.photo);
    if (typeof d.step === 'number') setStep(Math.min(d.step, 5));
  }, []);

  const cleanPhone = formatNigerianPhone(phone);
  const isValidPhone = cleanPhone.length >= 13; // +234XXXXXXXXXX

  const canContinue =
    step === 0
      ? firstName.trim().length > 1 && lastName.trim().length > 1
      : step === 1
      ? true // consent is optional at signup — see IMPORTANT note above the component
      : step === 2
      ? otpVerified
      : step === 3
      ? !!trade
      : step === 4
      ? !!latitude && !!longitude
      : !!photo;

  const [sendingOtp, setSendingOtp] = useState(false);

  async function handleSendWhatsAppOtp() {
    if (!isValidPhone || sendingOtp) return;
    setOtpError(null);
    setSendingOtp(true);
    const formatted = formatNigerianPhone(phone);
    setPlugPhone(formatted);
    savePlugDraft({ phone: formatted });
    try {
      // Real delivery: the backend generates the code and sends it over WhatsApp
      // (approved Authentication template in production; sendText in sandbox).
      await api.auth.requestOtp(formatted, 'PLUG');
      setOtp('');
      setOtpSent(true);
    } catch (e: any) {
      setOtpError(e?.message ?? 'Could not send the code. Check the number and try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6 || verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      // verifyOnly — confirm the code AND find out whether this number is already registered,
      // so a duplicate is caught here (step 2) instead of at the very end after NIN + liveness.
      // The account is still created at the end via POST /api/plugs/register.
      const res: any = await api.auth.verifyOtp(cleanPhone, otp, true);

      if (res?.exists) {
        // One role per number: a client (or admin) number can't be turned into a Plug.
        if (res.role && res.role !== 'PLUG') {
          setOtpError(
            `This number is already registered as a ${String(res.role).toLowerCase()} account. ` +
            `Use a different number to register as a Plug.`
          );
          return;
        }
        // A Plug who already finished onboarding — send them to sign in, not through signup again.
        if (res.hasProfile) {
          setOtpError('This number is already a Plug account. Taking you to sign in…');
          setTimeout(() => router.replace(`${base}/auth/phone`), 1400);
          return;
        }
        // Otherwise: a Plug mid-onboarding (no profile yet) — fine to continue; register completes it.
      }

      setOtpVerified(true);
      savePlugDraft({ phone: cleanPhone, step: 3 });
      setStep(3); // Auto-advance to Trade
    } catch (e: any) {
      setOtpError(e?.message ?? 'Incorrect or expired code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handleConsentToggle(checked: boolean) {
    setConsentAgreed(checked);
    // Ticking this box stands in for every item on /consent (account creation, identity
    // verification, data sharing, AND marketing) — see note above the component about
    // splitting marketing back out into its own, genuinely-optional toggle if you want
    // that distinction preserved for Plugs.
    savePlugDraft({
      consentAgreed: checked,
      consentDocVersion: checked ? CONSENT_DOC_VERSION : undefined,
      consentAt: checked ? new Date().toISOString() : undefined,
    });
  }

  function next() {
    if (!canContinue) return;
    if (step === 0) savePlugDraft({ firstName: firstName.trim(), lastName: lastName.trim(), step: 1 });
    if (step === 1) savePlugDraft({ consentAgreed: true, consentDocVersion: CONSENT_DOC_VERSION, consentAt: new Date().toISOString(), step: 2 });
    if (step === 2) savePlugDraft({ phone: cleanPhone, step: 3 });
    if (step === 3) savePlugDraft({ trade: trade as PlugTrade, step: 4 });
    if (step === 4) savePlugDraft({ address, latitude, longitude, step: 5 });
    if (step === 5) {
      savePlugDraft({ photo, step: 6 });
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
          ? 'Before we continue'
          : step === 2
          ? 'What’s your phone number?'
          : step === 3
          ? 'What do you do?'
          : step === 4
          ? 'Where are you based?'
          : 'Add your photo'
      }
      subtitle={
        step === 0
          ? 'This is the name clients will see.'
          : step === 1
          ? 'Optional for now — you’ll need to agree before we can verify your identity.'
          : step === 2
          ? 'We’ll send a WhatsApp message to verify your phone.'
          : step === 3
          ? 'Pick the trade you want jobs for.'
          : step === 4
          ? 'Clients match with Plugs nearby.'
          : 'Clients trust a face. This is the front of your identity.'
      }
      back={base}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      footer={
        <GoldButton onClick={next} disabled={!canContinue}>
          {step === 5 ? 'Continue to verification' : 'Continue'} <ArrowRight className="w-4 h-4" />
        </GoldButton>
      }
    >
      {/* Progress — 6 steps */}
      <div className="flex gap-1.5 mb-8" aria-label={`Step ${step + 1} of 6`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-pill transition-colors', i <= step ? 'bg-gold' : 'bg-midnight/10')}
          />
        ))}
      </div>

      {/* Step 1 — Name */}
      {step === 0 && (
        <div className="space-y-5 rise">
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

      {/* Step 2 — Consent */}
      {step === 1 && (
        <div className="space-y-4 rise">
          <div className="rounded-[22px] border border-midnight/10 bg-white p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gold/15 shrink-0">
                <ShieldCheck className="w-5 h-5 text-gold" />
              </span>
              <p className="text-sm leading-relaxed text-slate">
                To list you as a verified Plug, we&rsquo;ll eventually need your consent to verify your
                identity (NIN), match you with Clients, and process your data as described in our{' '}
                <Link href="/consent" target="_blank" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                  Data Consent &amp; Processing Agreement
                </Link>
                ,{' '}
                <Link href="/privacy" target="_blank" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                  Privacy Policy
                </Link>
                , and{' '}
                <Link href="/terms" target="_blank" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                  Terms of Service
                </Link>
                .
              </p>
            </div>

            <label
              htmlFor="onboarding-consent"
              className="flex items-start gap-3 rounded-2xl border border-midnight/10 bg-bone/60 p-4 cursor-pointer hover:border-gold/40 transition-colors"
            >
              <input
                id="onboarding-consent"
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => handleConsentToggle(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-midnight/30 text-gold focus:ring-gold"
              />
              <span className="text-sm font-medium text-midnight">
                I agree to Plugr verifying my identity and processing my data as described above.
              </span>
            </label>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                href="/consent"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate hover:text-gold transition-colors"
              >
                Review the full consent form <ExternalLink className="w-3 h-3" />
              </Link>
              {!consentAgreed && (
                <span className="text-xs text-slate/70">You can skip this and agree later</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Phone & WhatsApp OTP */}
      {step === 2 && (
        <div className="space-y-5 rise">
          <div>
            <Label className="mb-2">WhatsApp Phone Number</Label>
            <div className="relative">
              <TextInput
                value={phone}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setOtpVerified(false);
                }}
                disabled={otpSent && otpVerified}
                placeholder="08012345678"
                inputMode="tel"
                className="pl-11"
                autoFocus
              />
              <Phone className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-2 text-xs text-slate">Nigerian format e.g. 08012345678 or +2348012345678</p>
          </div>

          {!otpSent ? (
            <button
              onClick={handleSendWhatsAppOtp}
              disabled={!isValidPhone || sendingOtp}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-white" /> {sendingOtp ? 'Sending…' : 'Get Code on WhatsApp'}
            </button>
          ) : (
            <div className="p-4 rounded-2xl border border-midnight/10 bg-white space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-midnight">Enter 6-digit WhatsApp OTP</span>
                <button
                  onClick={handleSendWhatsAppOtp}
                  className="text-gold font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Resend
                </button>
              </div>

              <TextInput
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                className="text-center text-lg tracking-[0.3em] font-bold"
              />

              {otpError && <p className="text-xs text-red-600 font-medium">{otpError}</p>}

              <GoldButton
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || verifyingOtp}
                loading={verifyingOtp}
              >
                {verifyingOtp ? 'Verifying…' : 'Verify'}
              </GoldButton>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Trade */}
      {step === 3 && (
        <div className="space-y-3 rise" role="radiogroup" aria-label="Trade">
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

      {/* Step 5 — Location */}
      {step === 4 && (
        <div className="space-y-4 rise">
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

      {/* Step 6 — Photo */}
      {step === 5 && (
        <div className="rise flex flex-col items-center">
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