// src/app/ad-minn/_components/VerificationDetail.tsx
// The per-Plug verification review panel. Opened from the Verifications tab, so ops can see what a
// Plug actually submitted before deciding — the tab used to offer approve/reject with nothing to
// look at.
//
// One section per item: the five required ones and certificates. Every decision goes through the one
// backend review route (PATCH /admin/verification/:item/:plugId); this panel has no approval logic
// of its own, and identity and BVN use that same route rather than a second mechanism.
//
// IDENTITY IS REVIEWED BY EYE HERE. Its section is the one that carries real work: the typed NIN,
// the uploaded NIN slip and the live selfie, side by side, so the reviewer can check the number on
// the slip against the typed one and the face on the slip against the selfie. The two files open
// through short-lived signed URLs, exactly like a certificate.
//
// Decrypted values are only ever visible here: the guarantor's NIN, and the Plug's own NIN and BVN.
// The dormant Didit result also still renders, but only for a Plug who ran a check before the switch
// to manual review — nothing creates new sessions.

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileBadge,
  History,
  Landmark,
  Loader2,
  Mic,
  Phone,
  RefreshCw,
  ScanFace,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Avatar, Chip, Modal, ModalError, PillButton, type Tone } from './admin-ui';

type ReviewStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'NEEDS_CHANGES' | 'REJECTED';
type ReviewableItem = 'identity' | 'bvn' | 'guarantor' | 'skills' | 'background';

type Detail = {
  plug: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    trade: string | null;
    photoUrl: string | null;
    joinedAt: string;
    isVerified: boolean;
  };
  /** The manual NIN + liveness submission — null until the Plug sends one. */
  identity: null | {
    status: ReviewStatus;
    nin: string | null;
    ninError: string | null;
    slip: { fileName: string; mimeType: string; sizeBytes: number };
    selfie: { mimeType: string; sizeBytes: number };
    submittedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  };
  /** The manually collected BVN. `nin` is the decrypted digits — the backend uses the same two keys
   *  for every decrypted number it returns, so this view reads them one way. */
  bvn: null | {
    status: ReviewStatus;
    nin: string | null;
    ninError: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  };
  /** The DORMANT Didit integration. Only populated for a Plug who ran a check before identity moved
   *  to manual review; for everyone else `hasSession` is false and the section doesn't render. */
  didit: {
    status: string;
    failureReason: string | null;
    updatedAt: string | null;
    verifiedAt: string | null;
    hasSession: boolean;
    result:
      | { fetched: false; reason: string }
      | {
          fetched: true;
          fetchedAt: string;
          summary: {
            environment: string | null;
            sessionStatus: string | null;
            lookup: {
              outcome: string | null;
              source: string | null;
              faceMatchScore: number | null;
              comparison: Array<{ field: string; result: string }>;
              attempts: number | null;
            } | null;
            risks: string[];
          };
        };
  };
  guarantor: null | {
    status: ReviewStatus;
    fullName: string;
    phone: string;
    email: string;
    relationship: string;
    signatureName: string;
    nin: string | null;
    ninError: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  };
  background: null | {
    status: ReviewStatus;
    yearsExperience: number;
    training: string;
    jobHistory: string;
    dateOfBirth: string;
    stateOfOrigin: string;
    lga: string;
    submittedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  };
  certificates: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number; uploadedAt: string }>;
  skills: null | {
    status: ReviewStatus;
    path: 'CALL' | 'VOICE_NOTE';
    requestedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
    contactPhone: string | null;
    trade: string | null;
  };
};

type AdminFetch = (input: string, init?: RequestInit) => Promise<any>;

const REVIEW_CHIP: Record<ReviewStatus | 'NOT_SUBMITTED', { tone: Tone; label: string }> = {
  NOT_SUBMITTED: { tone: 'neutral', label: 'Not submitted' },
  PENDING_REVIEW: { tone: 'gold', label: 'Pending review' },
  VERIFIED: { tone: 'green', label: 'Passed' },
  NEEDS_CHANGES: { tone: 'amber', label: 'Needs changes' },
  REJECTED: { tone: 'red', label: 'Failed' },
};

const IDENTITY_CHIP: Record<string, { tone: Tone; label: string }> = {
  NOT_STARTED: { tone: 'neutral', label: 'Not started' },
  IN_PROGRESS: { tone: 'blue', label: 'In progress' },
  IN_REVIEW: { tone: 'gold', label: 'In review at Didit' },
  APPROVED: { tone: 'green', label: 'Approved' },
  DECLINED: { tone: 'red', label: 'Declined' },
  RESUBMIT_REQUESTED: { tone: 'amber', label: 'Resubmit requested' },
  ABANDONED: { tone: 'neutral', label: 'Abandoned' },
  EXPIRED: { tone: 'neutral', label: 'Expired' },
  KYC_EXPIRED: { tone: 'amber', label: 'KYC expired' },
};

