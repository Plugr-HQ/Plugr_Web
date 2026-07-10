// app/privacy/page.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Plugr',
  description: 'Learn how Plugr Technologies Limited collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F1EC]">
      <Navbar />
      {/* Header */}
      <div className="bg-[#0F1F3D] pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Plugr</h1>
          <h2 className="text-2xl font-semibold text-[#D4C5A0] mb-2">Privacy Policy</h2>
          <p className="text-[#B0A080] text-sm">
            Version 1.0 &nbsp;|&nbsp; Effective Date: July 2026 &nbsp;|&nbsp; getplugr.com
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Intro */}
        <div className="bg-[#F0F4FF] border-l-4 border-[#E8A020] rounded-lg p-6 mb-10">
          <p className="text-[#4A4A4A] leading-relaxed text-justify">
            Plugr Technologies Limited (&quot;Plugr,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
            protecting your personal information. This Privacy Policy explains how we collect, use, share,
            and safeguard your data when you use the Plugr platform — including our website at{' '}
            <strong>getplugr.com</strong>, mobile applications, and WhatsApp-based services. By accessing
            or using Plugr, you agree to the practices described in this policy.
          </p>
        </div>

        {/* Download CTA */}
        <div className="flex justify-end mb-8">
          <a
            href="/Plugr_Privacy_Policy.pdf"
            download
            className="flex items-center gap-2 bg-[#0F1F3D] text-white text-sm font-semibold px-5 py-3 rounded-full hover:bg-[#1a2f4f] transition"
          >
            ⬇ Download PDF Version
          </a>
        </div>

        {/* Sections */}
        <Section number="1" title="Information We Collect">
          <SubSection title="1.1 Information You Provide Directly">
            <p className="text-[#4A4A4A] text-sm">When you register or use Plugr, we collect information you provide to us, including:</p>
            <BulletList items={[
              <><strong>Identity Information:</strong> Full name, National Identity Number (NIN), profile photograph.</>,
              <><strong>Contact Information:</strong> Phone number, email address, WhatsApp number.</>,
              <><strong>Location Information:</strong> City and state of residence or service area.</>,
              <><strong>Professional Information (Plugs only):</strong> Trade/skill category (e.g., electrician, plumber), work history, certifications.</>,
              <><strong>Account Credentials:</strong> Authentication tokens and session data.</>,
              <><strong>Communications:</strong> Messages sent through our WhatsApp interface or in-app chat.</>,
            ]} />
          </SubSection>

          <SubSection title="1.2 Information Collected Automatically">
            <p className="text-[#4A4A4A] text-sm">When you interact with our platform, we automatically collect:</p>
            <BulletList items={[
              'Device information (type, operating system, browser).',
              'IP address and approximate geographic location.',
              'Usage data (pages visited, features used, time spent).',
              'WhatsApp interaction logs and Flow completion data.',
              'Cookies and similar tracking technologies.',
            ]} />
          </SubSection>

          <SubSection title="1.3 Information from Third Parties">
            <p className="text-[#4A4A4A] text-sm">We may receive information about you from:</p>
            <BulletList items={[
              <><strong>NIMC:</strong> To verify your NIN during onboarding.</>,
              <><strong>Meta Platforms:</strong> When you interact with us via WhatsApp Business API.</>,
              <><strong>Payment Processors:</strong> Transaction status and confirmation data (we do not store full card details).</>,
            ]} />
          </SubSection>

          <Note>
            We collect your NIN solely for identity verification purposes. Your NIN is processed securely
            and is never shared with third parties beyond verification service providers.
          </Note>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <p className="text-[#4A4A4A] mb-4 text-sm">Plugr uses your personal information for the following purposes:</p>
          <BulletList items={[
            <><strong>Account Creation and Management:</strong> To register, authenticate, and manage your Plugr account.</>,
            <><strong>Identity Verification:</strong> To verify the identity of Plugs using government-issued NIN.</>,
            <><strong>Service Matching:</strong> To connect Clients with verified Plugs based on location, trade, and availability.</>,
            <><strong>WhatsApp Communication:</strong> To send service notifications, onboarding flows, job updates, and support messages.</>,
            <><strong>Payment Processing:</strong> To facilitate secure transactions between Clients and Plugs.</>,
            <><strong>Platform Safety:</strong> To detect fraud, abuse, and policy violations.</>,
            <><strong>Customer Support:</strong> To respond to inquiries and resolve disputes.</>,
            <><strong>Analytics and Improvement:</strong> To understand usage patterns and improve our services.</>,
            <><strong>Legal Compliance:</strong> To comply with applicable Nigerian laws and regulations.</>,
            <><strong>Marketing (with consent):</strong> To send promotional communications about Plugr features and offers.</>,
          ]} />
          <Note>
            We will never sell your personal data to advertisers or third-party data brokers. Your data
            is used only to operate and improve the Plugr platform.
          </Note>
        </Section>

        <Section number="3" title="Legal Basis for Processing">
          <p className="text-[#4A4A4A] mb-4 text-sm">
            We process your personal data under the following legal bases in accordance with the
            Nigeria Data Protection Act (NDPA) 2023:
          </p>
          <BulletList items={[
            <><strong>Contractual Necessity:</strong> Processing required to provide the services you have requested.</>,
            <><strong>Legitimate Interests:</strong> Processing necessary for fraud prevention, platform security, and service improvement.</>,
            <><strong>Legal Obligation:</strong> Processing required to comply with applicable Nigerian laws.</>,
            <><strong>Consent:</strong> Processing based on your explicit consent, which you may withdraw at any time.</>,
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
              <><strong>Cloud Infrastructure:</strong> Render (hosting), Neon (database), Upstash (caching).</>,
              <><strong>AI Services:</strong> Google Gemini for conversational AI features.</>,
              <><strong>Identity Verification:</strong> NIMC-accredited NIN verification providers.</>,
              <><strong>Payment Processing:</strong> Paystack for secure payment handling.</>,
              <><strong>Messaging:</strong> Meta Platforms for WhatsApp Business API services.</>,
            ]} />
          </SubSection>
          <SubSection title="4.3 Legal Disclosures">
            <p className="text-[#4A4A4A] text-sm">
              We may disclose your information when required by law, court order, or government authority,
              or when necessary to protect the rights, property, or safety of Plugr, our users, or the public.
            </p>
          </SubSection>
          <SubSection title="4.4 Business Transfers">
            <p className="text-[#4A4A4A] text-sm">
              In the event of a merger, acquisition, or sale of assets, your data may be transferred to
              the successor entity, subject to the same privacy protections described in this policy.
            </p>
          </SubSection>
        </Section>

        <Section number="5" title="Data Retention">
          <BulletList items={[
            <><strong>Active Account Data:</strong> Retained for the duration of your account and for 2 years after closure.</>,
            <><strong>Transaction Records:</strong> Retained for 7 years in compliance with Nigerian financial regulations.</>,
            <><strong>NIN Verification Records:</strong> Retained for the period required by NIMC guidelines.</>,
            <><strong>Communication Logs:</strong> Retained for 1 year for dispute resolution and safety purposes.</>,
            <><strong>Marketing Data:</strong> Retained until you withdraw consent or request deletion.</>,
          ]} />
          <p className="text-[#4A4A4A] mt-4 text-sm">
            When data is no longer required, we securely delete or anonymise it in accordance with industry best practices.
          </p>
        </Section>

        <Section number="6" title="Data Security">
          <BulletList items={[
            <><strong>Encryption in Transit:</strong> All data transmitted is encrypted using TLS 1.3.</>,
            <><strong>Encryption at Rest:</strong> Sensitive data stored in our databases is encrypted at rest.</>,
            <><strong>WhatsApp Flow Encryption:</strong> All data exchanged through WhatsApp Flows is end-to-end encrypted using RSA-2048 and AES-128.</>,
            <><strong>Access Controls:</strong> Role-based access controls limit data access to authorised personnel only.</>,
            <><strong>Authentication:</strong> JWT-based authentication with token refresh mechanisms.</>,
            <><strong>Rate Limiting:</strong> API rate limiting to prevent abuse and brute-force attacks.</>,
            <><strong>Regular Audits:</strong> Periodic security assessments and vulnerability testing.</>,
          ]} />
          <Note>
            While we employ industry-standard security measures, no system is completely secure.
            Report any suspicious activity to privacy@getplugr.com.
          </Note>
        </Section>

        <Section number="7" title="Your Privacy Rights">
          <p className="text-[#4A4A4A] mb-4 text-sm">
            Under the Nigeria Data Protection Act (NDPA) 2023, you have the following rights:
          </p>
          <BulletList items={[
            <><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</>,
            <><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</>,
            <><strong>Right to Erasure:</strong> Request deletion of your data where we have no legitimate reason to continue processing it.</>,
            <><strong>Right to Restriction:</strong> Request that we restrict processing in certain circumstances.</>,
            <><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</>,
            <><strong>Right to Object:</strong> Object to processing based on legitimate interests or for marketing purposes.</>,
            <><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is consent-based.</>,
            <><strong>Right to Lodge a Complaint:</strong> File a complaint with the Nigeria Data Protection Commission (NDPC).</>,
          ]} />
          <p className="text-[#4A4A4A] mt-4 text-sm">
            To exercise any of these rights, contact us at <strong>privacy@getplugr.com</strong>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section number="8" title="WhatsApp and Third-Party Services">
          <BulletList items={[
            'Your WhatsApp phone number and messages are processed by Meta in accordance with their Privacy Policy.',
            'Data submitted through WhatsApp Flows is encrypted and transmitted securely to Plugr servers.',
            'We do not share your WhatsApp data with third parties beyond what is necessary to provide the service.',
            'You can opt out of WhatsApp communications at any time by replying STOP to any Plugr message.',
          ]} />
          <p className="text-[#4A4A4A] mt-4 text-sm">
            Plugr is not responsible for the privacy practices of third-party platforms. We encourage you
            to review the privacy policies of Meta, Paystack, and other service providers you interact with.
          </p>
        </Section>

        <Section number="9" title="Children's Privacy">
          <p className="text-[#4A4A4A] mb-4 text-sm">
            Plugr services are intended for individuals who are 18 years of age or older. We do not
            knowingly collect personal information from minors under the age of 18.
          </p>
          <p className="text-[#4A4A4A] text-sm">
            If you believe we have inadvertently collected information from a minor, please contact us
            immediately at <strong>privacy@getplugr.com</strong> and we will delete such information promptly.
          </p>
        </Section>

        <Section number="10" title="Cookies and Tracking Technologies">
          <BulletList items={[
            <><strong>Essential Cookies:</strong> Required for the platform to function correctly (authentication, session management).</>,
            <><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform.</>,
            <><strong>Preference Cookies:</strong> Remember your settings and preferences.</>,
          ]} />
          <p className="text-[#4A4A4A] mt-4 text-sm">
            You can control cookies through your browser settings. We do not use cookies for
            cross-site advertising or tracking.
          </p>
        </Section>

        <Section number="11" title="International Data Transfers">
          <p className="text-[#4A4A4A] mb-4 text-sm">
            Plugr is incorporated in Nigeria and primarily processes data within Nigeria. However, some
            third-party providers may process data outside Nigeria, including in the United States and EU.
          </p>
          <p className="text-[#4A4A4A] text-sm">
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
          <p className="text-[#4A4A4A] mt-4 text-sm">
            Your continued use of the Plugr platform after the effective date constitutes acceptance
            of the updated policy.
          </p>
        </Section>

        <Section number="13" title="Contact Us">
          <div className="bg-[#0F1F3D] rounded-2xl p-8 text-center mt-4">
            <p className="text-white font-bold text-lg mb-1">Plugr Technologies Limited</p>
            <p className="text-[#D4C5A0] text-sm mb-1">A subsidiary of Alhazen</p>
            <p className="text-[#D4C5A0] text-sm mb-6">Lagos, Nigeria</p>
            <div className="space-y-2 text-sm">
              <p className="text-[#D4C5A0]">
                <span className="text-white font-semibold">Privacy Inquiries:</span> privacy@getplugr.com
              </p>
              <p className="text-[#D4C5A0]">
                <span className="text-white font-semibold">General Support:</span> support@getplugr.com
              </p>
              <p className="text-[#D4C5A0]">
                <span className="text-white font-semibold">Website:</span> https://getplugr.com
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-[#1a2f4f]">
              <p className="text-[#B0A080] text-sm">For regulatory complaints:</p>
              <p className="text-white font-semibold text-sm">Nigeria Data Protection Commission (NDPC)</p>
              <p className="text-[#B0A080] text-sm">www.ndpc.gov.ng</p>
            </div>
          </div>
        </Section>

      </div>
      <Footer />
    </main>
  );
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function Section({ number, title, children }: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="border-t border-[#E0E0E0] pt-6 mb-4">
        <h2 className="text-xl font-bold text-[#0F1F3D]">
          {number}. {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-bold text-[#E8A020] mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: {
  items: ReactNode[];
}) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[#4A4A4A] text-sm leading-relaxed">
          <span className="text-[#E8A020] mt-1 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ children }: {
  children: ReactNode;
}) {
  return (
    <div className="bg-[#FFF8EC] border-l-4 border-[#E8A020] rounded-r-lg p-4 mt-4">
      <p className="text-[#0F1F3D] text-sm font-medium leading-relaxed">{children}</p>
    </div>
  );
}
