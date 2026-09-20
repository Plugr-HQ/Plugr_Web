// src/components/plug/IdentityManualScreen.tsx
// Verification Hub item: NIN + face scan, reviewed by our own team.
//
// This replaced a vendor flow (Didit's NIMC lookup, which needs a funded account). The Plug gives
// three things and ops compare them by eye: the NIN they typed, a photo or PDF of their NIN slip,
// and a selfie taken live on this screen. The reviewer reads the NIN off the slip against the typed
// one, and the face on the slip against the selfie. That is why all three are collected together and
// submitted in one request — any one of them alone proves nothing.
//
// A pass here is a FULL verification. There is no lesser "manually verified" status: the item goes
// to pending review and comes back verified, exactly like the guarantor and skills items.
//
// THE SELFIE IS CAMERA-ONLY. There is deliberately no file picker for it: a selfie chosen from the
// gallery could be anyone's photo, which defeats the entire point of asking for a live one. The
// capture is the same getUserMedia + canvas pattern already used by OnboardingVerifyScreen; it
// produces a JPEG Blob, and the backend refuses anything that isn't one.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileBadge, Hourglass, Loader2, RefreshCw, ScanFace, ShieldCheck } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { GoldButton, Label, TextInput } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot } from '@/src/app/app/_lib/verificationItems';
import type { ItemState } from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const SUBMIT_URL = '/api/plug/verification/identity/submit';

/** The slip's limits, mirrored from the backend so an oversized file is refused before it is sent
 *  over mobile data rather than after. The backend checks the same two things again. */
const MAX_SLIP_BYTES = 10 * 1024 * 1024;
const ACCEPTED_SLIP = ['application/pdf', 'image/jpeg'];

