'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/src/components/Footer';
import {
  CheckCircle2,
  ChevronRight,
  Star,
  MapPin,
  ShieldCheck,
  Lock,
  Zap,
  Droplet,
  UserCheck,
  Clock,
  DollarSign,
  Award,
  Search,
  Mail,
  Phone,
  Menu,
  X,
} from 'lucide-react';
import { PlugCard, Plug } from '@/src/components/PlugCard';
import { FaWhatsapp } from 'react-icons/fa';

// Common colors based on screenshots
const colors = {
  midnightblue: '#0F1F3D',
  deepblue: '#162952',
  gold: '#E8A020',
  lightGold: '#F5C86A',
  ink: '1A1A1F',
  slate: '#8A9DB0',
  bone: '#F5F1EC',
  steelBlue: '#7A9CC8',
  white: '#FFFFFF',
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.bone }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#F5F1EC]">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Plugr Logo" width={120} height={60} />
        </Link>
        <div className="hidden md:flex flex-row items-center gap-12 text-sm font-semibold text-[#0A1529]">
          <Link href="#how-it-works" className="hover:text-[#DBA134] transition-colors">How it Works</Link>
          <Link href="#trades" className="hover:text-[#DBA134] transition-colors">Trades</Link>
          <Link href="#faq" className="hover:text-[#DBA134] transition-colors">FAQ</Link>
          <div className="flex flex-row items-center gap-6 text-sm font-semibold text-[#0A1529] ml-24">
            <Link href="/auth/login" className="text-[#DBA134] px-6 py-3 rounded-full hover:text-[#DBA134] hover:bg-[#0A1529]/90 transition-colors">Log in</Link>
            <Link href="/become-a-plug" className="bg-[#DBA134] text-white px-6 py-3 rounded-full hover:text-[#DBA134] hover:bg-[#0A1529]/90 transition-colors">Become a Plug</Link>
          </div>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-[#0A1529]" /> : <Menu className="w-6 h-6 text-[#0A1529]" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed top-[73px] right-0 bottom-0 w-[280px] z-40 h-fit rounded-3xl bg-white/50 backdrop-blur-md md:hidden flex flex-col p-6 gap-2 border-l border-gray-100 shadow-2xl animate-in slide-in-from-top-10 duration-1000">
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">How it Works</Link>
          <Link href="#trades" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Trades</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">FAQ</Link>
          <Link href="/find" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Find a Plug</Link>
          <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
            <Link href="/auth/login" className="w-full py-4 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold">Log in</Link>
            <Link href="/become-a-plug" className="w-full py-4 text-center bg-[#DBA134] text-white rounded-full font-bold">Become a Plug</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-left" style={{ backgroundColor: colors.bone }}>
        <div className="space-y-6 pt-10 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF] text-[#162952] text-xs font-bold uppercase tracking-widest border-[#DBA134]">
            <span className="w-2 h-2 rounded-full bg-[#F5C86A] animate-pulse" />
            Verified Plugs in Lagos
          </div>
          <h1 className="text-[32px] font-bold md:text-7xl font-black text-[#162952]">
            Hire Verified Artisans you can actually <br></br>
            <span className="text-[#DBA134]">trust.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto font-medium">
            Plugr helps clients connect with verified artisans, across Ikeja using secure payments, proffessional identity verification and whatsapp-native job flow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/find" className="w-full sm:w-auto px-10 py-5 bg-[#DBA134] text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-yellow-900/20 text-center">
              Find a Plug
            </Link>
            <Link href="/become-a-plug" className="w-full sm:w-auto px-10 py-5 bg-white text-[#0A1529] rounded-full font-bold text-lg hover:bg-gray-100 transition-colors text-center">
              Become a Plug
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">

            {/* NIN Verified */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <UserCheck className="w-5 h-5 text-[#E8A020]" />
              </div>
              <span className="text-[13px] md:text-sm font-semibold text-[#0F1F3D] whitespace-nowrap">
                NIN Verified
              </span>
            </div>

            {/* Escrow Protected */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <Lock className="w-5 h-5 text-[#E8A020]" />
              </div>
              <span className="text-[13px] md:text-sm font-semibold text-[#0F1F3D] whitespace-nowrap">
                Escrow Protected
              </span>
            </div>

            {/* Rated & Reviewed */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <Star className="w-5 h-5 text-[#E8A020]" />
              </div>
              <span className="text-[13px] md:text-sm font-semibold text-[#0F1F3D] whitespace-nowrap">
                Rated & Reviewed
              </span>
            </div>

            {/* WhatsApp Features */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <FaWhatsapp className="w-5 h-5 text-[#E8A020]" />
              </div>
              <span className="text-[13px] md:text-sm font-semibold text-[#0F1F3D] whitespace-nowrap">
                WhatsApp Features
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto bg-white">
        <div className="mb-16">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">How it works</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter max-w-md leading-none">
            Three steps to a job done right.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              id: '01',
              title: "Find a Verified Plug",
              description: "Browse by trade, see badge and rating."
            },
            {
              id: '02',
              title: "Book and Pay Safely",
              description: "Job confirmed, payment secured in escrow."
            },
            {
              id: '03',
              title: "Job Done, You're Protected",
              description: "Release payment when satisfied, 24hr dispute window."
            }
          ].map((step) => (
            <div key={step.id} className="group cursor-default flex flex-row gap-4 items-left">
              <div className="text-2xl font-black text-[#0A1529] mb-6 group-hover:text-[#DBA134] transition-colors bg-[#F5F1EC] rounded-full px-4 py-2 w-14 h-14 flex justify-center items-center flex-row-1">
                {step.id}
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-[#0A1529] mb-2">{step.title}</h3>
                <p className="text-gray-500 font-medium text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Built Different */}
      <section className="py-15 px-6 bg-[#F5F1EC] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">Why Plugr</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4 text-[#162952]">
              Built Different.
            </h2>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4 text-[#162952]">
              Whatsapp Layered.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: '01',
                title: "Your Money Is Protected",
                description: "Payments are held in escrow until you're happy."
              },
              {
                id: '02',
                title: "Vetted Experts Only",
                description: "Strict NIN, BVN, and liveness verification for every artisan."
              },
              {
                id: '03',
                title: "Something Goes Wrong?",
                description: "24hr dispute window and dedicated ops support."
              },
              {
                id: '04',
                title: "Guaranteed Quality",
                description: "Every job comes with a 30-day fault guarantee."
              },
              {
                id: '05',
                title: "Transparent Pricing",
                description: "Full quote before work starts. Zero surprises."
              }
            ].map((feature) => (
              <div key={feature.id} className="p-8 rounded-3xl border hover:border-[#DBA134]/50 transition-colors bg-white">
                <div className="text-[#DBA134] font-medium mb-4">{feature.id}</div>
                <h3 className="text-xl font-bold mb-2 text-[#162952]">{feature.title}</h3>
                <p className="text-gray-400 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div><br /><br />
        <div className='text-left'>
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">Why it matters.</span>
          <h2 className="text-4xl md:text-3xl font-semibold leading-none mb-4 text-[#162952]">
            Skilled workers <br /> deserve a <br /> professional identity.
          </h2>
          <p className="text-[#123076] text-sm mb-6 max-w-3xl w-2/3">Plugr transforms artisans from anaonymous contacts into trusted professionals with visible identity, ratings, and verifiied work history.</p>
        </div>
      </section>

      {/* Trades Section */}
      <section id="trades" className="py-10 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">What we fix</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter leading-none">
            Your trade, covered.
          </h2>
        </div>

        <div className="w-full flex md:flex-row flex-col gap-6">
          <div className="w-full p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-6 group-hover:bg-yellow-400 transition-colors">
              <Zap className="w-7 h-7 text-yellow-600 group-hover:text-white" fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A1529] mb-2">Electrician</h3>
            <p className="text-gray-500 font-medium mb-6">Wiring, sockets, faults, lighting, and general electrical maintenance.</p>
            <Link href="/find" className="flex items-center gap-2 text-[#DBA134] font-bold">
              Find an Electrician <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="w-full p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-400 transition-colors">
              <Droplet className="w-7 h-7 text-blue-600 group-hover:text-white" fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A1529] mb-2">Plumber</h3>
            <p className="text-gray-500 font-medium mb-6">Pipes, leaks, fixtures, water heaters, and drainage solutions.</p>
            <Link href="/find" className="flex items-center gap-2 text-[#DBA134] font-bold">
              Find a Plumber <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-center mt-5 text-gray-400 font-bold uppercase text-xs tracking-widest">More trades coming soon</p>
      </section>

      {/* Featured Plugs */}
      <section className="py-15 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* 1. Moved text to left by changing text-center to text-left */}
          <div className="text-left mb-16">
            <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">
              Meet the plugs
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter leading-none mb-4">
              Real people. Verified.
            </h2>
          </div>

          {/* 2. Added pt-6 to prevent badge clipping and flex-nowrap to force horizontal layout */}
          <div className="no-scrollbarsnap-x snap-mandatory w-full flex overflow-x-auto gap-8 pb-4 no-scrollbar">
            {([
              { id: '1', name: "Suleiman Yusuf", trade: "Electrician", rating: 4.8, reviewCount: 28, status: "Busy", badge: "Verified" },
              { id: '2', name: "John Okoro", trade: "Plumber", rating: 4.9, reviewCount: 45, status: "Available", badge: "Pro" },
              { id: '3', name: "Tunde Williams", trade: "Electrician", rating: 4.7, reviewCount: 19, status: "Busy", badge: "Verified" },
            ] as Plug[]).map((plug) => (
              <PlugCard key={plug.id} plug={plug} />
            ))}

            {/* Remember to remove 'hidden' if you want it to show up in the scroll list */}
            <Link href="/find" className="flex shrink-0 min-w-[200px] items-center justify-center p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 group hover:border-[#DBA134] transition-colors cursor-pointer">
              <div className="text-center font-bold">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#F8E8C1]">
                  <ChevronRight className="w-6 h-6" />
                </div>
                Browse All Plugs
              </div>
            </Link>
          </div>
        </div>
      </section>


      <div className='w-full p-8 bg-white'>
        <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">FOR CLIENTS</span>
        <h2 className="text-3xl md:text-4xl font-black leading-none mb-6 text-[#162952]">
          No more random artisan referrals.
        </h2>
        <p className="text-[#123076] text-md mb-6 max-w-3xl w-full flex items-center gap-2 px-4"><span className="font-bold text-[#162952] bg-[#DBA134] rounded-full w-8 h-8 flex items-center justify-center px-4">1</span><span> Hire verified electricians and plumbers</span></p>
        <p className="text-[#123076] text-md mb-6 max-w-3xl w-full flex items-center gap-2 px-4"><span className="font-bold text-[#162952] bg-[#DBA134] rounded-full w-8 h-8 flex items-center justify-center px-4">2</span><span> Track payments securely</span></p>
        <p className="text-[#123076] text-md mb-6 max-w-3xl w-full flex items-center gap-2 px-4"><span className="font-bold text-[#162952] bg-[#DBA134] rounded-full w-8 h-8 flex items-center justify-center px-4">3</span><span> Get quote transparency</span></p>
        <p className="text-[#123076] text-md mb-6 max-w-3xl w-full flex items-center gap-2 px-4"><span className="font-bold text-[#162952] bg-[#DBA134] rounded-full w-8 h-8 flex items-center justify-center px-4">4</span><span> Raise disputes when necessary</span></p>

        <Link href="/find" className="bg-[#DBA134] text-[#162952] w-full text-center p-6 rounded-full font-bold inline-block ">Find a Plug</Link>
      </div>

      {/* Become a Plug CTA */}
      <section className="py-24 px-6 bg-[#0A1529] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">For Professionals</span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6 text-[#DBA134]">
            Join the Plugs.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium mb-12">
            Build a reputation clients can trust.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: <DollarSign />, label: "Set Your Own Price" },
              { icon: <UserCheck />, label: "Build Your Identity" },
              { icon: <Clock />, label: "Get Consistent Work" },
              { icon: <ShieldCheck />, label: "Get Paid Safely" }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#DBA134]">
                  {benefit.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{benefit.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 max-w-sm mx-auto text-left mb-12">
            {[
              "Sign up",
              "Complete verification",
              "Set up profile",
              "Start receiving jobs"
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#DBA134] text-[#0A1529] flex items-center justify-center text-xs font-black">{i + 1}</div>
                <span className="font-bold">{step}</span>
              </div>
            ))}
          </div>

          <Link href="/become-a-plug" className="inline-block text-center w-full px-10 py-6 bg-[#DBA134] text-white rounded-full font-bold text-xl hover:scale-105 transition-transform">
            Become a Plug
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-left mb-16">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter">
            Common Questions.
          </h2>
        </div>

        <div className="space-y-4">
          {[
            "How do I pay?",
            "What if I'm not satisfied?",
            "How are Plugs verified?"
          ].map((q, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 flex justify-between items-center group cursor-pointer hover:border-[#DBA134] transition-colors">
              <span className="font-bold text-[#0A1529]">{q}</span>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#DBA134] group-hover:rotate-90 transition-all" />
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-gray-50 border border-gray-200 text-center">
          <p className="font-bold text-[#0A1529] mb-4">Still have questions? We're happy to help.</p>
          <button className="px-8 py-4 bg-[#DBA134] text-white rounded-full font-bold">
            Contact Support
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-white text-center border-t border-gray-100">
        <h2 className="text-5xl md:text-7xl font-black text-[#0A1529] tracking-tighter mb-4">
          Ready to find <br /> your Plug?
        </h2>
        <p className="text-gray-500 font-bold mb-12">Ikeja, Lagos.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/find" className="w-full sm:w-auto px-12 py-5 bg-[#DBA134] text-white rounded-full font-bold text-lg text-center">
            Find a Plug
          </Link>
          <Link href="/become-a-plug" className="w-full sm:w-auto px-12 py-5 bg-white border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold text-lg text-center">
            Become a Plug
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
