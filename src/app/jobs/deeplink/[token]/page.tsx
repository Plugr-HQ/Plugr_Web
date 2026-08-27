// src/app/jobs/deeplink/[token]/page.tsx
// Landing page for the "View on Dashboard" button on the plug_new_job WhatsApp template.
//
// The template's dynamic-URL button points at <PUBLIC_WEB_URL>/jobs/deeplink/<token>. Until now
// nothing served that path (and the backend route wasn't registered either), so every assignment
// notification carried a button that 404'd.
//
// Deliberately read-only: the signed token authorizes viewing THIS one job, not a session. Acting
// on the job (accept / decline / quote) still goes through the logged-in job card, which this page
// links to.

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MapPin, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card } from '@/src/components/ui';

// Mirrors the M1 JobStatus values; same wording as the Plug job card.
const STATUS_LABEL: Record<string, string> = {
  PLUG_ASSIGNED: 'New assignment',
  IN_DISCUSSION: 'In discussion',
  VISIT_PENDING: 'Visit requested',
  VISIT_DONE: 'Visit done',
  QUOTED: 'Quote sent',
  QUOTE_ACCEPTED: 'Quote accepted',
  ESCROW_HELD: 'Paid into escrow',
  EN_ROUTE: 'En route',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In progress',
  AWAITING_CONFIRM: 'Awaiting confirmation',
  COMPLETED: 'Completed',
  RELEASED: 'Released',
  SEARCHING_PLUG: 'Back in the queue',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

type Job = {
  id: string;
  title?: string | null;
  job_description?: string | null;
  job_status?: string | null;
  quote_amount?: number | null;
  category?: string | null;
  address?: string | null;
  client_name?: string | null;
};

export default function JobDeepLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/deeplink/${token}`, { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(data?.error ?? 'This link could not be opened.');
          return;
        }
        setJob(data?.job ?? null);
      } catch {
        if (!cancelled) setError('We could not reach the server. Check your connection and try again.');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (error) {
    return (
      <Shell eyebrow="Job" title="Can’t open this link" subtitle="" back="/app" footer={null}>
        <Card className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm text-midnight">{error}</p>
            <Link
              href="/app/plug"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-midnight underline underline-offset-4 hover:text-gold"
            >
              Open your dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  if (!job) {
    return (
      <Shell eyebrow="Job" title="Loading…" subtitle="" back="/app" footer={null}>
        <div className="flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Opening your job…
        </div>
      </Shell>
    );
  }

  const status = job.job_status ?? '';
  const heading = job.title || job.job_description || 'Your job';

  return (
    <Shell eyebrow="Your assignment" title={heading} subtitle="" back="/app" footer={null}>
      <Card className="space-y-3 p-4">
        {status && (
          <span className="inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a5a08]">
            {STATUS_LABEL[status] ?? status}
          </span>
        )}

        {job.job_description && <p className="text-sm leading-relaxed text-midnight">{job.job_description}</p>}

        <div className="space-y-2 pt-1 text-sm text-slate">
          {job.category && <p className="font-semibold text-midnight">{job.category}</p>}
          {job.address && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gold" /> {job.address}
            </p>
          )}
          {job.client_name && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-gold" /> {job.client_name}
            </p>
          )}
          {/* null until a quote is actually submitted — never render a placeholder figure. */}
          <p className="text-[13px]">
            {job.quote_amount != null
              ? `Quote: ₦${Number(job.quote_amount).toLocaleString('en-NG')}`
              : 'No quote yet — you set the price after scoping the work.'}
          </p>
        </div>
      </Card>

      <p className="mt-4 px-1 text-xs text-slate/80">
        This is a read-only preview from your WhatsApp link. Log in to accept, decline or quote.
      </p>

      <Link
        href={`/app/plug-job/${job.id}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-midnight py-3.5 text-sm font-bold text-white transition-colors hover:bg-deep-blue"
      >
        Open the full job card <ArrowRight className="h-4 w-4" />
      </Link>
    </Shell>
  );
}
