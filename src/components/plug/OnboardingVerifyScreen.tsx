// src/components/plug/OnboardingVerifyScreen.tsx
// PLG-ON-02 — Identity Verification. NIN + liveness ONLY at launch (no BVN, no guarantor,
// no skills assessment — those are post-launch tier upgrades prompted from PLG-02).
//
// Each step explains itself before asking for data, per the spec's trust note. Three
// failures on a step surfaces a "Contact support" CTA.
//
// CONSENT GATE: since consent is optional during PLG-ON-01 (OnboardingProfileScreen), a Plug
// can arrive here with draft.consentAgreed === false. The NIN field is the actual point of
// collection for sensitive data — verifyNin() is the seam a real NIMC/Prembly/Dojah provider
// drops into — so we block that field entirely behind a consent gate rendered in place of
// Step 0 until consent is confirmed. This is a client-side UX gate only; the register
// endpoint (POST /api/plugs/register) must independently reject requests without a valid
// consentAgreed/consentDocVersion/consentAt, since this check can be bypassed by calling
// the API directly.
//
// On all-verified: creates the real Plug row in the product tables,
// then routes to PLG-01 (Pending Review).
//
// NOTE: no NIMC/liveness SDK is wired yet — any 11-digit NIN passes and the liveness capture
// self-approves. Both `verifyNin` and `verifyLiveness` are the seams a provider drops into.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Check, Loader2, Camera, ScanFace, LifeBuoy, ExternalLink } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Label, TextInput, GoldButton } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import { cn } from '@/src/lib/utils';
import { setToken } from '@/src/lib/api';
import {getPlugDraft,
  savePlugDraft,
  clearPlugDraft,
  setPlugId,
  getPlugId,
  setPlugOnboarded,
  getPlugPhone,
} from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';

