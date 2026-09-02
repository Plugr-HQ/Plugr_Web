// app/consent/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, FileCheck2 } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';
import { Section, SubSection, BulletList, Note, LegalHeader, ConsentItem } from '@/src/components/legal/LegalPageParts';

/**
 * NOTE: this page renders the itemized consent record described in the Data Consent &
 * Processing Agreement, and lets a user review + tick each item. It is NOT yet wired to
 * the backend — submission currently just logs to console. Once ConsentRecord exists in
 * the schema, wire handleSubmit to POST { consentType, agreed, docVersion, channel } per
 * item in a single transaction with account creation, per the plan in plugr-whatsapp-onboarding.
 */

const DOC_VERSION = '2026-08-06';

export default function DataConsentPage() {
  const [role, setRole] = useState<'client' | 'plug'>('client');
  const [accountCreation, setAccountCreation] = useState(false);
  const [identityVerification, setIdentityVerification] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requiredComplete =
    accountCreation && dataSharing && (role === 'client' || identityVerification);

  function handleSubmit() {
    if (!requiredComplete) return;
    // TODO: replace with a real submission once ConsentRecord + the signup endpoint exist.
    // Expected shape per item: { userId, consentType, agreed: true, docVersion: DOC_VERSION, channel: 'web_app' }
    console.log('[consent] would submit', {
      role,
      docVersion: DOC_VERSION,
      items: {
        ACCOUNT_CREATION: accountCreation,
        IDENTITY_VERIFICATION: role === 'plug' ? identityVerification : undefined,
        DATA_SHARING: dataSharing,
        MARKETING: marketing,
      },
    });
    setSubmitted(true);
  }

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
        title="Data Consent &"
        highlight="Processing"
        version={`Version ${DOC_VERSION} &nbsp;·&nbsp; getplugr.com`}
      />

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <p className="flex-1 text-[15px] leading-relaxed text-slate">
            This Agreement works alongside our{' '}
            <Link href="/privacy" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Privacy Policy
            </Link>
            . Where the Privacy Policy explains, in general terms, how Plugr handles personal data, this
            page is where you give &mdash; and can review &mdash; specific, itemized consent for each way
            we use your data. Required items are necessary to create an account; optional items you can
            decline without affecting your access to the Platform.
          </p>
          <a
            href="/Plugr_Data_Consent_Agreement.pdf"
            download
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill border border-pitch-black/15 bg-white text-pitch-black text-sm font-bold px-5 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <Section number="1" title="Who This Covers">
          <p className="text-sm text-slate">
            This Agreement applies to every Plugr user &mdash; both Clients and Plugs. What you&rsquo;re
            asked to consent to differs slightly by role: Plugs additionally consent to identity
            verification, since that data category doesn&rsquo;t apply to Clients.
          </p>
        </Section>

        <Section number="2" title="What We Collect, By Role">
          <SubSection title="If you register as a Client">
            <BulletList items={[
              'Full name, phone number, and email address.',
              'Delivery/service address and approximate location for job matching.',
              'Payment information, processed via Alatpay.',
              'Job requests, messages, and transaction history.',
              'WhatsApp interaction data relevant to bot conversations and support.',
            ]} />
          </SubSection>
          <SubSection title="If you register as a Plug">
            <BulletList items={[
              'Full name, phone number, and email address.',
              'National Identification Number (NIN) and other government-issued identity documents submitted for verification.',
              'Photographs, category/skill selection, and work history or references.',
              'Location data for job matching.',
              'Verification status and results returned by our identity verification partner.',
              'Job history, ratings, and transaction/payment records.',
            ]} />
          </SubSection>
        </Section>

        <Section number="3" title="Why We Process It">
          <BulletList items={[
            'Identity verification of Plugs, to confirm a real, traceable individual is behind each profile.',
            'Account creation and authentication via WhatsApp OTP.',
            'Matching Clients with Plugs by category, location, and availability.',
            'Processing payments and maintaining transaction records.',
            'Providing customer support and resolving disputes.',
            'Platform security, fraud prevention, and abuse monitoring.',
            'Service communications — booking confirmations, OTPs, status updates.',
            'Marketing communications about new features or promotions — optional, opt-in only.',
          ]} />
        </Section>

        <Section number="4" title="Your Rights">
          <p className="text-sm text-slate">
            You may withdraw consent for any optional item at any time from your account settings. Under
            the NDPA 2023 you also have rights of access, correction, erasure, and complaint to the NDPC —
            see the{' '}
            <Link href="/privacy" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Privacy Policy
            </Link>{' '}
            for the full list. Withdrawing consent for a required item (e.g. identity verification, if
            you&rsquo;re a Plug) may mean we can no longer provide that part of the service to you.
          </p>
        </Section>

        <Section number="5" title="Give Your Consent">
          <p className="text-sm text-slate mb-6">
            Select your role, then review and check each item below.
          </p>

          <div className="flex gap-2 mb-6">
            {(['client', 'plug'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-pill px-5 py-2 text-sm font-bold capitalize transition-colors ${
                  role === r ? 'bg-pitch-black text-white' : 'bg-white text-pitch-black border border-pitch-black/15 hover:border-gold'
                }`}
              >
                I&rsquo;m a {r === 'plug' ? 'Plug' : 'Client'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <ConsentItem
              id="consent-account"
              checked={accountCreation}
              onChange={setAccountCreation}
              required
              label="I consent to the collection and processing of my personal data as necessary to create my account and use the Plugr platform."
            />
            {role === 'plug' && (
              <ConsentItem
                id="consent-identity"
                checked={identityVerification}
                onChange={setIdentityVerification}
                required
                label="I consent to identity verification, including submission of my NIN and related documents."
              />
            )}
            <ConsentItem
              id="consent-sharing"
              checked={dataSharing}
              onChange={setDataSharing}
              required
              label="I consent to Plugr sharing the minimum necessary information with the other party to a job, for the purpose of completing that job."
            />
            <ConsentItem
              id="consent-marketing"
              checked={marketing}
              onChange={setMarketing}
              required={false}
              label="I consent to receive marketing and promotional communications from Plugr."
            />
          </div>

          {submitted ? (
            <Note>Consent recorded. You can change your marketing preference at any time from account settings.</Note>
          ) : (
            <button
              type="button"
              disabled={!requiredComplete}
              onClick={handleSubmit}
              className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-pitch-black text-sm font-bold px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-light active:scale-95 transition-all"
            >
              Agree and continue <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </Section>

        <Section number="6" title="Contact Us">
          <div className="rounded-[24px] bg-pitch-black text-white p-8 mt-2 text-center">
            <span className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-2xl bg-gold/15">
              <FileCheck2 className="w-6 h-6 text-gold" />
            </span>
            <p className="font-display text-xl text-white">Plugr Technologies Limited</p>
            <p className="text-steel-blue text-sm mt-1">A subsidiary of Alhazen · Lagos, Nigeria</p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-steel-blue"><span className="text-white font-semibold">Privacy inquiries:</span> privacy@getplugr.com</p>
              <p className="text-steel-blue"><span className="text-white font-semibold">Website:</span> getplugr.com</p>
            </div>
          </div>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}