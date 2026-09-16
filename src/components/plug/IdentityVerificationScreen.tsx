// src/components/plug/IdentityVerificationScreen.tsx
// Verification Hub item: NIN + face scan, run through Didit (ID document + liveness + face match).
//
// Flow: consent disclosure → backend creates a Didit session (the API key never reaches the browser)
// → the Didit web SDK opens the hosted flow in a modal → Didit posts a signed webhook to the backend,
// which records the decision → this screen reads the status back from the backend.
//
// The SDK's onComplete result is only a UI hint. Whether the Plug is verified is whatever the backend
// says, which only Didit's signed webhook can change. So after the modal closes this screen polls the
// status for a short while instead of trusting "completed".

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ExternalLink, Hourglass, Loader2, ScanFace, ShieldCheck } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { GoldButton } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import {
  identityItemState,
  saveServerItemState,
  type IdentityServerStatus,
} from '@/src/app/app/_lib/verificationHub';

const HUB = '/app/plug/verification';
const STATUS_URL = '/api/plug/verification/identity';
const SESSION_URL = '/api/plug/verification/identity/session';

/** After the modal closes, how long to wait for Didit's webhook before telling the Plug to check back. */
const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 60_000;

type Phase = 'loading' | 'idle' | 'starting' | 'open' | 'processing' | 'error';

/** Backend messages written for Plugs (e.g. "Your identity is already verified.") pass through;
 *  routing and transport errors ("Cannot GET /…", "Request failed: 502") never reach the screen. */
function friendly(e: any, fallback: string): string {
  const msg: string = e?.message ?? '';
  return !msg || /^(Cannot (GET|POST)|Request failed|Failed to fetch|Session expired)|NetworkError|timeout/i.test(msg)
    ? fallback
    : msg;
}

type Copy = { title: string; body: string; tone: 'neutral' | 'warn' | 'review' | 'done'; canStart: boolean; cta?: string };

function copyFor(status: IdentityServerStatus): Copy {
  switch (status) {
    case 'APPROVED':
      return { title: 'Identity verified', body: 'Your ID and face scan have been confirmed. Nothing else to do here.', tone: 'done', canStart: false };
    case 'IN_REVIEW':
      return {
        title: 'Being reviewed',
        body: 'Your ID check needs a closer look by a reviewer. We’ll update this as soon as there’s a decision — you don’t need to do anything.',
        tone: 'review',
        canStart: false,
      };
    case 'DECLINED':
      return {
        title: 'We couldn’t verify you',
        body: 'The check didn’t go through. Try again with a valid, unexpired ID in good light, and make sure your face is clearly visible.',
        tone: 'warn',
        canStart: true,
        cta: 'Try again',
      };
    case 'RESUBMIT_REQUESTED':
      return { title: 'Part of your check needs redoing', body: 'A reviewer asked you to redo a step. Start again and follow the prompts.', tone: 'warn', canStart: true, cta: 'Redo the check' };
    case 'KYC_EXPIRED':
      return { title: 'Your verification has expired', body: 'Verifications are renewed periodically. Run the check again to stay verified.', tone: 'warn', canStart: true, cta: 'Verify again' };
    case 'ABANDONED':
    case 'EXPIRED':
      return { title: 'Your last check didn’t finish', body: 'It closed before it was complete. Start again whenever you’re ready — it takes a few minutes.', tone: 'neutral', canStart: true, cta: 'Start again' };
    case 'IN_PROGRESS':
      return { title: 'You haven’t finished yet', body: 'You started a check but it isn’t complete. Continue to finish it.', tone: 'neutral', canStart: true, cta: 'Continue' };
    case 'NOT_STARTED':
    default:
      return {
        title: 'Verify your identity',
        body: 'You’ll photograph a government ID and take a quick face scan. It takes a few minutes.',
        tone: 'neutral',
        canStart: true,
        cta: 'Start verification',
      };
  }
}

