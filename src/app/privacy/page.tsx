// app/privacy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, ShieldCheck } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';
import { Section, SubSection, BulletList, Note, LegalHeader } from '@/src/components/legal/LegalPageParts';

export const metadata: Metadata = {
  title: 'Privacy Policy | Plugr',
  description: 'Learn how Plugr Technologies Limited collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-bone text-midnight font-body antialiased">
      {/* Nav — matches the landing */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-bone/80 backdrop-blur border-b border-midnight/6">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <PlugrWordmark className="h-6 text-midnight" />
          </a>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hidden md:inline-flex text-sm font-semibold text-midnight/70 hover:text-gold transition-colors">
              Try demo
            </Link>
            <Link
              href="/app/browse"
              className="inline-flex items-center gap-1.5 rounded-pill bg-gold text-midnight text-sm font-bold px-4 sm:px-5 py-2.5 hover:bg-gold-light active:scale-95 transition-all"
            >
              Use Plugr <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <LegalHeader
        eyebrow="Legal"
        title="Privacy"
        highlight="Policy"
        version="Version 1.0 &nbsp;·&nbsp; Effective July 2026 &nbsp;·&nbsp; getplugr.com"
      />

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <p className="flex-1 text-[15px] leading-relaxed text-slate">
            Plugr Technologies Limited (&ldquo;Plugr,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;) is committed to protecting your personal information. This Privacy Policy
            explains how we collect, use, share, and safeguard your data when you use the Plugr platform —
            including our website at <strong className="text-midnight font-semibold">getplugr.com</strong>,
            mobile applications, and WhatsApp-based services. By accessing or using Plugr, you agree to the
            practices described in this policy.
          </p>
          <a
            href="/Plugr_Privacy_Policy.pdf"
            download
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill border border-midnight/15 bg-white text-midnight text-sm font-bold px-5 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <Section number="1" title="Information We Collect">
          <SubSection title="1.1 Information You Provide Directly">
            <p className="text-sm text-slate">When you register or use Plugr, we collect information you provide to us, including:</p>
            <BulletList items={[
              <><strong className="text-midnight font-semibold">Identity Information:</strong> Full name, National Identity Number (NIN), profile photograph.</>,
              <><strong className="text-midnight font-semibold">Contact Information:</strong> Phone number, email address, WhatsApp number.</>,
              <><strong className="text-midnight font-semibold">Location Information:</strong> City and state of residence or service area.</>,
              <><strong className="text-midnight font-semibold">Professional Information (Plugs only):</strong> Trade/skill category (e.g., electrician, plumber), work history, certifications.</>,
              <><strong className="text-midnight font-semibold">Account Credentials:</strong> Authentication tokens and session data.</>,
              <><strong className="text-midnight font-semibold">Communications:</strong> Messages sent through our WhatsApp interface or in-app chat.</>,
            ]} />
          </SubSection>

          <SubSection title="1.2 Information Collected Automatically">
            <p className="text-sm text-slate">When you interact with our platform, we automatically collect:</p>
            <BulletList items={[
              'Device information (type, operating system, browser).',
              'IP address and approximate geographic location.',
              'Usage data (pages visited, features used, time spent).',
              'WhatsApp interaction logs and Flow completion data.',
              'Cookies and similar tracking technologies.',
            ]} />
          </SubSection>

          <SubSection title="1.3 Information from Third Parties">
            <p className="text-sm text-slate">We may receive information about you from:</p>
            <BulletList items={[
              <><strong className="text-midnight font-semibold">NIMC:</strong> To verify your NIN during onboarding.</>,
              <><strong className="text-midnight font-semibold">Meta Platforms:</strong> When you interact with us via WhatsApp Business API.</>,
              <><strong className="text-midnight font-semibold">Alatpay:</strong> Transaction status and confirmation data (we do not store full card details).</>,
            ]} />
          </SubSection>

          <Note>
            We collect your NIN solely for identity verification purposes. Your NIN is processed securely
            and is never shared with third parties beyond verification service providers.
          </Note>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <p className="text-sm text-slate mb-4">Plugr uses your personal information for the following purposes:</p>
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Account Creation and Management:</strong> To register, authenticate, and manage your Plugr account.</>,
            <><strong className="text-midnight font-semibold">Identity Verification:</strong> To verify the identity of Plugs using government-issued NIN.</>,
            <><strong className="text-midnight font-semibold">Service Matching:</strong> To connect Clients with verified Plugs based on location, trade, and availability.</>,
            <><strong className="text-midnight font-semibold">WhatsApp Communication:</strong> To send service notifications, onboarding flows, job updates, and support messages.</>,
            <><strong className="text-midnight font-semibold">Payment Processing:</strong> To facilitate secure transactions between Clients and Plugs.</>,
            <><strong className="text-midnight font-semibold">Platform Safety:</strong> To detect fraud, abuse, and policy violations.</>,
            <><strong className="text-midnight font-semibold">Customer Support:</strong> To respond to inquiries and resolve disputes.</>,
            <><strong className="text-midnight font-semibold">Analytics and Improvement:</strong> To understand usage patterns and improve our services.</>,
            <><strong className="text-midnight font-semibold">Legal Compliance:</strong> To comply with applicable Nigerian laws and regulations.</>,
            <><strong className="text-midnight font-semibold">Marketing (with consent):</strong> To send promotional communications about Plugr features and offers.</>,
          ]} />
          <Note>
            We will never sell your personal data to advertisers or third-party data brokers. Your data
            is used only to operate and improve the Plugr platform.
          </Note>
        </Section>

        <Section number="3" title="Legal Basis for Processing">
          <p className="text-sm text-slate mb-4">
            We process your personal data under the following legal bases in accordance with the
            Nigeria Data Protection Act (NDPA) 2023:
          </p>
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Contractual Necessity:</strong> Processing required to provide the services you have requested.</>,
            <><strong className="text-midnight font-semibold">Legitimate Interests:</strong> Processing necessary for fraud prevention, platform security, and service improvement.</>,
            <><strong className="text-midnight font-semibold">Legal Obligation:</strong> Processing required to comply with applicable Nigerian laws.</>,
            <><strong className="text-midnight font-semibold">Consent:</strong> Processing based on your explicit consent, which you may withdraw at any time. See our{' '}
              <Link href="/consent" className="text-midnight font-semibold underline decoration-gold/40 hover:decoration-gold">
                Data Consent &amp; Processing Agreement
              </Link>{' '}
              for the itemized record of what you&rsquo;ve agreed to.</>,
          ]} />
        </Section>

        <Section number="4" title="Data Sharing and Disclosure">
          <SubSection title="4.1 With Other Users">
            <BulletList items={[
              "Clients can view a Plug's name, trade, rating, city, and verification status.",
              "Plugs can view a Client's name, job description, and location when matched.",
              "Neither party receives the other's NIN, email address, or full contact details without explicit consent.",
            ]} />
          </SubSection>
          <SubSection title="4.2 With Service Providers">
            <BulletList items={[
              <><strong className="text-midnight font-semibold">Cloud Infrastructure:</strong> Render (hosting), Neon (database), Upstash (caching).</>,
              <><strong className="text-midnight font-semibold">AI Services:</strong> Google Gemini for conversational AI features.</>,
              <><strong className="text-midnight font-semibold">Identity Verification:</strong> NIMC-accredited NIN verification providers.</>,
              <><strong className="text-midnight font-semibold">Payment Processing:</strong> Alatpay for secure payment handling. Plugr may change its payment processing partner from time to time; the current partner is always disclosed here.</>,
              <><strong className="text-midnight font-semibold">Messaging:</strong> Meta Platforms for WhatsApp Business API services.</>,
            ]} />
          </SubSection>
          <SubSection title="4.3 Legal Disclosures">
            <p className="text-sm text-slate">
              We may disclose your information when required by law, court order, or government authority,
              or when necessary to protect the rights, property, or safety of Plugr, our users, or the public.
            </p>
          </SubSection>
          <SubSection title="4.4 Business Transfers">
            <p className="text-sm text-slate">
              In the event of a merger, acquisition, or sale of assets, your data may be transferred to
              the successor entity, subject to the same privacy protections described in this policy.
            </p>
          </SubSection>
        </Section>

        <Section number="5" title="Data Retention">
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Active Account Data:</strong> Retained for the duration of your account and for 2 years after closure.</>,
            <><strong className="text-midnight font-semibold">Transaction Records:</strong> Retained for 7 years in compliance with Nigerian financial regulations.</>,
            <><strong className="text-midnight font-semibold">NIN Verification Records:</strong> Retained for the period required by NIMC guidelines.</>,
            <><strong className="text-midnight font-semibold">Communication Logs:</strong> Retained for 1 year for dispute resolution and safety purposes.</>,
            <><strong className="text-midnight font-semibold">Marketing Data:</strong> Retained until you withdraw consent or request deletion.</>,
          ]} />
          <p className="text-sm text-slate mt-4">
            When data is no longer required, we securely delete or anonymise it in accordance with industry best practices.
          </p>
        </Section>

        <Section number="6" title="Data Security">
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Encryption in Transit:</strong> All data transmitted is encrypted using TLS 1.3.</>,
            <><strong className="text-midnight font-semibold">Encryption at Rest:</strong> Sensitive data stored in our databases is encrypted at rest.</>,
            <><strong className="text-midnight font-semibold">WhatsApp Flow Encryption:</strong> All data exchanged through WhatsApp Flows is end-to-end encrypted using RSA-2048 and AES-128.</>,
            <><strong className="text-midnight font-semibold">Access Controls:</strong> Role-based access controls limit data access to authorised personnel only.</>,
            <><strong className="text-midnight font-semibold">Authentication:</strong> JWT-based authentication with token refresh mechanisms.</>,
            <><strong className="text-midnight font-semibold">Rate Limiting:</strong> API rate limiting to prevent abuse and brute-force attacks.</>,
            <><strong className="text-midnight font-semibold">Regular Audits:</strong> Periodic security assessments and vulnerability testing.</>,
          ]} />
          <Note>
            While we employ industry-standard security measures, no system is completely secure.
            Report any suspicious activity to privacy@getplugr.com.
          </Note>
        </Section>

        <Section number="7" title="Your Privacy Rights">
          <p className="text-sm text-slate mb-4">
            Under the Nigeria Data Protection Act (NDPA) 2023, you have the following rights:
          </p>
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Right of Access:</strong> Request a copy of the personal data we hold about you.</>,
            <><strong className="text-midnight font-semibold">Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</>,
            <><strong className="text-midnight font-semibold">Right to Erasure:</strong> Request deletion of your data where we have no legitimate reason to continue processing it.</>,
            <><strong className="text-midnight font-semibold">Right to Restriction:</strong> Request that we restrict processing in certain circumstances.</>,
            <><strong className="text-midnight font-semibold">Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</>,
            <><strong className="text-midnight font-semibold">Right to Object:</strong> Object to processing based on legitimate interests or for marketing purposes.</>,
            <><strong className="text-midnight font-semibold">Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is consent-based.</>,
            <><strong className="text-midnight font-semibold">Right to Lodge a Complaint:</strong> File a complaint with the Nigeria Data Protection Commission (NDPC).</>,
          ]} />
          <p className="text-sm text-slate mt-4">
            To exercise any of these rights, contact us at{' '}
            <strong className="text-midnight font-semibold">privacy@getplugr.com</strong>. We will respond within 30 days.
          </p>
        </Section>

        <Section number="8" title="WhatsApp and Third-Party Services">
          <BulletList items={[
            'Your WhatsApp phone number and messages are processed by Meta in accordance with their Privacy Policy.',
            'Data submitted through WhatsApp Flows is encrypted and transmitted securely to Plugr servers.',
            'We do not share your WhatsApp data with third parties beyond what is necessary to provide the service.',
            'You can opt out of WhatsApp communications at any time by replying STOP to any Plugr message.',
          ]} />
          <p className="text-sm text-slate mt-4">
            Plugr is not responsible for the privacy practices of third-party platforms. We encourage you
            to review the privacy policies of Meta, Alatpay, and other service providers you interact with.
          </p>
        </Section>

        <Section number="9" title="Children's Privacy">
          <p className="text-sm text-slate mb-4">
            Plugr services are intended for individuals who are 18 years of age or older. We do not
            knowingly collect personal information from minors under the age of 18.
          </p>
          <p className="text-sm text-slate">
            If you believe we have inadvertently collected information from a minor, please contact us
            immediately at <strong className="text-midnight font-semibold">privacy@getplugr.com</strong> and we will delete such information promptly.
          </p>
        </Section>

        <Section number="10" title="Cookies and Tracking Technologies">
          <BulletList items={[
            <><strong className="text-midnight font-semibold">Essential Cookies:</strong> Required for the platform to function correctly (authentication, session management).</>,
            <><strong className="text-midnight font-semibold">Analytics Cookies:</strong> Help us understand how users interact with our platform.</>,
            <><strong className="text-midnight font-semibold">Preference Cookies:</strong> Remember your settings and preferences.</>,
          ]} />
          <p className="text-sm text-slate mt-4">
            You can control cookies through your browser settings. We do not use cookies for
            cross-site advertising or tracking.
          </p>
        </Section>

        <Section number="11" title="International Data Transfers">
          <p className="text-sm text-slate mb-4">
            Plugr is incorporated in Nigeria and primarily processes data within Nigeria. However, some
            third-party providers may process data outside Nigeria, including in the United States and EU.
          </p>
          <p className="text-sm text-slate">
            Where data is transferred internationally, we ensure appropriate safeguards are in place in
            accordance with the NDPA 2023.
          </p>
        </Section>

        <Section number="12" title="Changes to This Privacy Policy">
          <BulletList items={[
            'We will update the Effective Date at the top of this document.',
            'We will notify registered users via email or WhatsApp message.',
            'For material changes, we may request renewed consent where required by law.',
          ]} />
          <p className="text-sm text-slate mt-4">
            Your continued use of the Plugr platform after the effective date constitutes acceptance
            of the updated policy.
          </p>
        </Section>

        <Section number="13" title="Contact Us">
          <div className="rounded-[24px] bg-midnight text-white p-8 mt-2 text-center">
            <span className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-2xl bg-gold/15">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </span>
            <p className="font-display text-xl text-white">Plugr Technologies Limited</p>
            <p className="text-steel-blue text-sm mt-1">A subsidiary of Alhazen · Lagos, Nigeria</p>

            <div className="mt-6 space-y-2 text-sm">
              <p className="text-steel-blue"><span className="text-white font-semibold">Privacy inquiries:</span> privacy@getplugr.com</p>
              <p className="text-steel-blue"><span className="text-white font-semibold">General support:</span> support@getplugr.com</p>
              <p className="text-steel-blue"><span className="text-white font-semibold">Website:</span> getplugr.com</p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-steel-blue text-[13px]">For regulatory complaints</p>
              <p className="text-white font-semibold text-sm mt-0.5">Nigeria Data Protection Commission (NDPC)</p>
              <p className="text-steel-blue text-[13px]">www.ndpc.gov.ng</p>
            </div>
          </div>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}