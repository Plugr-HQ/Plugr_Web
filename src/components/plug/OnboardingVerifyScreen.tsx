// src/components/plug/OnboardingVerifyScreen.tsx
// PLG-ON-02 — Identity Verification. NIN + liveness ONLY at launch (no BVN, no guarantor,
// no skills assessment — those are post-launch tier upgrades prompted from PLG-02).
//
// Each step explains itself before asking for data, per the spec's trust note. Three
// failures on a step surfaces a "Contact support" CTA.
//
// On all-verified: creates the real Plug row (core tables on /app, hack_ tables on /demo),
// then routes to PLG-01 (Pending Review).
//
// NOTE: no NIMC/liveness SDK is wired yet — any 11-digit NIN passes and the liveness capture
// self-approves. Both `verifyNin` and `verifyLiveness` are the seams a provider drops into.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Check, Loader2, Camera, ScanFace, LifeBuoy } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Label, TextInput, GoldButton } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';
import { cn } from '@/src/lib/utils';
import { setToken } from '@/src/lib/api';
import {
  getPlugDraft,
  savePlugDraft,
  clearPlugDraft,
  setPlugId,
  setPlugOnboarded,
  getPlugPhone,
} from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';

const MAX_ATTEMPTS = 3;

/** Seam for the NIN provider (NIMC / Prembly / Dojah). Any 11 digits pass for now. */
async function verifyNin(nin: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 900));
  return /^\d{11}$/.test(nin);
}

/** Seam for the liveness SDK (Smile ID / Prembly / Dojah). Self-approves for now. */
async function verifyLiveness(_frame: string | null): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 1100));
  return true;
}

type StepState = 'idle' | 'verifying' | 'verified' | 'failed';