export function IdentityVerificationScreen() {
  const [status, setStatus] = useState<IdentityServerStatus | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [consented, setConsented] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStatus = useCallback(async (): Promise<IdentityServerStatus | null> => {
    try {
      const body = await apiFetch(STATUS_URL, { cache: 'no-store' }, { redirectTo: '/app/auth/login' });
      const next = (body?.status ?? 'NOT_STARTED') as IdentityServerStatus;
      setStatus(next);
      // Keep the Hub and dashboard card in step with the server.
      saveServerItemState(getPlugId() ?? '', 'nin_liveness', identityItemState(next));
      return next;
    } catch (e: any) {
      setMessage(friendly(e, 'We couldn’t load your verification status.'));
      setPhase('error');
      return null;
    }
  }, []);

  useEffect(() => {
    loadStatus().then((s) => s && setPhase('idle'));
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [loadStatus]);

  /** Poll until the webhook moves the status off IN_PROGRESS, or give up after POLL_FOR_MS. */
  const pollForDecision = useCallback(
    (startedAt: number) => {
      pollTimer.current = setTimeout(async () => {
        const s = await loadStatus();
        if (!s) return;
        if (s !== 'IN_PROGRESS') {
          setPhase('idle');
          setMessage(null);
          return;
        }
        if (Date.now() - startedAt > POLL_FOR_MS) {
          setPhase('idle');
          setMessage('Your result is still processing. Check back here in a few minutes.');
          return;
        }
        pollForDecision(startedAt);
      }, POLL_EVERY_MS);
    },
    [loadStatus],
  );

  async function start() {
    if (!consented || phase === 'starting' || phase === 'open') return;
    setMessage(null);
    setPhase('starting');

    let url: string;
    try {
      const session = await apiFetch(SESSION_URL, { method: 'POST' }, { redirectTo: '/app/auth/login' });
      url = session?.url;
      if (!url) throw new Error('Could not start identity verification. Please try again.');
    } catch (e: any) {
      setMessage(friendly(e, 'Could not start identity verification. Please try again.'));
      setPhase('idle');
      loadStatus(); // e.g. a 409 because it was approved or went to review meanwhile
      return;
    }

    try {
      // Browser-only SDK: loaded on demand so it never runs during server rendering.
      const { DiditSdk } = await import('@didit-protocol/sdk-web');
      DiditSdk.shared.onComplete = (result) => {
        if (result.type === 'cancelled') {
          setMessage('You closed the check before finishing. You can continue any time.');
          setPhase('idle');
          loadStatus();
          return;
        }
        if (result.type === 'failed') {
          setMessage(result.error?.message ?? 'Something went wrong during the check. Please try again.');
          setPhase('idle');
          loadStatus();
          return;
        }
        // "completed" is a hint only — wait for the backend to record Didit's signed decision.
        setPhase('processing');
        pollForDecision(Date.now());
      };
      setPhase('open');
      await DiditSdk.shared.startVerification({ url });
    } catch (e: any) {
      setMessage('Could not open the verification window. Please try again.');
      setPhase('idle');
    }
  }

  const copy = status ? copyFor(status) : null;

  return (
    <Shell eyebrow="Verification" title="NIN + face scan" subtitle="Confirm you are who your ID says you are." back={HUB}>
      {phase === 'error' && !copy ? (
        // The status could not be loaded at all — say so and offer a retry, never an endless spinner.
        <div className="rise rounded-[22px] border border-pitch-black/[0.08] bg-white p-5" role="alert">
          <p className="font-bold text-pitch-black">Couldn&rsquo;t load your verification</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">
            {message ?? 'Something went wrong.'} Check your connection and try again.
          </p>
          <button
            onClick={() => {
              setMessage(null);
              setPhase('loading');
              loadStatus().then((st) => st && setPhase('idle'));
            }}
            className="mt-4 inline-flex items-center rounded-pill border border-pitch-black/15 bg-white px-4 py-2 text-[13px] font-bold text-pitch-black hover:border-gold"
          >
            Try again
          </button>
        </div>
      ) : phase === 'loading' || !copy ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : (
        <>
          <StatusCard copy={copy} processing={phase === 'processing'} />

          {message && (
            <p className="rise mt-4 rounded-2xl border border-pitch-black/[0.08] bg-white p-4 text-[13px] leading-relaxed text-slate" role="status">
              {message}
            </p>
          )}

          {copy.canStart && phase !== 'processing' && (
            <div className="rise rise-1 mt-6">
              <div className="rounded-[22px] border border-pitch-black/10 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15">
                    <ShieldCheck className="h-5 w-5 text-gold" />
                  </span>
                  <p className="text-[13px] leading-relaxed text-slate">
                    Plugr uses <span className="font-bold text-pitch-black">Didit</span>, an identity verification provider,
                    to check your ID document and match it to a face scan. Didit processes your ID photo and face scan on
                    our behalf. Your ID number is never shown on your profile, and nothing is shared with clients.
                  </p>
                </div>

                <label
                  htmlFor="identity-consent"
                  className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-pitch-black/10 bg-bone/60 p-4 transition-colors hover:border-gold/40"
                >
                  <input
                    id="identity-consent"
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-pitch-black/30 text-gold focus:ring-gold"
                  />
                  <span className="text-sm font-medium text-pitch-black">
                    I agree to Plugr and Didit verifying my identity and processing my ID and face scan for that purpose.
                  </span>
                </label>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  <Link href="/privacy" target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-slate hover:text-gold">
                    Privacy Policy <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link href="/consent" target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-slate hover:text-gold">
                    Data Consent Agreement <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="mt-5">
                <GoldButton onClick={start} disabled={!consented || phase === 'starting' || phase === 'open'} loading={phase === 'starting'}>
                  {phase === 'starting' ? 'Opening…' : phase === 'open' ? 'Verification open…' : copy.cta}
                </GoldButton>
              </div>
            </div>
          )}

          {!copy.canStart && (
            <div className="rise rise-1 mt-6">
              <Link href={HUB} className="inline-flex items-center text-sm font-bold text-pitch-black underline underline-offset-4 hover:text-gold">
                Back to verification
              </Link>
            </div>
          )}

          {status === 'DECLINED' && (
            <p className="mt-4 text-[12px] text-slate">
              Keeps failing? Email <a className="font-bold text-pitch-black" href="mailto:support@getplugr.com?subject=Identity%20verification">support@getplugr.com</a>.
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

function StatusCard({ copy, processing }: { copy: Copy; processing: boolean }) {
  if (processing) {
    return (
      <div className="rise rounded-[22px] border border-pitch-black/[0.08] bg-white p-5" role="status">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pitch-black text-gold">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="font-bold text-pitch-black">Getting your result…</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate">This usually takes a moment. You can leave this screen — it will be saved.</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = copy.tone === 'done' ? Check : copy.tone === 'review' ? Hourglass : copy.tone === 'warn' ? AlertTriangle : ScanFace;
  return (
    <div
      className={cn(
        'rise rounded-[22px] border p-5',
        copy.tone === 'review' ? 'border-dashed border-gold/60 bg-gold/[0.06]' : copy.tone === 'done' ? 'border-emerald-500/20 bg-white' : 'border-pitch-black/[0.08] bg-white',
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
            copy.tone === 'done'
              ? 'bg-emerald-500/12 text-emerald-700'
              : copy.tone === 'review'
                ? 'bg-gold/15 text-[#8a5a08]'
                : copy.tone === 'warn'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-pitch-black text-gold',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-pitch-black">{copy.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">{copy.body}</p>
        </div>
      </div>
    </div>
  );
}