const MAX_ATTEMPTS = 3;
const CONSENT_DOC_VERSION = '2026-08-06';

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
  // 0 NIN · 1 liveness · 2 optional email (the last thing asked, after verification — deliberately
  // NOT bundled into the phone/OTP step, and skippable).
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Consent gate — resolved on mount from the draft. Starts `null` (not "unagreed") so we
  // don't flash the gate open for the common case where consent was already given.
  const [consentAgreed, setConsentAgreed] = useState<boolean | null>(null);
  const [gateChecked, setGateChecked] = useState(false);

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

  // Optional email (step 2)
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const d = getPlugDraft();
    setConsentAgreed(!!d.consentAgreed);
  }, []);

  function agreeToConsent() {
    savePlugDraft({
      consentAgreed: true,
      consentDocVersion: CONSENT_DOC_VERSION,
      consentAt: new Date().toISOString(),
    });
    setConsentAgreed(true);
  }

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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { });
      }
    } catch {
      setCamError("We couldn't open your camera. Allow camera access, then try again.");
    }
  }, []);

  // start the camera when the liveness step opens (only once consent is resolved & agreed)
  useEffect(() => {
    if (consentAgreed && step === 1 && liveState !== 'verified') startCamera();
    else stopCamera();
  }, [consentAgreed, step, liveState, startCamera, stopCamera]);

  function onNinChange(v: string) {
    setError(null);
    if (ninState === 'failed') setNinState('idle');
    if (masked) {
      if (v.length < display.length) setNin((n) => n.slice(0, -1));
      else setNin((n) => (n + v.slice(display.length)).replace(/\D/g, '').slice(0, 11));
      setMasked(false);
      return;
    }
    setNin(v.replace(/\D/g, '').slice(0, 11));
  }

  async function submitNin() {
    if (!consentAgreed || nin.length !== 11 || ninState === 'verifying') return;
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
    setTimeout(() => setStep(1), 700);
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
    // Verification is done — ask for the optional email last, then register.
    setTimeout(() => setStep(2), 700);
  }

  /** Continue from the email step. Blank is a valid answer (the field is optional). */
  function submitEmail() {
    const value = email.trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('That doesn’t look like a valid email. Fix it, or skip this step.');
      return;
    }
    setEmailError(null);
    finish(value || undefined);
  }

  async function finish(emailValue?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const d = getPlugDraft();

      // TWO WAYS TO REACH THIS SCREEN, and they must not do the same thing:
      //
      //  1. Single-page signup (Part A) — the account ALREADY EXISTS. The Plug created it, landed
      //     in the app, and came here from the "complete your profile" prompt. Calling register
      //     again would hit the backend's duplicate check and fail with "already registered",
      //     which is exactly what a Plug finishing their profile must never see.
      //  2. The legacy six-step wizard — no account yet; this screen is what creates it.
      //
      // A stored plug id is the signal: it only exists once an account has been created.
      const alreadyRegistered = Boolean(getPlugId());

      if (alreadyRegistered) {
        // Record the NIN locally so the dashboard switches from "finish setting up" to
        // "Under Review". Approval itself is an ops action (PATCH /plugs/:id/verification is
        // ADMIN-only, correctly) — a Plug can never mark themselves verified.
        //
        // LIMITATION, stated rather than hidden: "submitted" lives only on this device until a
        // `verificationSubmittedAt` column exists on PlugProfile. A Plug who submits here and
        // then signs in elsewhere sees the prompt again. It is a nudge either way, and the
        // server-side eligibility gate is completely unaffected.
        savePlugDraft({ nin: d.nin ?? nin, liveness: true });
        setPlugOnboarded(true);
        router.replace(`${base}/plug`);
        return;
      }

      const body = await jsonFetch(withSource('/api/plugs/register', base), {
        method: 'POST',
        body: JSON.stringify({
          firstName: d.firstName,
          lastName: d.lastName,
          trade: d.trade,
          photoUrl: d.photo,
          nin: d.nin ?? nin,
          phone: getPlugPhone() ?? d.phone,
          // Optional — omitted entirely when the Plug skipped the step.
          ...(emailValue ? { email: emailValue } : {}),
          address: d.address ,
          latitude: d.latitude ,
          longitude: d.longitude ,
          // The register endpoint must independently verify these — see CONSENT GATE note
          // at the top of this file. Do not treat their presence here as authoritative.
          consentAgreed: d.consentAgreed ?? consentAgreed,
          consentDocVersion: d.consentDocVersion ?? CONSENT_DOC_VERSION,
          consentAt: d.consentAt,
        }),
      });

      if (body.accessToken) setToken(body.accessToken);
      // Keep the refresh token too, so the new Plug's session renews silently instead of
      // hard-expiring when the access token lapses.
      if (body.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem('plugr_refresh_token', body.refreshToken);
      }
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

  // Consent not yet resolved from the draft — avoid flashing either state.
  if (consentAgreed === null) {
    return (
      <Shell eyebrow="Become a Plug" title="One moment" subtitle="" back={`${base}/onboarding`} footer={null}>
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      </Shell>
    );
  }

  // Consent gate — replaces Step 0 entirely until agreed.
  if (!consentAgreed) {
    return (
      <Shell
        eyebrow="Become a Plug"
        title="Before we verify you"
        subtitle="We need your consent to check your NIN and process your data."
        back={`${base}/onboarding`}
        footer={
          <GoldButton onClick={agreeToConsent} disabled={!gateChecked}>
            I agree — continue
          </GoldButton>
        }
      >
        <div className="rise rounded-[22px] border border-midnight/10 bg-white p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gold/15 shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </span>
            <p className="text-sm leading-relaxed text-slate">
              Verifying your identity means checking your NIN against the national register and
              running a face-match liveness scan. This is covered by our{' '}
              <Link href="/consent" target="_blank" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                Data Consent &amp; Processing Agreement
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                Privacy Policy
              </Link>
              . We can&rsquo;t start verification without it.
            </p>
          </div>

          <label
            htmlFor="verify-consent"
            className="flex items-start gap-3 rounded-2xl border border-midnight/10 bg-bone/60 p-4 cursor-pointer hover:border-gold/40 transition-colors"
          >
            <input
              id="verify-consent"
              type="checkbox"
              checked={gateChecked}
              onChange={(e) => setGateChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-midnight/30 text-gold focus:ring-gold"
            />
            <span className="text-sm font-medium text-midnight">
              I agree to Plugr verifying my identity and processing my data as described above.
            </span>
          </label>

          <Link
            href="/consent"
            target="_blank"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate hover:text-gold transition-colors"
          >
            Review the full consent form <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      eyebrow="Become a Plug"
      title={step === 0 ? 'Confirm your identity' : step === 1 ? 'Prove it’s you' : 'Want job updates by email?'}
      subtitle={
        step === 0
          ? 'Your NIN is checked against the national register. It’s never shown on your profile.'
          : step === 1
            ? 'A quick face scan confirms you match your ID. Nothing is shared with clients.'
            : 'Optional — WhatsApp stays your main channel either way. You can add or change this later in Settings.'
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
        ) : step === 1 ? (
          <GoldButton
            onClick={submitLiveness}
            disabled={!!camError || liveLocked || liveState === 'verified'}
            loading={liveState === 'verifying' || submitting}
          >
            {liveState === 'verifying' ? 'Checking…' : 'Start face scan'}
          </GoldButton>
        ) : (
          <div className="space-y-3">
            <GoldButton onClick={submitEmail} disabled={submitting} loading={submitting}>
              {submitting ? 'Finishing up…' : email.trim() ? 'Save & finish' : 'Finish'}
            </GoldButton>
            {/* Skipping must be as easy as answering — an equally prominent, plainly labelled out. */}
            <button
              onClick={() => finish(undefined)}
              disabled={submitting}
              className="w-full py-3 text-sm font-bold text-slate hover:text-midnight transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        )
      }
    >
      {/* progress — NIN · liveness · optional email */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-pill', i <= step ? 'bg-gold' : 'bg-midnight/10')} />
        ))}
      </div>

      {/* --- Step 1: NIN --- */}
      {step === 0 && (
        <div className="rise">
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
        <div className="rise flex flex-col items-center">
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

      {/* --- Step 3: optional email --- */}
      {step === 2 && (
        <div className="rise">
          <Card className="mb-6 flex items-start gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/12">
              <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />
            </span>
            <p className="text-[13px] leading-relaxed text-slate">
              <span className="font-bold text-midnight">You’re verified.</span> Last thing — an email lets us send
              receipts and payout records you can keep. It’s not required, and clients never see it.
            </p>
          </Card>

          <div className="mb-2 flex items-center justify-between">
            <Label>Email address</Label>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate/70">Optional</span>
          </div>
          <TextInput
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            aria-label="Email address (optional)"
            className={cn(emailError && 'border-red-400')}
          />
          {emailError ? (
            <p className="mt-2.5 text-sm text-red-600">{emailError}</p>
          ) : (
            <p className="mt-2.5 text-xs text-slate/80">
              Leave it blank and tap “Skip for now” — you can add it any time from Settings.
            </p>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </Shell>
  );
}

function SupportRow() {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-midnight/6 bg-white p-4">
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