// app/terms/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Scale } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';
import { Section, SubSection, BulletList, Note, LegalHeader } from '@/src/components/legal/LegalPageParts';

export const metadata: Metadata = {
  title: 'Terms of Service | Plugr',
  description: 'The terms that govern your use of the Plugr platform.',
};

export default function TermsOfServicePage() {
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
        title="Terms of"
        highlight="Service"
        version="Version 1.0 &nbsp;·&nbsp; Effective July 2026 &nbsp;·&nbsp; getplugr.com"
      />

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <p className="flex-1 text-[15px] leading-relaxed text-slate">
            These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the Plugr platform,
            including the Plugr WhatsApp bot, web application, and any related services (together, the
            &ldquo;Platform&rdquo;). By registering for or using the Platform, you agree to be bound by
            these Terms and by our{' '}
            <Link href="/privacy" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Privacy Policy
            </Link>
            .
          </p>
          <a
            href="/Plugr_Terms_of_Service.pdf"
            download
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill border border-pitch-black/15 bg-white text-pitch-black text-sm font-bold px-5 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <Section number="1" title="Definitions">
          <BulletList items={[
            <><strong className="text-pitch-black font-semibold">Plugr / Platform:</strong> the service operated by Plugr Technologies Limited connecting Clients with verified service providers.</>,
            <><strong className="text-pitch-black font-semibold">Plug:</strong> a verified service provider offering services through the Platform.</>,
            <><strong className="text-pitch-black font-semibold">Client:</strong> a user who requests or books services through the Platform.</>,
            <><strong className="text-pitch-black font-semibold">Job:</strong> a specific service engagement arranged between a Client and a Plug through the Platform.</>,
            <><strong className="text-pitch-black font-semibold">Services:</strong> the work performed by a Plug for a Client in connection with a Job.</>,
          ]} />
        </Section>

        <Section number="2" title="Eligibility and Registration">
          <p className="text-sm text-slate">
            You must be at least 18 years old and capable of forming a binding contract under Nigerian law
            to use the Platform. Registration is completed via WhatsApp OTP verification tied to a valid,
            active phone number. You are responsible for keeping your phone number and account access
            secure, and for all activity that occurs under your account. Plugs must additionally complete
            identity verification, including submission of a valid NIN, before their profile is made
            visible to Clients.
          </p>
        </Section>

        <Section number="3" title="Nature of the Platform">
          <p className="text-sm text-slate">
            Plugr is a technology platform that facilitates connections between Clients and independent
            Plugs. Plugr is not an employer, agent, or principal of any Plug, and Plugs are not employees,
            partners, or agents of Plugr. Each Job is a direct arrangement between the Client and the Plug.
            Plugr is not a party to that arrangement and does not supervise, direct, or control how a Plug
            performs Services.
          </p>
        </Section>

        <Section number="4" title="Verification and Its Limits">
          <p className="text-sm text-slate">
            Plugr verifies each Plug&rsquo;s identity using their NIN, via NIMC-accredited verification
            providers, before allowing that Plug&rsquo;s profile to appear on the Platform. This
            verification confirms that a real, traceable individual is behind a profile. It is not a
            guarantee of a Plug&rsquo;s skill, workmanship, reliability, or the outcome of any Job. Clients
            are responsible for satisfying themselves that a Plug is suitable for a given Job, including by
            reviewing ratings and history where available.
          </p>
          <Note>
            Verification confirms identity, not quality of work. Review ratings, history, and job scope
            before confirming a booking.
          </Note>
        </Section>

        <Section number="5" title="Fees and Payments">
          <p className="text-sm text-slate">
            Fees payable for a Job, and any platform service fee retained by Plugr, are disclosed to both
            parties before a Job is confirmed. Payments are processed through our payment partner,
            Alatpay. Plugr does not store full payment card details; payment data is handled per our{' '}
            <Link href="/privacy" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Privacy Policy
            </Link>{' '}
            and Alatpay&rsquo;s own terms. Plugr may change its payment processing partner from time to
            time; the current partner is always disclosed here and in the Privacy Policy. Plugs are
            responsible for their own tax obligations arising from income earned through the Platform.
          </p>
        </Section>

        <Section number="6" title="User Conduct">
          <p className="text-sm text-slate mb-2">You agree not to:</p>
          <BulletList items={[
            'Provide false, misleading, or another person&rsquo;s identity information during registration or verification.',
            'Use the Platform to arrange payment or communication outside the Platform for the purpose of avoiding fees, where this undermines dispute protections.',
            'Harass, threaten, defraud, or discriminate against another user.',
            'Use the Platform for any unlawful purpose.',
            'Attempt to interfere with, reverse-engineer, or disrupt the Platform&rsquo;s operation or security.',
          ]} />
          <p className="text-sm text-slate mt-4">
            Plugr may suspend or terminate accounts that violate these Terms, at its reasonable discretion,
            and may report suspected fraud or identity misuse to relevant authorities.
          </p>
        </Section>

        <Section number="7" title="Cancellations and Refunds">
          <p className="text-sm text-slate">
            Cancellation and refund terms for a given Job are governed by the specific policy shown to both
            parties at the time of booking. Where a dispute arises over a cancellation, refund, or the
            quality of Services rendered, it is handled under Plugr&rsquo;s{' '}
            <Link href="/disputes" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Dispute Resolution Policy
            </Link>
            , which forms part of these Terms by reference.
          </p>
        </Section>

        <Section number="8" title="Intellectual Property">
          <p className="text-sm text-slate">
            The Platform, including its software, branding, and content (excluding user-submitted content
            and third-party content), is owned by Plugr Technologies Limited / Alhazen and protected by
            applicable intellectual property laws. You are granted a limited, non-exclusive,
            non-transferable license to use the Platform for its intended purpose. You may not copy,
            modify, or distribute any part of the Platform without our written consent.
          </p>
        </Section>

        <Section number="9" title="Disclaimers">
          <p className="text-sm text-slate">
            The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the
            fullest extent permitted by Nigerian law, Plugr disclaims all warranties, express or implied,
            regarding the Platform&rsquo;s availability, accuracy, or fitness for a particular purpose, and
            regarding the quality, safety, or legality of Services provided by any Plug.
          </p>
        </Section>

        <Section number="10" title="Limitation of Liability">
          <p className="text-sm text-slate">
            To the fullest extent permitted by applicable law, Plugr&rsquo;s total liability to you arising
            out of or relating to these Terms or your use of the Platform shall not exceed the total
            platform fees paid by you to Plugr in the twelve (12) months preceding the claim. Plugr shall
            not be liable for indirect, incidental, consequential, or punitive damages, or for any loss
            arising from a Plug&rsquo;s performance (or non-performance) of Services, except to the extent
            such liability cannot be excluded under Nigerian law.
          </p>
        </Section>

        <Section number="11" title="Indemnification">
          <p className="text-sm text-slate">
            You agree to indemnify and hold Plugr, Alhazen, and their officers and employees harmless from
            any claim, loss, or liability arising from your breach of these Terms, your misuse of the
            Platform, or your conduct in connection with a Job.
          </p>
        </Section>

        <Section number="12" title="Termination">
          <p className="text-sm text-slate">
            You may close your account at any time by contacting support. Plugr may suspend or terminate
            access to the Platform where these Terms are breached, where required by law, or where
            continued access poses a risk to other users or the Platform. Provisions that by their nature
            should survive termination (including Sections 9, 10, 11, and 14) will continue to apply.
          </p>
        </Section>

        <Section number="13" title="Governing Law and Dispute Resolution">
          <p className="text-sm text-slate">
            These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes between
            users, or between a user and Plugr, are handled in accordance with Plugr&rsquo;s{' '}
            <Link href="/disputes" className="text-pitch-black font-semibold underline decoration-gold/40 hover:decoration-gold">
              Dispute Resolution Policy
            </Link>{' '}
            in the first instance. Where a dispute cannot be resolved through that process, it shall be
            subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria, or resolved by
            arbitration as set out in that Policy.
          </p>
        </Section>

        <Section number="14" title="Changes to These Terms">
          <BulletList items={[
            'We will update the Effective Date at the top of this document.',
            'We will notify registered users via WhatsApp or email before material changes take effect.',
            'Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.',
          ]} />
        </Section>

        <Section number="15" title="Contact Us">
          <div className="rounded-[24px] bg-pitch-black text-white p-8 mt-2 text-center">
            <span className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-2xl bg-gold/15">
              <Scale className="w-6 h-6 text-gold" />
            </span>
            <p className="font-display text-xl text-white">Plugr Technologies Limited</p>
            <p className="text-bone-muted text-sm mt-1">A subsidiary of Alhazen · Lagos, Nigeria</p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-bone-muted"><span className="text-white font-semibold">Legal inquiries:</span> legal@getplugr.com</p>
              <p className="text-bone-muted"><span className="text-white font-semibold">General support:</span> support@getplugr.com</p>
              <p className="text-bone-muted"><span className="text-white font-semibold">Website:</span> getplugr.com</p>
            </div>
          </div>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}