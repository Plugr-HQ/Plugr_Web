'use client'

import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/src/components/Footer'
import Navbar from '@/src/components/Navbar'
import {
  ShieldCheck,
  Wallet,
  BarChart3,
  Mail,
  Phone,
  ChevronDown,
} from 'lucide-react'

// FAQ Interface
interface FAQItem {
  question: string
  answer: string
}

export default function BecomeAPlugSection() {
  // Accordion state tracker
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const steps = [
    {
      num: "1",
      title: "Sign up with your phone",
      desc: "Create your account instantly using your phone number."
    },
    {
      num: "2",
      title: "Submit NIN and OTP",
      desc: "Verify your identity securely for trust and safety."
    },
    {
      num: "3",
      title: "Liveness and Skills check",
      desc: "Complete a quick face verification and list your expertise."
    },
    {
      num: "4",
      title: "Set up your profile and go live",
      desc: "Add your best work and start receiving booking requests."
    }
  ]

  const faqs: FAQItem[] = [
    {
      question: "What are the fees?",
      answer: "We charge a minimal service commission on completed jobs to maintain the escrow and verification systems. There are no hidden subscription sign-up fees."
    },
    {
      question: "How do I get verified?",
      answer: "You will need a valid National Identification Number (NIN), a working phone number linked to your identity, and to pass our automated live facial and skill verification checks."
    },
    {
      question: "When do I get paid?",
      answer: "Payments are processed securely via our Paystack escrow system immediately following client job confirmation and approval."
    }
  ]

  return (
    <div className="bg-bone font-sans antialiased text-midnight">

      <Navbar />

      <section className="bg-bone pt-24 min-h-[60vh] flex flex-col justify-start items-left px-6 py-16 text-left font-sans antialiased text-midnight">
        <div className="max-w-xl mx-auto flex flex-col items-center">

          {/* Main Heading with split color accents */}
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight leading-[1.15] mb-6 max-w-md">
            Turn your skills into a <span className="text-midnight">verified</span>{' '}
            <span className="text-gold">professional identity.</span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="text-slate text-base md:text-lg font-normal leading-relaxed mb-10 max-w-sm">
            Plugr doesn't promise you jobs. It gives you the edge to earn them.
          </p>

          {/* Action Buttons Stack */}
          <div className="w-full sm:w-auto flex flex-col gap-3 min-w-[280px] sm:min-w-[340px]">
            {/* Primary CTA Button */}
            <Link
              href="/become-a-plug"
              className="w-full bg-gold text-midnight font-bold py-4 px-8 rounded-full shadow-sm hover:bg-gold/95 transition-all text-center border border-transparent"
            >
              Become a Plug
            </Link>

            {/* Secondary Outline Button */}
            <Link
              href="/how-it-works"
              className="w-full bg-transparent text-midnight font-bold py-4 px-8 rounded-full border border-midnight hover:bg-midnight/5 transition-all text-center"
            >
              How it works
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION: Features / Built for the modern artisan */}
      <section className="max-w-xl mx-auto px-6 pt-16 pb-12">
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-8 leading-tight">
          Built for the modern<br />artisan.
        </h2>

        <div className="space-y-6">
          {/* Card 1: Verified Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-xl font-bold mb-2">Verified Status</h3>
            <p className="text-slate text-sm leading-relaxed">
              Get the badge that earns trust. Stand out as a verified professional in Ikeja.
            </p>
          </div>

          {/* Card 2: Direct Payments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-xl font-bold mb-2">Direct Payments</h3>
            <p className="text-slate text-sm leading-relaxed">
              No more chasing clients. Paystack escrow ensures you get paid securely and on time.
            </p>
          </div>

          {/* Card 3: Earning History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-xl font-bold mb-2">Earning History</h3>
            <p className="text-slate text-sm leading-relaxed">
              Track your growth and build a strong financial record with every completed job.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: Onboarding Journey Steps */}
      <section className="max-w-xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-10 leading-tight">
          Your journey to<br />becoming a Plug.
        </h2>

        <div className="relative border-l-2 border-gold/30 ml-3 pl-8 space-y-10">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Timeline Bullet Node */}
              <div className="absolute left-[43px] top-1 bg-gold text-midnight text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-bone">
                {step.num}
              </div>
              <h3 className="text-lg font-black tracking-tight mb-1">{step.num}. {step.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Frequently Asked Questions */}
      <section className="max-w-xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-8">
          Frequently Asked<br />Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/50"
              >
                <span className="font-bold text-sm md:text-base text-midnight">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gold transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Accordion Collapse/Expand container */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? 'max-h-40 border-t border-slate-100' : 'max-h-0'
                  }`}
              >
                <div className="p-5 text-sm text-slate leading-relaxed bg-slate-50/30">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Final CTA Banner */}
      <section className="max-w-xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-6">
          Pledging allegiance<br />to your success.
        </h2>
        <Link
          href="/become-a-plug"
          className="inline-block bg-gold text-midnight font-bold px-8 py-3.5 rounded-full shadow-md hover:bg-gold/90 transition-all transform active:scale-95"
        >
          Become a Plug
        </Link>
      </section>

      <Footer />

    </div>
  )
}