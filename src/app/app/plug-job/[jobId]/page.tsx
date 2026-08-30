// src/app/app/plug-job/[jobId]/page.tsx
// M1 Plug job-card — the Plug views an assigned job and takes the four state-machine actions on it:
// accept / decline the assignment, submit a quote, and mark a requested visit complete (plus the
// request-visit step the state machine requires before visit-done is reachable).
//
// Wiring pattern is copied from the admin Dispatch Queue: it calls same-origin proxy routes under
// /api/plug/jobs/[jobId]/* that forward the bearer token to the real NestJS M1 backend. It shows
// the REAL M1 status values and surfaces the backend's own validation errors (illegal transition,
// wrong owner, sub-floor quote) rather than swallowing them.
//
// NOTE on the route: this lives at /app/plug-job/[jobId], NOT under /app/plug/*, on purpose —
// the plug/ layout gates on the LEGACY getPlugId() session and would redirect this M1 page away.
// The API routes are still at the requested /api/plug/jobs/[jobId]/*.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Check, MapPin, Navigation, Wrench, X } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Money, Divider, PrimaryButton, GoldButton } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { JobDetailSkeleton } from '@/src/components/Skeleton';
import { directionsUrl } from '@/src/lib/mapsLink';

const QUOTE_MIN = 500;
const QUOTE_REVIEW_CEILING = 200_000;

// Real M1 JobStatus values (mirrors the backend enum / JobStateMachine). Legacy escrow statuses
// (paid_escrow, accepted, …) deliberately do NOT appear here.
type Meta = { label: string; tone: Tone; hint?: string };
type Tone = 'gold' | 'blue' | 'amber' | 'indigo' | 'green' | 'red' | 'neutral';

