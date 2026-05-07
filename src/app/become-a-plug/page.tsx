"use client";

import { motion } from "motion/react";
import {
  ShieldCheck,
  CreditCard,
  TrendingUp,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Phone,
  UserCheck,
  Zap
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <main className="min-h-screen bg-dark overflow-x-hidden">
      <Navbar />
      <Hero />
      <BrandsSection />
      <Features />
      <Journey />
      <Stats />
      <FAQ />
      <FooterCTA />
      <Footer />
    </main>
  );
}

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
          <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Image src="/logo.svg" alt="Plugr Logo" width={24} height={24} className="brightness-0 invert" />
            plugr
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="hover:text-white transition-colors">How it works</button>
          <Link href="/" className="hover:text-white transition-colors">Safety</Link>
          <Link href="/" className="hover:text-white transition-colors">Support</Link>
        </div>
        <Link href="/auth" className="text-sm font-semibold text-primary hover:text-white transition-colors underline underline-offset-4">
          Log in
        </Link>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] z-40 bg-dark md:hidden flex flex-col p-6 space-y-6 text-white border-t border-white/10">
          <button onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }); }} className="text-xl font-bold text-left">How it works</button>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold">Safety</Link>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold">Support</Link>
          <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
            <Link href="/auth" className="w-full py-4 text-center border border-white/20 text-white rounded-full font-bold">Log in</Link>
            <Link href="/auth/phone?role=plug" className="w-full py-4 text-center bg-primary text-dark rounded-full font-bold">Register as a Plug</Link>
          </div>
        </div>
      )}
    </>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-16 pb-24 bg-dark text-white text-center md:text-left flex flex-col md:flex-row items-center max-w-7xl mx-auto">
      <div className="flex-1 space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] font-display"
        >
          Turn your <br />
          skills into a <br />
          <span className="text-white">verified professional identity.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-white/70 max-w-lg mx-auto md:mx-0 font-medium"
        >
          Plugr doesn't promise you jobs. It gives you the edge to earn them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 max-w-xs mx-auto md:mx-0 pt-4"
        >
          <Link href="/auth/phone?role=plug" className="text-center bg-primary text-dark py-4 px-8 rounded-full font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20">
            Register as a Plug
          </Link>
          <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="border border-white/20 bg-transparent text-white py-4 px-8 rounded-full font-bold text-lg hover:bg-white/5 transition-all">
            How it works
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function BrandsSection() {
  return (
    <section className="bg-white py-14 px-6 border-b border-dark/5">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
        <h3 className="text-dark/40 text-[10px] font-black uppercase tracking-[0.2em]">Built for the modern artisan</h3>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 grayscale opacity-40">
          <div className="text-2xl font-black text-dark tracking-tighter italic">PAYSTACK</div>
          <div className="text-2xl font-black text-dark tracking-tighter">STERLING</div>
          <div className="text-2xl font-black text-dark tracking-tighter italic underline decoration-primary underline-offset-4">IKEJA.GOV</div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Verified Status",
      desc: "Get the badge that earns trust. Stand out as a verified professional in Ikeja.",
      icon: <ShieldCheck className="w-8 h-8 text-primary" />
    },
    {
      title: "Direct Payments",
      desc: "No more chasing clients. Paystack escrow ensures you get paid securely and on time.",
      icon: <CreditCard className="w-8 h-8 text-primary" />
    },
    {
      title: "Earning History",
      desc: "Track your growth and build a strong financial record with every completed job.",
      icon: <TrendingUp className="w-8 h-8 text-primary" />
    }
  ];

  return (
    <section className="bg-white py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-20 tracking-tight font-display">Built for the modern artisan.</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="p-12 bg-[#FAFAFA] rounded-4xl border border-dark/5 space-y-8"
            >
              <div className="bg-white w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center border border-dark/5">
                {f.icon}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-dark font-display">{f.title}</h3>
                <p className="text-dark/60 leading-relaxed font-semibold text-[1.05rem]">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journey() {
  const steps = [
    {
      id: 1,
      title: "Sign up with your phone",
      desc: "Create your account instantly using your phone number.",
    },
    {
      id: 2,
      title: "Submit NIN and BVN",
      desc: "Securely verify your identity to ensure community safety.",
    },
    {
      id: 3,
      title: "Liveness and Skills check",
      desc: "Complete a quick face verification and list your expertise.",
    },
    {
      id: 4,
      title: "Set up your profile and go live",
      desc: "Add your best work and start receiving booking requests.",
    }
  ];

  return (
    <section className="bg-white py-28 px-6 border-t border-dark/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-24 tracking-tight font-display">Your journey to <br /> becoming a Plug.</h2>

        <div className="space-y-0 relative max-w-2xl">
          <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-primary/30" />

          {steps.map((s, i) => (
            <div key={i} className="flex gap-10 pb-20 last:pb-0 relative">
              <div className="w-8 h-8 rounded-full bg-primary text-dark flex items-center justify-center relative z-10 shrink-0 font-black text-sm">
                {s.id}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-dark font-display">{s.id}. {s.title}</h3>
                <p className="text-dark/60 max-w-md font-semibold leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-white py-28 px-6 border-t border-dark/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-20 tracking-tight font-display max-w-2xl">Join the top 1% of Ikeja's tradesmen.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-2">
            <div className="text-6xl font-black text-dark tracking-tighter">1,200+</div>
            <div className="text-xs font-black text-dark/40 uppercase tracking-[0.2em]">PLUGS</div>
          </div>
          <div className="space-y-2">
            <div className="text-6xl font-black text-dark tracking-tighter">4.8/5</div>
            <div className="text-xs font-black text-dark/40 uppercase tracking-[0.2em]">AVG RATING</div>
          </div>
          <div className="space-y-2">
            <div className="text-6xl font-black text-dark tracking-tighter">₦2.5M+</div>
            <div className="text-xs font-black text-dark/40 uppercase tracking-[0.2em]">PAID OUT</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What are the fees?", a: "We take a small commission on successful bookings to maintain the platform and insurance." },
    { q: "How do I get verified?", a: "Verification requires NIN/BVN check and a brief review of your previously completed works." },
    { q: "When do I get paid?", a: "Payments are settled into your linked bank account within 24-48 hours of job completion." }
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-24 px-6 border-t border-dark/5">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-dark mb-12 tracking-tight text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-dark/10">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className="text-lg font-bold text-dark group-hover:text-primary transition-colors">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-dark transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                <p className="text-dark/60 font-medium leading-relaxed">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="bg-dark py-32 px-6 text-center text-white border-t border-white/5">
      <div className="max-w-4xl mx-auto space-y-12">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Pledging allegiance to your success.</h2>
        <Link href="/auth/phone?role=plug" className="inline-block text-center bg-primary text-dark py-5 px-12 rounded-full font-bold text-xl hover:scale-105 transition-transform">
          Become a Plug today
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-dark py-16 px-6 text-white/50 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <h3 className="text-white text-2xl font-bold tracking-tight">The Plug</h3>
          <p className="max-w-xs text-sm font-medium">© 2024 The Artisan's Ledger. All rights reserved. Crafted for Excellence.</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-bold uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/" className="hover:text-white transition-colors">Safety Guide</Link>
            <Link href="/" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 text-xs font-bold uppercase tracking-widest text-white/30 pt-4 border-t border-white/5">
          <Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-white transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}
