// src/app/app/jobs/[jobId]/page.tsx
// Client job page — one screen that follows a job through the backend quote flow:
// finding a Plug → scoping → (visit fee) → quote: accept / decline → pay into the job's own Anchor
// account → the Plug's work steps → confirm the work is done (or raise an issue).
//
// Everything goes through same-origin proxies under /api/client/jobs/[jobId]/* that forward the
// client's login token to the NestJS backend, which owns the job state and the money. Payment is
// confirmed by GET /jobs/:id/payment, which re-reads the Anchor account's ledger — so polling it
// while money is owed confirms a transfer even if the Anchor webhook never arrives.
//
// Booking itself stays switched off on the web (see RequestPlugButton): clients reach this page
// from My Jobs, or a link to it.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Copy, Loader2, ShieldCheck, X } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card, Divider, GhostButton, GoldButton, Money, PrimaryButton, TextArea } from '@/src/components/ui';
import { JobDetailSkeleton } from '@/src/components/Skeleton';
import { apiFetch } from '@/src/lib/api-client';
import { getToken } from '@/src/lib/api';
import { rungFor, LADDER_LENGTH, type LadderTone } from '@/src/lib/jobStatusLadder';

type Job = {
  id: string;
  status: string;
  title?: string | null;
  description?: string | null;
  address?: string | null;
  jobAmount?: number | null;
  materialsAmount?: number | null;
  labourAmount?: number | null;
  visitFeeAmount?: number | null;
  visitFeeStatus?: string | null;
  quoteExpiresAt?: string | null;
  escrowStatus?: string | null;
  complaintWindowClosesAt?: string | null;
  disputeRaised?: boolean | null;
  plug?: { user?: { name?: string | null } | null } | null;
  category?: { name?: string | null; code?: string | null } | null;
};

type Collection = {
  kind: 'JOB' | 'VISIT_FEE';
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
  amount: number;
  paid: number;
  closed: boolean;
};

type Payment = { status: string; collections: Collection[]; checkFailed: boolean };

// The shared ladder's client wording, except where it would mislead a client who has already paid:
// ESCROW_HELD shares "Quote accepted, pay to start" with QUOTE_ACCEPTED in the product ladder.
const CLIENT_LABEL: Record<string, string> = { ESCROW_HELD: 'Payment secured' };
const clientLabel = (status: string) => CLIENT_LABEL[status] ?? rungFor(status).canonical;

const TONE_CLASS: Record<LadderTone, string> = {
  gold: 'bg-gold/15 text-[#8a5a08]',
  blue: 'bg-blue-500/12 text-blue-700',
  amber: 'bg-amber-500/15 text-amber-700',
  indigo: 'bg-indigo-500/12 text-indigo-700',
  green: 'bg-emerald-500/12 text-emerald-700',
  red: 'bg-red-500/12 text-red-700',
  neutral: 'bg-slate/12 text-slate',
};

/** States where money is owed — poll the payment endpoint (it syncs the Anchor ledger). */
const OWES_MONEY = ['VISIT_PENDING', 'QUOTE_ACCEPTED'];
/** States where the job moves without the client — refresh the job now and then. */
const IN_MOTION = ['PENDING', 'SEARCHING_PLUG', 'PLUG_ASSIGNED', 'IN_DISCUSSION', 'VISIT_DONE', 'ESCROW_HELD', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];