const FAILURE_LABEL: Record<string, string> = {
  NIN_NOT_FOUND: 'NIN not found at NIMC',
  NIN_DETAILS_MISMATCH: 'Name didn’t match the NIN record',
  NIN_REGISTRY_UNAVAILABLE: 'NIMC didn’t respond',
  FACE_MISMATCH: 'Selfie didn’t match the NIN photo',
  LIVENESS_FAILED: 'Selfie wasn’t live',
  BVN_USED: 'Used a BVN instead of a NIN',
  NIN_NOT_CHECKED: 'NIN never confirmed against NIMC',
  OTHER: 'Other',
};

function when(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export function VerificationDetail({
  plugId,
  adminFetch,
  onClose,
}: {
  plugId: string;
  adminFetch: AdminFetch;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await adminFetch(`/api/admin/verification/${plugId}`));
    } catch (e: any) {
      if (e?.message !== 'Session expired') setError(e?.message ?? 'Could not load this Plug’s verification.');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, plugId]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(
    async (item: ReviewableItem, status: ReviewStatus, reviewNote?: string) => {
      await adminFetch(`/api/admin/verification/${plugId}/review/${item}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(reviewNote ? { reviewNote } : {}) }),
      });
      await load();
    },
    [adminFetch, plugId, load],
  );

  const openCertificate = useCallback(
    async (id: string) => {
      const res = await adminFetch(`/api/admin/verification/${plugId}/certificates/${id}/url`);
      if (res?.url) window.open(res.url, '_blank', 'noopener,noreferrer');
    },
    [adminFetch, plugId],
  );

  /** The slip and the selfie, opened the same way a certificate is: a short-lived signed URL,
   *  fetched when ops actually click, never embedded in the page. */
  const openIdentityFile = useCallback(
    async (kind: 'slip' | 'selfie') => {
      const res = await adminFetch(`/api/admin/verification/${plugId}/identity/${kind}/url`);
      if (res?.url) window.open(res.url, '_blank', 'noopener,noreferrer');
    },
    [adminFetch, plugId],
  );

  const p = detail?.plug;

  return (
    <Modal
      size="lg"
      title={p?.name || 'Verification'}
      sub={p ? [p.trade, p.phone].filter(Boolean).join(' · ') : 'Loading submission…'}
      onClose={onClose}
    >
      {error && <ModalError>{error}</ModalError>}

      {!detail ? (
        loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Loading submission…
          </div>
        )
      ) : (
        <div className="space-y-4" data-testid="verification-detail">
          {/* Who this is — what ops need to reach them. */}
          <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-bone/60 p-4">
            <Avatar name={p!.name} photoUrl={p!.photoUrl} tone="pitch-black" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-pitch-black">{p!.name || 'Unnamed plug'}</p>
              <p className="text-xs text-slate">
                {p!.trade ?? 'No trade'} · joined {when(p!.joinedAt)}
                {p!.email ? ` · ${p!.email}` : ''}
              </p>
            </div>
            {p!.phone && (
              <a
                href={`tel:${p!.phone}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-pitch-black/10 bg-white px-3 py-1.5 text-xs font-bold text-pitch-black hover:border-gold"
              >
                <Phone className="h-3.5 w-3.5" /> {p!.phone}
              </a>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold text-slate hover:text-pitch-black disabled:opacity-40"
              title="Reload"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <IdentitySection identity={detail.identity} onOpen={openIdentityFile} onReview={review} />

            <Section
              icon={<Landmark className="h-4 w-4" />}
              title="BVN"
              chip={REVIEW_CHIP[detail.bvn?.status ?? 'NOT_SUBMITTED']}
              testId="section-bvn"
            >
              {!detail.bvn ? (
                <Empty>No BVN submitted yet.</Empty>
              ) : (
                <>
                  <Fields
                    rows={[
                      [
                        'BVN',
                        detail.bvn.nin ? (
                          <span className="font-mono tracking-wider" data-testid="bvn-digits">
                            {detail.bvn.nin}
                          </span>
                        ) : (
                          <span className="text-red-600">{detail.bvn.ninError}</span>
                        ),
                      ],
                      ['Submitted', when(detail.bvn.submittedAt)],
                    ]}
                  />
                  <p className="mt-3 text-xs text-slate">
                    Collected by hand — the Fincra lookup is built but stopped pending their KYC review of Plugr.
                    Confirm the digits with the Plug, then decide.
                  </p>
                  <ReviewNote reviewedAt={detail.bvn.reviewedAt} note={detail.bvn.reviewNote} />
                  <ReviewActions item="bvn" status={detail.bvn.status} onReview={review} />
                </>
              )}
            </Section>

            <Section
              icon={<UserCheck className="h-4 w-4" />}
              title="Guarantor"
              chip={REVIEW_CHIP[detail.guarantor?.status ?? 'NOT_SUBMITTED']}
              testId="section-guarantor"
            >
              {!detail.guarantor ? (
                <Empty>No guarantor submitted yet.</Empty>
              ) : (
                <>
                  <Fields
                    rows={[
                      ['Full name', detail.guarantor.fullName],
                      ['Phone', detail.guarantor.phone],
                      ['Email', detail.guarantor.email],
                      [
                        'NIN',
                        detail.guarantor.nin ? (
                          <span className="font-mono tracking-wider" data-testid="guarantor-nin">
                            {detail.guarantor.nin}
                          </span>
                        ) : (
                          <span className="text-red-600">{detail.guarantor.ninError}</span>
                        ),
                      ],
                      ['Relationship', detail.guarantor.relationship],
                      ['Signed as', <span className="font-display text-base">{detail.guarantor.signatureName}</span>],
                      ['Submitted', when(detail.guarantor.submittedAt)],
                    ]}
                  />
                  <ReviewNote reviewedAt={detail.guarantor.reviewedAt} note={detail.guarantor.reviewNote} />
                  <ReviewActions item="guarantor" status={detail.guarantor.status} onReview={review} />
                </>
              )}
            </Section>

            <Section
              icon={<ClipboardList className="h-4 w-4" />}
              title="Background info"
              chip={REVIEW_CHIP[detail.background?.status ?? 'NOT_SUBMITTED']}
              testId="section-background"
            >
              {!detail.background ? (
                <Empty>No background info submitted yet.</Empty>
              ) : (
                <>
                  <Fields
                    rows={[
                      ['Experience', `${detail.background.yearsExperience} year${detail.background.yearsExperience === 1 ? '' : 's'}`],
                      ['Training', detail.background.training],
                      ['Job history', detail.background.jobHistory],
                      ['Date of birth', detail.background.dateOfBirth],
                      ['State of origin', detail.background.stateOfOrigin],
                      ['LGA', detail.background.lga],
                      ['Submitted', when(detail.background.submittedAt)],
                    ]}
                  />
                  <ReviewNote reviewedAt={detail.background.reviewedAt} note={detail.background.reviewNote} />
                  <ReviewActions item="background" status={detail.background.status} onReview={review} />
                </>
              )}
            </Section>

            <Section
              icon={<Mic className="h-4 w-4" />}
              title="Skills assessment"
              chip={REVIEW_CHIP[detail.skills?.status ?? 'NOT_SUBMITTED']}
              testId="section-skills"
            >
              {!detail.skills ? (
                <Empty>Not requested yet.</Empty>
              ) : (
                <>
                  <Fields
                    rows={[
                      ['Route', detail.skills.path === 'CALL' ? 'Assessment call — ring them to agree a time' : 'WhatsApp voice note'],
                      ['Requested', when(detail.skills.requestedAt)],
                      [
                        'Call on',
                        detail.skills.contactPhone ? (
                          <a href={`tel:${detail.skills.contactPhone}`} className="font-bold text-pitch-black underline decoration-gold">
                            {detail.skills.contactPhone}
                          </a>
                        ) : (
                          '—'
                        ),
                      ],
                      ['Trade', detail.skills.trade ?? '—'],
                    ]}
                  />
                  <ReviewNote reviewedAt={detail.skills.reviewedAt} note={detail.skills.reviewNote} />
                  <ReviewActions item="skills" status={detail.skills.status} onReview={review} />
                </>
              )}
            </Section>

            <Section
              icon={<FileBadge className="h-4 w-4" />}
              title="Certificates"
              chip={{ tone: 'neutral', label: 'Optional' }}
              testId="section-certificates"
            >
              {detail.certificates.length === 0 ? (
                <Empty>None uploaded. Optional — this never holds a Plug back.</Empty>
              ) : (
                <ul className="space-y-2">
                  {detail.certificates.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-pitch-black/[0.06] px-3 py-2.5">
                      <FileBadge className="h-4 w-4 shrink-0 text-slate" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-pitch-black">{c.fileName}</p>
                        <p className="text-xs text-slate">
                          {c.mimeType === 'application/pdf' ? 'PDF' : 'JPG'} · {sizeLabel(c.sizeBytes)} · {when(c.uploadedAt)}
                        </p>
                      </div>
                      <OpenButton onOpen={() => openCertificate(c.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Only for a Plug who ran a Didit check before identity moved to manual review. */}
            {detail.didit.hasSession && <DiditSection didit={detail.didit} />}
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * The item ops actually work. Everything needed for the comparison is in one place: the number the
 * Plug typed, the slip it should appear on, and the selfie that should be the same face as the one
 * on the slip. The two files open in new tabs so a reviewer can put them side by side.
 */
function IdentitySection({
  identity,
  onOpen,
  onReview,
}: {
  identity: Detail['identity'];
  onOpen: (kind: 'slip' | 'selfie') => Promise<void>;
  onReview: (item: ReviewableItem, status: ReviewStatus, note?: string) => Promise<void>;
}) {
  return (
    <Section
      icon={<ScanFace className="h-4 w-4" />}
      title="Identity (NIN + face)"
      chip={REVIEW_CHIP[identity?.status ?? 'NOT_SUBMITTED']}
      testId="section-identity"
    >
      {!identity ? (
        <Empty>No NIN, slip or selfie submitted yet.</Empty>
      ) : (
        <>
          <Fields
            rows={[
              [
                'NIN typed',
                identity.nin ? (
                  <span className="font-mono tracking-wider" data-testid="identity-nin">
                    {identity.nin}
                  </span>
                ) : (
                  <span className="text-red-600">{identity.ninError}</span>
                ),
              ],
              ['Submitted', when(identity.submittedAt)],
            ]}
          />

          <div className="mt-3 space-y-2">
            <FileRow
              icon={<FileBadge className="h-4 w-4 shrink-0 text-slate" />}
              title={identity.slip.fileName}
              sub={`NIN slip · ${identity.slip.mimeType === 'application/pdf' ? 'PDF' : 'JPG'} · ${sizeLabel(identity.slip.sizeBytes)}`}
              onOpen={() => onOpen('slip')}
            />
            <FileRow
              icon={<Camera className="h-4 w-4 shrink-0 text-slate" />}
              title="Live selfie"
              sub={`Taken on camera · JPG · ${sizeLabel(identity.selfie.sizeBytes)}`}
              onOpen={() => onOpen('selfie')}
            />
          </div>

          <p className="mt-3 text-xs text-slate">
            Check the NIN on the slip against the number typed above, and the face on the slip against the selfie.
            Passing this verifies the Plug outright — it is not a provisional status.
          </p>

          <ReviewNote reviewedAt={identity.reviewedAt} note={identity.reviewNote} />
          <ReviewActions item="identity" status={identity.status} onReview={onReview} />
        </>
      )}
    </Section>
  );
}

/** The dormant Didit result, for a Plug who ran a check before the switch to manual review. */
function DiditSection({ didit }: { didit: Detail['didit'] }) {
  const chip = IDENTITY_CHIP[didit.status] ?? { tone: 'neutral' as Tone, label: didit.status };
  const d = didit.result;
  return (
    <Section icon={<History className="h-4 w-4" />} title="Earlier Didit check" chip={chip} testId="section-didit">
      {didit.failureReason && didit.status === 'DECLINED' && (
        <p className="mb-3 text-sm font-bold text-red-600">{FAILURE_LABEL[didit.failureReason] ?? didit.failureReason}</p>
      )}

      {'reason' in d ? (
        <p className="text-sm text-slate">{d.reason}</p>
      ) : (
        <>
          {d.summary.environment === 'sandbox' && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Sandbox session — this result is simulated, not a real NIMC check.
            </div>
          )}
          <Fields
            rows={[
              ['Didit status', d.summary.sessionStatus ?? '—'],
              ['NIN lookup', d.summary.lookup?.outcome ?? 'No lookup on this session'],
              ['Source', d.summary.lookup?.source ?? '—'],
              [
                'Face match',
                d.summary.lookup?.faceMatchScore != null ? `${d.summary.lookup.faceMatchScore.toFixed(1)} / 100` : '—',
              ],
              ...(d.summary.lookup?.comparison ?? []).map(
                (c) => [`  ${c.field.replace(/_/g, ' ')}`, <MatchResult result={c.result} />] as [string, React.ReactNode],
              ),
              ['Risk flags', d.summary.risks.length ? d.summary.risks.join(', ') : 'None'],
              ['Fetched', when(d.fetchedAt)],
            ]}
          />
        </>
      )}
      <p className="mt-3 text-xs text-slate">
        History only. This Plug ran a Didit check before identity moved to review by hand; nothing starts new checks,
        and this result decides nothing. The identity section above is what counts.
      </p>
    </Section>
  );
}

/** One openable file. Same shape as a certificate row, because it is the same idea. */
function FileRow({
  icon,
  title,
  sub,
  onOpen,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onOpen: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-pitch-black/[0.06] px-3 py-2.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-pitch-black">{title}</p>
        <p className="text-xs text-slate">{sub}</p>
      </div>
      <OpenButton onOpen={onOpen} />
    </div>
  );
}

function MatchResult({ result }: { result: string }) {
  const tone = result === 'match' ? 'text-emerald-700' : result === 'partial' ? 'text-amber-700' : 'text-red-600';
  return <span className={cn('font-bold', tone)}>{result.replace(/_/g, ' ')}</span>;
}

function Section({
  icon,
  title,
  chip,
  testId,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  chip: { tone: Tone; label: string };
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-pitch-black/[0.08] bg-white p-4" data-testid={testId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-bold text-pitch-black">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-pitch-black/[0.05] text-slate">{icon}</span>
          {title}
        </h4>
        <Chip tone={chip.tone}>{chip.label}</Chip>
      </div>
      {children}
    </section>
  );
}

function Fields({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="whitespace-pre text-slate">{k}</dt>
          <dd className="min-w-0 break-words text-pitch-black">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate">{children}</p>;
}

function ReviewNote({ reviewedAt, note }: { reviewedAt: string | null; note: string | null }) {
  if (!reviewedAt) return null;
  return (
    <p className="mt-3 rounded-2xl bg-bone/70 px-3 py-2 text-xs text-slate">
      Reviewed {when(reviewedAt)}
      {note ? (
        <>
          {' — '}
          <span className="text-pitch-black">“{note}”</span>
        </>
      ) : null}
    </p>
  );
}

function OpenButton({ onOpen }: { onOpen: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        setFailed(false);
        try {
          await onOpen();
        } catch {
          setFailed(true);
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-pitch-black/10 px-3 py-1.5 text-xs font-bold text-pitch-black hover:border-gold disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
      {failed ? 'Retry' : 'Open'}
    </button>
  );
}

/**
 * Pass / needs changes / fail. Sending something back requires a note — it is shown to the Plug,
 * and without it they can't tell what to fix. The backend enforces that too.
 */
function ReviewActions({
  item,
  status,
  onReview,
}: {
  item: ReviewableItem;
  status: ReviewStatus;
  onReview: (item: ReviewableItem, status: ReviewStatus, note?: string) => Promise<void>;
}) {
  const [pending, setPending] = useState<ReviewStatus | null>(null);
  const [noteFor, setNoteFor] = useState<'NEEDS_CHANGES' | 'REJECTED' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(next: ReviewStatus, withNote?: string) {
    setPending(next);
    setError(null);
    try {
      await onReview(item, next, withNote);
      setNoteFor(null);
      setNote('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not save that decision.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4 border-t border-pitch-black/[0.06] pt-3" data-testid={`review-${item}`}>
      {noteFor ? (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-pitch-black" htmlFor={`note-${item}`}>
            {noteFor === 'NEEDS_CHANGES' ? 'What should they change?' : 'Why didn’t it pass?'}{' '}
            <span className="font-normal text-slate">— the Plug sees this</span>
          </label>
          <textarea
            id={`note-${item}`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-2xl border border-pitch-black/10 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            <PillButton
              variant={noteFor === 'REJECTED' ? 'primary' : 'gold'}
              className="px-4 py-2 text-xs"
              loading={pending === noteFor}
              disabled={!note.trim()}
              onClick={() => submit(noteFor, note.trim())}
            >
              {noteFor === 'NEEDS_CHANGES' ? 'Send back for changes' : 'Mark failed'}
            </PillButton>
            <PillButton variant="ghost" className="px-3 py-2 text-xs" onClick={() => setNoteFor(null)}>
              Cancel
            </PillButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <PillButton
            variant="primary"
            className="px-4 py-2 text-xs"
            loading={pending === 'VERIFIED'}
            disabled={status === 'VERIFIED'}
            onClick={() => submit('VERIFIED')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Pass
          </PillButton>
          <PillButton variant="outline" className="px-4 py-2 text-xs" onClick={() => setNoteFor('NEEDS_CHANGES')}>
            Needs changes
          </PillButton>
          <button
            onClick={() => setNoteFor('REJECTED')}
            className="rounded-pill border border-red-500/30 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            Fail
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}