function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export function IdentityManualScreen() {
  const [state, setState] = useState<ItemState | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);

  const [nin, setNin] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  const [camOpen, setCamOpen] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slipInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setState(snap.items?.identity.state ?? 'not_started');
    setReviewNote(snap.items?.identity.reviewNote ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Camera ───────────────────────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // The stream and the preview's object URL are both held outside React, so both are released when
  // the screen goes away — a camera left running is a light that stays on.
  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => () => {
    if (selfieUrl) URL.revokeObjectURL(selfieUrl);
  }, [selfieUrl]);

  const startCamera = useCallback(async () => {
    setCamError(null);
    stopCamera();
    setCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCamError('We couldn’t open your camera. Allow camera access, then try again.');
    }
  }, [stopCamera]);

  /** Grab the current frame as a JPEG. The backend accepts nothing else for this field. */
  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      setCamError('The camera isn’t ready yet. Give it a moment and try again.');
      return;
    }
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    c.toBlob(
      (blob) => {
        if (!blob) {
          setCamError('We couldn’t take that photo. Try again.');
          return;
        }
        if (selfieUrl) URL.revokeObjectURL(selfieUrl);
        setSelfie(blob);
        setSelfieUrl(URL.createObjectURL(blob));
        setCamOpen(false);
        stopCamera();
        setError(null);
      },
      'image/jpeg',
      0.85,
    );
  }

  function retakeSelfie() {
    if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    setSelfie(null);
    setSelfieUrl(null);
    startCamera();
  }

  // ─── Slip ─────────────────────────────────────────────────────────────────────────────────

  function pickSlip(file: File) {
    setError(null);
    if (!ACCEPTED_SLIP.includes(file.type)) {
      setError('Your NIN slip has to be a PDF or a JPG. That file is neither.');
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setError(`That file is ${sizeLabel(file.size)}. The limit is 10MB — try a smaller photo.`);
      return;
    }
    setSlip(file);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────────────────

  const complete = nin.length === 11 && !!slip && !!selfie;

  async function submit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('nin', nin);
      body.append('slip', slip!, slip!.name);
      body.append('selfie', selfie!, 'selfie.jpg');
      await apiFetch(SUBMIT_URL, { method: 'POST', body }, { redirectTo: '/app/auth/login' });
      // Clear what was entered before re-reading: the screen becomes a status card, and nothing the
      // Plug typed needs to stay in memory once it has been sent.
      setNin('');
      setSlip(null);
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
      setSelfie(null);
      setSelfieUrl(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t submit that. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      eyebrow="Verification"
      title="NIN + face scan"
      subtitle="Confirm your NIN and that it’s really you."
      back={HUB}
      footer={
        state === 'not_started' || state === 'in_progress' ? (
          <GoldButton onClick={submit} disabled={!complete || submitting} loading={submitting}>
            {submitting ? 'Sending…' : 'Submit for review'}
          </GoldButton>
        ) : null
      }
    >
      {state === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : state === 'pending_review' ? (
        <StatusCard
          icon={<Hourglass className="h-6 w-6" />}
          title="With our team"
          body="We’ve got your NIN, your slip and your selfie. Someone on our team checks them against each other by hand — this usually takes a day or two, and there’s nothing else for you to do."
        />
      ) : state === 'verified' ? (
        <StatusCard
          tone="done"
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Identity verified"
          body="Your NIN matched your slip and your selfie matched the photo on it. Nothing else to do here."
        />
      ) : (
        <>
          {reviewNote && (
            <div className="rise rounded-[18px] border border-gold/50 bg-gold/[0.07] p-4" role="alert">
              <p className="text-sm font-bold text-pitch-black">We need you to send this again</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate">{reviewNote}</p>
            </div>
          )}

          <div className={cn('rounded-[22px] border border-pitch-black/[0.08] bg-white p-5', reviewNote ? 'rise rise-1 mt-4' : 'rise')}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15">
                <ShieldCheck className="h-5 w-5 text-gold" />
              </span>
              <p className="text-[13px] leading-relaxed text-slate">
                Three things, checked by our own team: your NIN, a picture of your NIN slip, and a selfie taken right
                here. We compare the number you type with the one on your slip, and your selfie with the photo on it.
                Your NIN is never shown on your profile and nothing is shared with clients.
              </p>
            </div>
          </div>

          {/* ── 1. NIN ─────────────────────────────────────────────────────────────────── */}
          <Step n={1} title="Your NIN" className="rise rise-2">
            <Label className="mb-2">National Identification Number</Label>
            <TextInput
              value={nin}
              onChange={(e) => {
                setNin(e.target.value.replace(/\D/g, '').slice(0, 11));
                if (error) setError(null);
              }}
              inputMode="numeric"
              placeholder="12345678901"
              aria-label="National Identification Number"
              data-testid="identity-nin"
              className="tnum tracking-wide"
            />
            <p className="mt-2 text-[12px] text-slate">
              11 digits, exactly as they appear on your slip. Stored encrypted — only the reviewer sees it.
            </p>
          </Step>

          {/* ── 2. NIN slip ────────────────────────────────────────────────────────────── */}
          <Step n={2} title="Your NIN slip" className="rise rise-3">
            <p className="text-[13px] leading-relaxed text-slate">
              A clear photo or a PDF of your NIN slip — the whole slip, with the number and your photo readable.
            </p>

            <input
              ref={slipInputRef}
              type="file"
              accept="application/pdf,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ''; // so picking the same file twice still fires
                if (file) pickSlip(file);
              }}
            />

            {slip ? (
              <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-pitch-black/[0.08] bg-white p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                  <FileBadge className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-pitch-black" data-testid="slip-name">
                    {slip.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate">{sizeLabel(slip.size)}</p>
                </div>
                <button
                  onClick={() => slipInputRef.current?.click()}
                  className="shrink-0 rounded-pill border border-pitch-black/10 px-3 py-1.5 text-[12px] font-bold text-pitch-black hover:border-gold"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                onClick={() => slipInputRef.current?.click()}
                data-testid="pick-slip"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill border border-dashed border-pitch-black/25 bg-white px-5 py-3.5 text-[15px] font-bold text-pitch-black transition-colors hover:border-gold"
              >
                <FileBadge className="h-4 w-4" /> Upload your NIN slip
              </button>
            )}
            <p className="mt-2 text-center text-[12px] text-slate">PDF or JPG, up to 10MB.</p>
          </Step>

          {/* ── 3. Live selfie ─────────────────────────────────────────────────────────── */}
          <Step n={3} title="A live selfie" className="rise rise-4">
            <p className="text-[13px] leading-relaxed text-slate">
              Taken here and now, on your camera. There’s no upload for this one on purpose — a photo from your gallery
              wouldn’t prove it’s you.
            </p>

            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-56 w-56">
                <div className="absolute inset-0 overflow-hidden rounded-full bg-pitch-black">
                  {selfieUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a remote asset
                    <img src={selfieUrl} alt="Your selfie" className="h-full w-full -scale-x-100 object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={cn('h-full w-full -scale-x-100 object-cover', !camOpen && 'opacity-0')}
                      aria-label="Selfie camera"
                    />
                  )}
                  {!camOpen && !selfieUrl && (
                    <span className="absolute inset-0 grid place-items-center">
                      <Camera className="h-10 w-10 text-steel-blue" />
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-full border-[3px]',
                    selfieUrl ? 'border-emerald-500' : camError ? 'border-red-400' : 'border-gold',
                  )}
                />
              </div>

              {!selfieUrl && camOpen && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate">
                  <ScanFace className="h-4 w-4 text-gold" />
                  <span>Centre your face in the circle.</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {selfieUrl ? (
                  <button
                    onClick={retakeSelfie}
                    data-testid="retake-selfie"
                    className="inline-flex items-center gap-1.5 rounded-pill border border-pitch-black/15 bg-white px-4 py-2 text-[13px] font-bold text-pitch-black hover:border-gold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retake
                  </button>
                ) : camOpen ? (
                  <button
                    onClick={capture}
                    data-testid="take-selfie"
                    className="inline-flex items-center gap-1.5 rounded-pill bg-pitch-black px-5 py-2.5 text-[14px] font-bold text-white hover:bg-petrol"
                  >
                    <Camera className="h-4 w-4" /> Take the photo
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    data-testid="open-camera"
                    className="inline-flex items-center gap-1.5 rounded-pill bg-pitch-black px-5 py-2.5 text-[14px] font-bold text-white hover:bg-petrol"
                  >
                    <Camera className="h-4 w-4" /> Open the camera
                  </button>
                )}
              </div>

              {camError && (
                <p className="mt-3 text-center text-[13px] text-red-600" role="alert">
                  {camError}
                </p>
              )}
            </div>
          </Step>

          {error && (
            <p className="mt-4 text-[13px] font-bold text-red-600" role="alert" data-testid="identity-error">
              {error}
            </p>
          )}

          {!complete && (
            <p className="mt-4 text-center text-[12px] text-slate">
              All three are needed before you can send this for review.
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

/** One numbered step. The three are on one screen, not a wizard: a Plug should be able to see up
 *  front that a slip and a selfie are coming before they start typing. */
function Step({
  n,
  title,
  className,
  children,
}: {
  n: number;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('mt-4 rounded-[22px] border border-pitch-black/[0.08] bg-white p-5', className)}>
      <h2 className="mb-3 flex items-center gap-2.5 font-bold text-pitch-black">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pitch-black text-[13px] font-bold text-gold">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone = 'review',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: 'review' | 'done';
}) {
  return (
    <div
      className={cn(
        'rise rounded-[22px] border p-5',
        tone === 'done' ? 'border-emerald-500/20 bg-white' : 'border-dashed border-gold/60 bg-gold/[0.06]',
      )}
      role="status"
      data-testid="identity-status"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
            tone === 'done' ? 'bg-emerald-500/12 text-emerald-700' : 'bg-gold/15 text-[#8a5a08]',
          )}
        >
          {icon}
        </span>
        <div>
          <p className="font-bold text-pitch-black">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">{body}</p>
        </div>
      </div>
    </div>
  );
}
