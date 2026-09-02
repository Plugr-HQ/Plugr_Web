// app/disputes/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Gavel } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';
import { Section, SubSection, BulletList, Note, LegalHeader } from '@/src/components/legal/LegalPageParts';

export const metadata: Metadata = {
  title: 'Dispute Resolution Policy | Plugr',
  description: 'How disagreements over a Job are reported, reviewed, and resolved on Plugr.',
};

export default function DisputeResolutionPage() {
  return (
    <main className="min-h-screen bg-bone text-pitch-black font-body antialiased">
      {/* Nav — matches the landing */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-bone/80 backdrop-blur border-b border-pitch-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <PlugrWordmark className="h-6 text-pitch-black" />
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/app/browse"
              className="inline-flex items-center gap-1.5 rounded-pill bg-gold text-pitch-black text-sm font-bold px-4 sm:px-5 py-2.5 hover:bg-gold-light active:scale-95 transition-all"
            >
              Use Plugr <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <LegalHeader
        eyebrow="Legal"
        title="Dispute Resolution"
        highlight="Policy"
        version="Version 1.0 &nbsp;·&nbsp; Effective July 2026 &nbsp;·&nbsp; getplugr.com"
      />

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <p className="flex-1 text-[15px] leading-relaxed text-slate">
            This Policy explains how disagreements arising from a Job &mdash; between a Client and a Plug,
            or between a user and Plugr &mdash; are reported, reviewed, and resolved. It forms part of, and
            should be read together with, our{' '}
            <Link href="/terms" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Terms of Service
            </Link>
            .
          </p>
          <a
            href="/Plugr_Dispute_Resolution_Policy.pdf"
            download
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill border border-pitch-black/15 bg-white text-pitch-black text-sm font-bold px-5 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <Section number="1" title="Scope">
          <p className="text-sm text-slate mb-4">This Policy covers disputes about:</p>
          <BulletList items={[
            'Non-performance or incomplete performance of a Job.',
            'Quality of Services rendered.',
            'Payment amounts, refunds, or cancellation charges.',
            'Misconduct or misrepresentation by a Client or Plug.',
            'Disagreements about a Plug&rsquo;s verification status or a Client&rsquo;s account status.',
          ]} />
          <Note>
            This Policy does not cover criminal conduct (theft, assault, fraud) &mdash; report that to the
            Nigeria Police Force in addition to Plugr &mdash; or data protection complaints, which are
            handled under our{' '}
            <Link href="/privacy" className="text-pitch-black font-semibold underline decoration-gold/60">
              Privacy Policy
            </Link>{' '}
            and may separately be escalated to the Nigeria Data Protection Commission.
          </Note>
        </Section>

        <Section number="2" title="How to Report a Dispute">
          <p className="text-sm text-slate mb-4">
            A dispute must be reported within seven (7) days of the Job&rsquo;s scheduled completion date,
            through one of the following channels:
          </p>
          <BulletList items={[
            'The Plugr WhatsApp bot, using the dispute/support option.',
            'The Plugr app support section.',
            'Direct contact with support@getplugr.com.',
          ]} />
          <p className="text-sm text-slate mt-4">
            When reporting, provide the Job reference, a description of the issue, and any supporting
            evidence (photos, messages, receipts). Disputes reported after the seven-day window may still
            be reviewed at Plugr&rsquo;s discretion, but timely reporting materially improves the chances of
            a fair outcome.
          </p>
        </Section>

        <Section number="3" title="Resolution Process">
          <SubSection title="Step 1 — Acknowledgement (within 24 hours)">
            <p className="text-sm text-slate">
              Plugr acknowledges receipt of the dispute. Where the Job involved a payment held pending
              confirmation, that payment may be placed on hold pending resolution.
            </p>
          </SubSection>
          <SubSection title="Step 2 — Fact-finding (within 3–5 business days)">
            <p className="text-sm text-slate">
              Plugr&rsquo;s support team reviews the evidence submitted by both parties. Both the Client and
              the Plug are given a fair opportunity to respond to the other party&rsquo;s account before a
              decision is made.
            </p>
          </SubSection>
          <SubSection title="Step 3 — Decision">
            <p className="text-sm text-slate mb-2">Based on the evidence, Plugr will issue one of the following outcomes:</p>
            <BulletList items={[
              'Full refund to the Client.',
              'Partial refund.',
              'Release of payment to the Plug.',
              'A requirement that the Plug remedy or redo the work at no extra cost, where feasible.',
              'No action, where the evidence does not support the complaint.',
            ]} />
            <p className="text-sm text-slate mt-3">
              Plugr will communicate its decision, and the reasoning behind it, to both parties in writing.
            </p>
          </SubSection>
          <SubSection title="Step 4 — Escalation">
            <p className="text-sm text-slate">
              If either party disagrees with the outcome, they may request a second-level review by a more
              senior member of the Plugr team within 3 days of receiving the decision. This is the final
              stage of Plugr&rsquo;s internal process.
            </p>
          </SubSection>
        </Section>

        <Section number="4" title="Repeat or Serious Issues">
          <p className="text-sm text-slate">
            Where a dispute reveals a pattern of misconduct, repeated poor performance, or a serious breach
            of the Terms of Service, Plugr may suspend or permanently remove the relevant account,
            independent of the specific dispute outcome.
          </p>
        </Section>

        <Section number="5" title="Payment Handling During a Dispute">
          <p className="text-sm text-slate">
            Where the Platform&rsquo;s payment flow holds funds pending Job confirmation, those funds remain
            on hold for the duration of an active dispute and are released or refunded only once a decision
            under Section 3 is reached. Plugr will not unreasonably delay this process.
          </p>
        </Section>

        <Section number="6" title="External Escalation">
          <p className="text-sm text-slate">
            If a dispute is not resolved to a party&rsquo;s satisfaction through Plugr&rsquo;s internal
            process, either party may pursue resolution through mediation, arbitration, or the courts, as
            set out in the{' '}
            <Link href="/terms" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Terms of Service
            </Link>
            . Plugr encourages parties to attempt resolution through its internal process first, as it is
            faster and free of charge.
          </p>
        </Section>

        <Section number="7" title="Good Faith">
          <p className="text-sm text-slate">
            Both Clients and Plugs are expected to engage with the dispute process honestly and in good
            faith. Submitting false evidence or knowingly making a false complaint is a breach of the Terms
            of Service and may result in account suspension.
          </p>
        </Section>

        <Section number="8" title="Changes to This Policy">
          <p className="text-sm text-slate">
            Plugr may update this Policy from time to time. Material changes will be communicated through
            the Platform before taking effect.
          </p>
        </Section>

        <Section number="9" title="Contact Us">
          <div className="rounded-[24px] bg-pitch-black text-white p-8 mt-2 text-center">
            <span className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-2xl bg-gold/15">
              <Gavel className="w-6 h-6 text-gold" />
            </span>
            <p className="font-display text-xl text-white">Plugr Technologies Limited</p>
            <p className="text-bone-muted text-sm mt-1">A subsidiary of Alhazen · Lagos, Nigeria</p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-bone-muted"><span className="text-white font-semibold">Dispute support:</span> support@getplugr.com</p>
              <p className="text-bone-muted"><span className="text-white font-semibold">Website:</span> getplugr.com</p>
            </div>
          </div>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}