const naira = (n: number | null | undefined) => `₦${Math.round(Number(n ?? 0)).toLocaleString('en-NG')}`;
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function ClientJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<'decline' | 'dispute' | null>(null);
  const [reason, setReason] = useState('');

  const loadJob = useCallback(async () => {
    try {
      setJob(await apiFetch(`/api/client/jobs/${jobId}`));
    } catch (e: any) {
      setError(e?.message || 'Could not load this job.');
    }
  }, [jobId]);

  const statusRef = useRef<string | null>(null);
  statusRef.current = job?.status ?? null;

  const loadPayment = useCallback(async () => {
    try {
      const p: Payment = await apiFetch(`/api/client/jobs/${jobId}/payment`);
      setPayment(p);
      // The ledger sync can move the job (e.g. paid → ESCROW_HELD); reload it when that happens.
      if (statusRef.current && p.status !== statusRef.current) void loadJob();
    } catch {
      /* keep the last figures; the next poll retries */
    }
  }, [jobId, loadJob]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/app/auth/login');
      return;
    }
    void loadJob();
  }, [loadJob, router]);

  const status = job?.status ?? '';

  // Poll while money is owed (5s) or while the Plug is moving the job along (15s).
  useEffect(() => {
    if (!job) return;
    if (OWES_MONEY.includes(status)) {
      void loadPayment();
      const id = setInterval(loadPayment, 5000);
      return () => clearInterval(id);
    }
    if (IN_MOTION.includes(status)) {
      const id = setInterval(loadJob, 15000);
      return () => clearInterval(id);
    }
  }, [job, status, loadPayment, loadJob]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  async function act(key: string, path: string, init: RequestInit, okMsg: string) {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      await apiFetch(`/api/client/jobs/${jobId}/${path}`, init);
      flash(okMsg);
      setPanel(null);
      setReason('');
      await loadJob();
    } catch (e: any) {
      setError(e?.message || 'That could not be completed.');
    } finally {
      setBusy(null);
    }
  }

  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const meta = rungFor(status);
  const jobCollection = payment?.collections.find((c) => c.kind === 'JOB' && !c.closed);
  const visitCollection = payment?.collections.find((c) => c.kind === 'VISIT_FEE' && !c.closed);
  const visitFee = Math.round(Number(job?.visitFeeAmount ?? 0));
  const quoteTotal = Math.round(Number(job?.jobAmount ?? 0));
  const visitFeeCredited = job?.visitFeeStatus === 'held' || job?.visitFeeStatus === 'released';
  const youPay = Math.max(0, quoteTotal - (visitFeeCredited ? visitFee : 0));
  const windowOpen =
    status === 'COMPLETED' &&
    job?.escrowStatus === 'locked' &&
    !!job?.complaintWindowClosesAt &&
    new Date(job.complaintWindowClosesAt).getTime() > Date.now();

  return (
    <Shell eyebrow="Your job" title={job?.title || 'Job'} back="/app/jobs">
      {!job && !error && <JobDetailSkeleton />}

      {error && !job && (
        <Card className="p-4 border-red-200">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button onClick={() => { setError(null); void loadJob(); }} className="mt-3 text-sm font-bold text-pitch-black underline underline-offset-4 hover:text-gold">
            Try again
          </button>
        </Card>
      )}

      {job && (
        <>
          {toast && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{toast}</div>
          )}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* ── Where the job is ─────────────────────────────────────────────── */}
          <Card className="p-6 mb-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">
                {job.category?.name ?? job.category?.code ?? 'Service'}
                {job.plug?.user?.name ? ` · ${job.plug.user.name}` : ''}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${TONE_CLASS[meta.tone]}`}>
                {clientLabel(status)}
              </span>
            </div>
            {job.description && <p className="text-sm leading-relaxed text-slate">{job.description}</p>}
            {meta.step > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate/60">Step {meta.step} of {LADDER_LENGTH}</p>
                <div className="flex gap-1" aria-hidden>
                  {Array.from({ length: LADDER_LENGTH }, (_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-pill ${i < meta.step ? 'bg-gold' : 'bg-pitch-black/10'}`} />
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ── Before a quote ───────────────────────────────────────────────── */}
          {['PENDING', 'SEARCHING_PLUG'].includes(status) && (
            <Note>We’re matching you with a verified Plug. You’ll hear from us as soon as one accepts.</Note>
          )}
          {['PLUG_ASSIGNED', 'IN_DISCUSSION'].includes(status) && (
            <Note>Your Plug is looking at the job. Their quote will appear here.</Note>
          )}
          {status === 'VISIT_DONE' && <Note>Visit done. Your Plug is pricing the work — the quote will appear here.</Note>}

          {/* ── Visit fee ────────────────────────────────────────────────────── */}
          {status === 'VISIT_PENDING' && (
            <PayInto
              title="Pay the visit fee"
              note={`Your Plug needs to see the problem first. Pay the ${naira(visitFee)} visit fee to book the visit — it’s taken off your final quote.`}
              collection={visitCollection}
              checkFailed={payment?.checkFailed}
            />
          )}

          {/* ── Quote ────────────────────────────────────────────────────────── */}
          {status === 'QUOTED' && (
            <Card className="p-6 mb-5">
              <p className="mb-4 font-display text-lg text-pitch-black">Your quote</p>
              <dl className="space-y-2.5 text-sm">
                <Row label="Materials" value={naira(job.materialsAmount)} />
                <Row label="Labour" value={naira(job.labourAmount)} />
                <Divider className="my-3" />
                <Row label="Total" value={<Money amount={quoteTotal} size="sm" />} />
                {visitFeeCredited && visitFee > 0 && <Row label="Visit fee already paid" value={`− ${naira(visitFee)}`} />}
                <Row label="You pay now" value={<span className="font-display text-lg">{naira(youPay)}</span>} />
              </dl>
              {job.quoteExpiresAt && <p className="mt-4 text-[13px] text-slate">This quote expires {when(job.quoteExpiresAt)}.</p>}

              {panel !== 'decline' ? (
                <div className="mt-5 space-y-3">
                  <GoldButton
                    onClick={() => act('accept', 'quote/accept', { method: 'PATCH' }, 'Quote accepted — your payment details are being set up.')}
                    loading={busy === 'accept'}
                    disabled={!!busy}
                  >
                    {busy === 'accept' ? 'Accepting…' : `Accept and pay ${naira(youPay)}`}
                  </GoldButton>
                  <GhostButton onClick={() => setPanel('decline')} disabled={!!busy} className="w-full">
                    Decline the quote
                  </GhostButton>
                </div>
              ) : (
                <ReasonPanel
                  label="Why are you declining? (optional)"
                  value={reason}
                  onChange={setReason}
                  confirmLabel="Decline the quote"
                  busy={busy === 'decline'}
                  onCancel={() => { setPanel(null); setReason(''); }}
                  onConfirm={() => act('decline', 'quote/decline', json('PATCH', { reason }), 'Quote declined. The job is cancelled.')}
                />
              )}
            </Card>
          )}

          {/* ── Pay for the job ──────────────────────────────────────────────── */}
          {status === 'QUOTE_ACCEPTED' && (
            <PayInto
              title={`Pay ${naira(jobCollection?.amount ?? youPay)}`}
              note="Transfer the exact amount to this account. Your money is held securely and only released to your Plug after you confirm the work is done."
              collection={jobCollection}
              checkFailed={payment?.checkFailed}
            />
          )}

          {/* ── The work ─────────────────────────────────────────────────────── */}
          {['ESCROW_HELD', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(status) && (
            <Note icon>
              {status === 'ESCROW_HELD' && 'Payment received and held securely. Your Plug will set off soon.'}
              {status === 'EN_ROUTE' && 'Your Plug is on the way.'}
              {status === 'ARRIVED' && 'Your Plug has arrived.'}
              {status === 'IN_PROGRESS' && 'The work is in progress.'}
            </Note>
          )}

          {/* ── Confirm ──────────────────────────────────────────────────────── */}
          {status === 'AWAITING_CONFIRM' && (
            <Card className="p-6 mb-5">
              <p className="font-display text-lg text-pitch-black">Is the job done?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">
                Your Plug has marked the work finished. Confirm when you’re happy — your payment is released to them 24 hours later. If something isn’t right, raise it now and we’ll hold the payment.
              </p>
              {panel !== 'dispute' ? (
                <div className="mt-5 space-y-3">
                  <GoldButton
                    onClick={() => act('confirm', 'confirm', { method: 'PATCH' }, 'Thanks — the job is confirmed.')}
                    loading={busy === 'confirm'}
                    disabled={!!busy}
                  >
                    <Check className="h-4 w-4" /> {busy === 'confirm' ? 'Confirming…' : 'Yes, the job is done'}
                  </GoldButton>
                  <GhostButton onClick={() => setPanel('dispute')} disabled={!!busy} className="w-full">
                    Something’s wrong
                  </GhostButton>
                </div>
              ) : (
                disputePanel()
              )}
            </Card>
          )}

          {status === 'COMPLETED' && (
            <Card className="p-6 mb-5">
              <p className="font-display text-lg text-pitch-black">Job complete</p>
              {windowOpen ? (
                <>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate">
                    Your payment releases to your Plug on {when(job.complaintWindowClosesAt)}. Still have a problem? You can raise it until then.
                  </p>
                  {panel !== 'dispute' ? (
                    <GhostButton onClick={() => setPanel('dispute')} disabled={!!busy} className="mt-4 w-full">
                      Raise an issue
                    </GhostButton>
                  ) : (
                    disputePanel()
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-sm leading-relaxed text-slate">Thanks for using Plugr. Your Plug has been paid.</p>
              )}
            </Card>
          )}

          {status === 'DISPUTED' && <Note>We’re looking into the issue you raised. Your payment is on hold until it’s resolved — we’ll be in touch.</Note>}
          {status === 'CANCELLED' && <Note>This job was cancelled.</Note>}
          {status === 'EXPIRED' && <Note>This job expired.</Note>}
        </>
      )}
    </Shell>
  );

  // A plain function, NOT a component: declared inside the page, a component would be a new type on
  // every render, remounting the text box (and dropping focus) on each keystroke.
  function disputePanel() {
    return (
      <ReasonPanel
        label="What went wrong?"
        value={reason}
        onChange={setReason}
        confirmLabel="Raise the issue"
        required
        busy={busy === 'dispute'}
        onCancel={() => { setPanel(null); setReason(''); }}
        onConfirm={() => act('dispute', 'dispute', json('POST', { reason }), 'Issue raised — your payment is on hold while we look into it.')}
      />
    );
  }
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function PayInto({ title, note, collection, checkFailed }: { title: string; note: string; collection?: Collection; checkFailed?: boolean }) {
  const [copied, setCopied] = useState(false);
  const paid = collection?.paid ?? 0;
  const amount = collection?.amount ?? 0;
  const partial = paid > 0 && paid + 0.005 < amount;

  function copy() {
    if (!collection?.accountNumber) return;
    navigator.clipboard?.writeText(collection.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="p-6 mb-5">
      <p className="font-display text-lg text-pitch-black">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate">{note}</p>

      {!collection?.accountNumber ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Setting up your payment account…
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-pitch-black/[0.07] bg-white p-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Transfer to</p>
              <p className="mt-1 font-display text-[1.75rem] leading-none tracking-wide text-pitch-black tabular-nums">{collection.accountNumber}</p>
              <p className="mt-2 text-sm text-slate">{collection.bankName}</p>
              {collection.accountName && <p className="mt-0.5 text-xs text-slate">Account name · {collection.accountName}</p>}
            </div>
            <button
              onClick={copy}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-pitch-black/10 px-3 py-2 text-[13px] font-bold text-pitch-black transition-colors hover:border-gold hover:text-gold"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2.5 text-sm text-pitch-black">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <span className="font-medium">
              {partial ? `Received ${naira(paid)} of ${naira(amount)} — send the rest to finish.` : 'Waiting for your transfer…'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate/80">
            This updates by itself once your transfer lands — no need to refresh.
            {checkFailed ? ' (We couldn’t reach the bank just now; still checking.)' : ''}
          </p>
        </>
      )}
    </Card>
  );
}

function Note({ children, icon }: { children: React.ReactNode; icon?: boolean }) {
  return (
    <Card className="p-5 mb-5">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15">
            <ShieldCheck className="h-5 w-5 text-gold" />
          </span>
        )}
        <p className="text-sm leading-relaxed text-slate">{children}</p>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate">{label}</dt>
      <dd className="font-semibold text-pitch-black">{value}</dd>
    </div>
  );
}

function ReasonPanel({
  label, value, onChange, confirmLabel, onConfirm, onCancel, busy, required,
}: {
  label: string; value: string; onChange: (v: string) => void; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; busy: boolean; required?: boolean;
}) {
  return (
    <div className="mt-5 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate">{label}</span>
        <TextArea value={value} onChange={(e) => onChange(e.target.value)} rows={3} maxLength={1000} />
      </label>
      <div className="flex gap-3">
        <GhostButton onClick={onCancel} disabled={busy} className="flex-1">Back</GhostButton>
        <PrimaryButton onClick={onConfirm} loading={busy} disabled={busy || (required && !value.trim())} className="flex-1">
          {confirmLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