export function OnboardingVerifyScreen({ base }: { base: string }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);

  // NIN
  const [nin, setNin] = useState('');
  const [masked, setMasked] = useState(false);
  const [ninState, setNinState] = useState<StepState>('idle');
  const [ninTries, setNinTries] = useState(0);

  // Liveness
  const [liveState, setLiveState] = useState<StepState>('idle');
  const [liveTries, setLiveTries] = useState(0);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const maskedNin = nin.length > 4 ? '•'.repeat(nin.length - 4) + nin.slice(-4) : nin;
  const display = masked ? maskedNin : nin;

  // real-time masking after a 1s idle delay
  useEffect(() => {
    if (!nin || ninState === 'verified') return;
    const t = setTimeout(() => setMasked(true), 1000);
    return () => clearTimeout(t);
  }, [nin, ninState]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { });
      }
    } catch {
      setCamError('We couldn’t open your camera. Allow camera access, then try again.');
    }
  }, []);

  // start the camera when the liveness step opens
  useEffect(() => {
    if (step === 1 && liveState !== 'verified') startCamera();
    else stopCamera();
  }, [step, liveState, startCamera, stopCamera]);

  function onNinChange(v: string) {
    setError(null);
    if (ninState === 'failed') setNinState('idle');
    if (masked) {
      // typing while masked: apply the diff, then reveal
      if (v.length < display.length) setNin((n) => n.slice(0, -1));
      else setNin((n) => (n + v.slice(display.length)).replace(/\D/g, '').slice(0, 11));
      setMasked(false);
      return;
    }
    setNin(v.replace(/\D/g, '').slice(0, 11));
  }

  async function submitNin() {
    if (nin.length !== 11 || ninState === 'verifying') return;
    setNinState('verifying');
    setMasked(true);
    const ok = await verifyNin(nin);
    if (!ok) {
      setNinTries((t) => t + 1);
      setNinState('failed');
      return;
    }
    savePlugDraft({ nin });
    setNinState('verified');
    setTimeout(() => setStep(1), 700); // checkmark, then auto-advance
  }

  function captureFrame(): string | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  }

  async function submitLiveness() {
    if (liveState === 'verifying') return;
    setLiveState('verifying');
    const ok = await verifyLiveness(captureFrame());
    if (!ok) {
      setLiveTries((t) => t + 1);
      setLiveState('failed');
      return;
    }
    savePlugDraft({ liveness: true });
    setLiveState('verified');
    stopCamera();
    finish();
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const d = getPlugDraft();
      const body = await jsonFetch(withSource('/api/plugs/register', base), {
        method: 'POST',
        body: JSON.stringify({
          firstName: d.firstName,
          lastName: d.lastName,
          trade: d.trade,
          photoUrl: d.photo ?? null,
          nin: d.nin ?? nin,
          phone: getPlugPhone(),
        }),
      });

      if (body.accessToken) setToken(body.accessToken);
      setPlugId(body.plug.id);
      setPlugOnboarded(true);
      clearPlugDraft();
      router.replace(`${base}/plug`);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
      setSubmitting(false);
    }
  }

  const ninLocked = ninTries >= MAX_ATTEMPTS;
  const liveLocked = liveTries >= MAX_ATTEMPTS;

  return (
    <Shell
      eyebrow="Become a Plug"
      title={step === 0 ? 'Confirm your identity' : 'Prove it’s you'}
      subtitle={
        step === 0
          ? 'Your NIN is checked against the national register. It’s never shown on your profile.'
          : 'A quick face scan confirms you match your ID. Nothing is shared with clients.'
      }
      back={`${base}/onboarding`}
      onBack={step === 1 && liveState !== 'verified' ? () => setStep(0) : undefined}
      footer={
        step === 0 ? (
          <GoldButton
            onClick={submitNin}
            disabled={nin.length !== 11 || ninLocked}
            loading={ninState === 'verifying'}
          >
            {ninState === 'verifying' ? 'Verifying…' : 'Verify NIN'}
          </GoldButton>
        ) : (
          <GoldButton
            onClick={submitLiveness}
            disabled={!!camError || liveLocked || liveState === 'verified'}
            loading={liveState === 'verifying' || submitting}
          >
            {submitting ? 'Finishing up…' : liveState === 'verifying' ? 'Checking…' : 'Start face scan'}
          </GoldButton>
        )
      }
    >
      {/* progress — 2 verification steps */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-pill', i <= step ? 'bg-gold' : 'bg-midnight/10')} />
        ))}
      </div>

      {/* --- Step 1: NIN --- */}
      {step === 0 && (
        <div className="demo-rise">
          <Card className="p-4 mb-6 flex items-start gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-gold/15 shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </span>
            <p className="text-[13px] leading-relaxed text-slate">
              <span className="font-bold text-midnight">Why we ask.</span> Anonymity is what burns clients. Confirming
              your NIN is what turns you from a stranger into a verified professional.
            </p>
          </Card>

          <Label className="mb-2">National Identification Number</Label>
          <div className="relative">
            <TextInput
              value={display}
              onChange={(e) => onNinChange(e.target.value)}
              inputMode="numeric"
              autoFocus
              readOnly={ninState === 'verifying' || ninState === 'verified'}
              placeholder="12345678901"
              aria-label="National Identification Number"
              className={cn(
                'tnum tracking-wide pr-11',
                ninState === 'failed' && 'border-red-400',
                ninState === 'verified' && 'border-emerald-500'
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {ninState === 'verifying' && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
              {ninState === 'verified' && <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
            </span>
          </div>

          {ninState === 'failed' && !ninLocked && (
            <p className="mt-2.5 text-sm text-red-600">
              We couldn’t confirm that NIN. Check the digits and try again.
            </p>
          )}
          {ninLocked && <SupportRow />}
          {ninState === 'idle' && (
            <p className="mt-2.5 text-xs text-slate/80">11 digits. Masked as you type — we never display it again.</p>
          )}
          {ninState === 'verified' && (
            <p className="mt-2.5 text-sm font-semibold text-emerald-700">NIN confirmed.</p>
          )}
        </div>
      )}

      {/* --- Step 2: Liveness --- */}
      {step === 1 && (
        <div className="demo-rise flex flex-col items-center">
          <div className="relative h-64 w-64">
            {/* circular face guide */}
            <div className="absolute inset-0 rounded-full overflow-hidden bg-midnight">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover -scale-x-100"
                aria-label="Liveness camera"
              />
            </div>
            <div
              className={cn(
                'pointer-events-none absolute inset-0 rounded-full border-[3px] transition-colors',
                liveState === 'verified'
                  ? 'border-emerald-500'
                  : liveState === 'failed'
                    ? 'border-red-400'
                    : 'border-gold'
              )}
            />
            {liveState === 'verified' && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-midnight/50">
                <Check className="w-14 h-14 text-emerald-400" strokeWidth={3} />
              </span>
            )}
            {liveState === 'verifying' && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-midnight/40">
                <Loader2 className="w-10 h-10 animate-spin text-gold" />
              </span>
            )}
            {camError && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-midnight">
                <Camera className="w-10 h-10 text-steel-blue" />
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-slate">
            <ScanFace className="w-4 h-4 text-gold" />
            <span>Center your face in the circle.</span>
          </div>

          {camError && (
            <div className="mt-4 text-center">
              <p className="text-sm text-red-600">{camError}</p>
              <button
                onClick={startCamera}
                className="mt-2 text-sm font-bold text-midnight underline underline-offset-4 hover:text-gold"
              >
                Retry camera
              </button>
            </div>
          )}

          {liveState === 'failed' && !liveLocked && (
            <p className="mt-4 text-center text-sm text-red-600">
              We couldn’t get a clear read. Find brighter, even lighting and try again.
            </p>
          )}
          {liveLocked && <SupportRow />}
          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-center text-xs text-slate/70">
            No liveness SDK is wired yet — the scan self-approves for now.
          </p>
        </div>
      )}
    </Shell>
  );
}

function SupportRow() {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-midnight/[0.06] bg-white p-4">
      <p className="text-[13px] text-slate">
        <span className="font-bold text-midnight">Stuck?</span> Our team can verify you manually.
      </p>
      <a
        href="mailto:hello@getplugr.com?subject=Verification%20help"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-pill bg-midnight px-4 py-2 text-[13px] font-bold text-white hover:bg-deep-blue transition-colors"
      >
        <LifeBuoy className="w-4 h-4" /> Contact support
      </a>
    </div>
  );
}