const STATUS_META: Record<string, Meta> = {
  PLUG_ASSIGNED: { label: 'New assignment', tone: 'gold', hint: 'A client booked you. Accept to open the line and scope the job — or decline to send it back to dispatch.' },
  IN_DISCUSSION: { label: 'In discussion', tone: 'blue', hint: 'You’re matched. Send a quote when you’re ready, or request an on-site visit first if you need to diagnose.' },
  VISIT_PENDING: { label: 'Visit requested', tone: 'amber', hint: 'You flagged this job for an on-site visit. Mark it done once you’ve been on site and diagnosed.' },
  VISIT_DONE: { label: 'Visit done', tone: 'indigo', hint: 'Visit complete and the visit fee is held. Send your quote for the job.' },
  QUOTED: { label: 'Quote sent', tone: 'green', hint: 'Your quote is with the client — they have 24h to accept or decline. You can re-quote if needed.' },
  QUOTE_ACCEPTED: { label: 'Quote accepted', tone: 'green', hint: 'The client accepted your quote. Escrow payment is the next step (M2).' },
  SEARCHING_PLUG: { label: 'Back in the queue', tone: 'neutral', hint: 'This job is no longer assigned to you.' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  ESCROW_HELD: { label: 'Paid into escrow', tone: 'green' },
  EN_ROUTE: { label: 'En route', tone: 'blue' },
  ARRIVED: { label: 'Arrived', tone: 'blue' },
  IN_PROGRESS: { label: 'In progress', tone: 'amber' },
  AWAITING_CONFIRM: { label: 'Awaiting confirmation', tone: 'amber' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  RELEASED: { label: 'Released', tone: 'green' },
};

const TONE_CLASS: Record<Tone, string> = {
  gold: 'bg-gold/15 text-[#8a5a08]',
  blue: 'bg-blue-500/12 text-blue-700',
  amber: 'bg-amber-500/15 text-amber-700',
  indigo: 'bg-indigo-500/12 text-indigo-700',
  green: 'bg-emerald-500/12 text-emerald-700',
  red: 'bg-red-500/12 text-red-700',
  neutral: 'bg-slate/12 text-slate',
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${TONE_CLASS[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

type Job = {
  id: string;
  status: string;
  title?: string | null;
  description?: string | null;
  address?: string | null;
  jobAmount?: number | null;
  quoteExpiresAt?: string | null;
  quoteFlaggedForReview?: boolean | null;
  visitFeeStatus?: string | null;
  client?: { name?: string | null; phone?: string | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
};

export default function PlugJobCard() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // which action is in flight
  const [toast, setToast] = useState<string | null>(null);
  const [showQuote, setShowQuote] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      // skipAuthRedirect: plug login isn't wired to a real backend yet, so bouncing to a login
      // page would strand the tester — surface the auth error inline instead.
      const data = await apiFetch(`/api/plug/jobs/${jobId}`, {}, { skipAuthRedirect: true });
      setJob(data);
    } catch (e: any) {
      setError(e?.message || 'Could not load this job.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void load(); }, [load]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4500); };

  // No-body actions: accept / decline / request-visit / visit-done.
  async function act(action: 'accept' | 'decline' | 'request-visit' | 'visit-done', okMsg: string) {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      await apiFetch(`/api/plug/jobs/${jobId}/${action}`, { method: 'PATCH' }, { skipAuthRedirect: true });
      flash(okMsg);
      await load();
    } catch (e: any) {
      setError(e?.message || 'That action could not be completed.');
    } finally {
      setBusy(null);
    }
  }

  async function submitQuote(amount: number) {
    if (busy) return;
    setBusy('quote');
    setError(null);
    try {
      const res = await apiFetch(
        `/api/plug/jobs/${jobId}/quote`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) },
        { skipAuthRedirect: true },
      );
      // Backend returns { job, flaggedForReview }.
      if (res?.flaggedForReview) {
        flash(`Quote of ₦${amount.toLocaleString('en-NG')} is above ₦${QUOTE_REVIEW_CEILING.toLocaleString('en-NG')} — sent to admin for review. The client won’t see it until it’s approved.`);
      } else {
        flash(`Quote of ₦${amount.toLocaleString('en-NG')} sent to the client.`);
      }
      setShowQuote(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'The quote could not be submitted.');
    } finally {
      setBusy(null);
    }
  }

  const status = job?.status ?? '';
  const meta = STATUS_META[status];
  const canQuote = status === 'IN_DISCUSSION' || status === 'VISIT_DONE' || status === 'QUOTED';

  // Every state between "the Plug accepted" and "the work is finished". Directions are useful at
  // more than one of these — heading out for a diagnosis visit, and again for the job itself — so
  // this is a range rather than a single status. PLUG_ASSIGNED is excluded on purpose: the job is
  // still only an offer at that point and the client's address is not yet the Plug's to have.
  const NAVIGABLE_STATUSES = [
    'IN_DISCUSSION',
    'VISIT_PENDING',
    'VISIT_DONE',
    'QUOTED',
    'QUOTE_ACCEPTED',
    'ESCROW_HELD',
    'EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'AWAITING_CONFIRM',
  ];
  const canNavigate = NAVIGABLE_STATUSES.includes(status);
  const directionsHref = directionsUrl(job?.address);

  return (
    <Shell eyebrow="Plug · Job" title="Job request" back="/app/plug">
      {loading && !job && !error && (
        <JobDetailSkeleton />
      )}

      {error && !job && (
        <Card className="p-4 border-red-200">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button onClick={() => { setLoading(true); void load(); }} className="mt-3 text-sm font-bold text-midnight underline underline-offset-4 hover:text-gold">
            Try again
          </button>
        </Card>
      )}

      {job && (
        <>
          {toast && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {toast}
            </div>
          )}

          {/* An action error while the job is loaded — shown inline, not swallowed. */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Card className="p-6 mb-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Job</span>
              <StatusBadge status={status} />
            </div>

            <p className="font-display text-xl leading-snug text-midnight">{job.title || 'Service request'}</p>
            {job.description && <p className="mt-2 text-sm leading-relaxed text-slate">{job.description}</p>}

            <Divider className="my-5" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Client</dt>
                <dd className="font-semibold text-midnight">{job.client?.name ?? 'Client'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Category</dt>
                <dd className="font-semibold capitalize text-midnight">{job.category?.name ?? job.category?.code ?? '—'}</dd>
              </div>
              {job.address && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate">Location</dt>
                  <dd className="flex items-center gap-1.5 text-right font-semibold text-midnight">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/50" /> <span className="line-clamp-1">{job.address}</span>
                  </dd>
                </div>
              )}
              {job.jobAmount != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate">Your quote</dt>
                  <dd><Money amount={job.jobAmount} size="sm" /></dd>
                </div>
              )}
            </dl>

            {meta?.hint && <p className="mt-5 rounded-2xl bg-bone/70 px-4 py-3 text-[13px] leading-relaxed text-slate">{meta.hint}</p>}

            {/* Directions.
                Shown from acceptance onward and NOT tied to one status — a Plug reasonably wants
                the route when they accept, when they set off for a visit, and again on the way to
                the job itself. Hidden before acceptance (the client's location is not the Plug's
                business until they have taken the job) and once the work is finished.

                Disabled, with the reason, when the address is not something a maps app could find.
                It never guesses: see the note in mapsLink.ts about why this uses the typed address
                and not the job's coordinates. */}
            {canNavigate && (
              <div className="mt-5 border-t border-midnight/[0.07] pt-5">
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-pill border border-midnight/15 bg-white px-6 py-3.5 text-sm font-bold text-midnight transition-colors duration-200 hover:border-gold hover:text-gold active:scale-[0.99]"
                  >
                    <Navigation className="h-4 w-4" />
                    Get directions
                  </a>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled
                      aria-describedby="no-address-reason"
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-pill border border-midnight/10 bg-white px-6 py-3.5 text-sm font-bold text-slate/50"
                    >
                      <Navigation className="h-4 w-4" />
                      Get directions
                    </button>
                    <p id="no-address-reason" className="mt-2 text-center text-[12px] leading-relaxed text-slate">
                      No usable address on this job — ask the client where they are on WhatsApp.
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* ── Actions, gated by the real M1 status ─────────────────────────────── */}

          {status === 'PLUG_ASSIGNED' && (
            <div className="space-y-3">
              <GoldButton onClick={() => act('accept', 'Job accepted — the client has been notified.')} loading={busy === 'accept'} disabled={!!busy}>
                {busy === 'accept' ? 'Accepting…' : 'Accept job'}
              </GoldButton>
              <DangerButton onClick={() => act('decline', 'Declined — the job went back to dispatch.')} loading={busy === 'decline'} disabled={!!busy}>
                {busy === 'decline' ? 'Declining…' : 'Decline'}
              </DangerButton>
            </div>
          )}

          {status === 'IN_DISCUSSION' && !showQuote && (
            <div className="space-y-3">
              <GoldButton onClick={() => setShowQuote(true)} disabled={!!busy}>Send a quote</GoldButton>
              <OutlineButton onClick={() => act('request-visit', 'On-site visit requested.')} loading={busy === 'request-visit'} disabled={!!busy}>
                <Wrench className="h-4 w-4" /> {busy === 'request-visit' ? 'Requesting…' : 'Request an on-site visit first'}
              </OutlineButton>
            </div>
          )}

          {status === 'VISIT_PENDING' && (
            <PrimaryButton onClick={() => act('visit-done', 'Visit marked complete — visit fee held.')} loading={busy === 'visit-done'} disabled={!!busy}>
              <Check className="h-4 w-4" /> {busy === 'visit-done' ? 'Updating…' : 'Mark visit complete'}
            </PrimaryButton>
          )}

          {status === 'VISIT_DONE' && !showQuote && (
            <GoldButton onClick={() => setShowQuote(true)} disabled={!!busy}>Send a quote</GoldButton>
          )}

          {status === 'QUOTED' && !showQuote && (
            <div className="space-y-3">
              {job.quoteExpiresAt && (
                <p className="text-center text-[13px] text-slate">
                  Quote expires {new Date(job.quoteExpiresAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              <OutlineButton onClick={() => setShowQuote(true)} disabled={!!busy}>Re-quote</OutlineButton>
            </div>
          )}

          {canQuote && showQuote && (
            <QuoteForm
              submitting={busy === 'quote'}
              onCancel={() => setShowQuote(false)}
              onSubmit={submitQuote}
            />
          )}

          {/* Terminal / later stages: informational only, no plug action from this card. */}
          {['QUOTE_ACCEPTED', 'ESCROW_HELD', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'RELEASED', 'CANCELLED', 'EXPIRED', 'SEARCHING_PLUG'].includes(status) && (
            <p className="text-center text-sm text-slate">No action needed from you right now.</p>
          )}
        </>
      )}
    </Shell>
  );
}

// ── Quote form ─────────────────────────────────────────────────────────────────
// The backend stores a single `amount`. Materials + labour are a client-side convenience that sum
// into that one figure — the ₦500 floor is validated here (mirroring SubmitQuoteDto) and again by
// the backend.
function QuoteForm({ submitting, onSubmit, onCancel }: { submitting: boolean; onSubmit: (amount: number) => void; onCancel: () => void }) {
  const [materials, setMaterials] = useState('');
  const [labour, setLabour] = useState('');

  const mat = Math.max(0, Math.round(Number(materials) || 0));
  const lab = Math.max(0, Math.round(Number(labour) || 0));
  const total = mat + lab;
  const belowFloor = total < QUOTE_MIN;

  return (
    <Card className="p-5">
      <p className="mb-4 font-display text-lg text-midnight">Your quote</p>
      <div className="space-y-3">
        <MoneyInput label="Materials (₦)" value={materials} onChange={setMaterials} />
        <MoneyInput label="Labour (₦)" value={labour} onChange={setLabour} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-bone/70 px-4 py-3">
        <span className="text-sm font-semibold text-slate">Total quote</span>
        <span className="font-display text-xl text-midnight tabular-nums">₦{total.toLocaleString('en-NG')}</span>
      </div>

      {belowFloor && total > 0 && (
        <p className="mt-2 text-[13px] font-semibold text-red-600">A quote must be at least ₦{QUOTE_MIN.toLocaleString('en-NG')}.</p>
      )}
      {total > QUOTE_REVIEW_CEILING && (
        <p className="mt-2 text-[13px] text-amber-700">Over ₦{QUOTE_REVIEW_CEILING.toLocaleString('en-NG')} — this goes to admin review before the client sees it.</p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-pill border border-midnight/15 bg-white py-3 text-sm font-bold text-midnight transition-colors hover:bg-bone disabled:opacity-50"
        >
          Cancel
        </button>
        <GoldButton onClick={() => onSubmit(total)} loading={submitting} disabled={submitting || belowFloor} className="flex-1">
          {submitting ? 'Sending…' : 'Send quote'}
        </GoldButton>
      </div>
    </Card>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        inputMode="numeric"
        placeholder="0"
        className="w-full rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-midnight tabular-nums placeholder:text-slate/40 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow"
      />
    </label>
  );
}

// Small button variants layered on the shared ui.tsx primitives (which only export Primary/Gold).
function DangerButton({ children, loading, disabled, onClick }: { children: React.ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-pill border border-red-500/30 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

function OutlineButton({ children, loading, disabled, onClick }: { children: React.ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-pill border border-midnight/15 bg-white py-3.5 text-sm font-bold text-midnight transition-colors hover:bg-bone disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
