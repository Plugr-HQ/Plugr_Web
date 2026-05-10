'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Bell,
  Menu,
  X
} from 'lucide-react';

// Common colors based on screenshots
const colors = {
  navy: '#0A1529',
  gold: '#DBA134',
  lightGold: '#F8E8C1',
  cream: '#F9F6F0',
  white: '#FFFFFF',
  grey: '#64748B',
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.white }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Plugr Logo" width={32} height={32} />
          <span className="text-2xl font-black tracking-tighter text-[#0A1529]">plugr</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#0A1529]">
          <Link href="#how-it-works" className="hover:text-[#DBA134] transition-colors">How it Works</Link>
          <Link href="#trades" className="hover:text-[#DBA134] transition-colors">Trades</Link>
          <Link href="#faq" className="hover:text-[#DBA134] transition-colors">FAQ</Link>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-[#0A1529]" /> : <Menu className="w-6 h-6 text-[#0A1529]" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[73px] z-40 bg-white md:hidden flex flex-col p-6 space-y-6">
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">How it Works</Link>
          <Link href="#trades" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Trades</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">FAQ</Link>
          <Link href="/find" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Find a Plug</Link>
          <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
            <Link href="/auth" className="w-full py-4 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold">Log in</Link>
            <Link href="/become-a-plug" className="w-full py-4 text-center bg-[#DBA134] text-white rounded-full font-bold">Become a Plug</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center" style={{ backgroundColor: colors.navy }}>
        <div className="space-y-6 pt-10 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            100+ Verified Plugs in Lagos
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Home services, <br />
            <span className="text-[#DBA134]">done right.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto font-medium">
            Get connected to trusted, verified electricians and plumbers for your home and property needs — people you can actually trust.
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
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-[#0A1529]">NIN Verified</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-bold text-[#0A1529]">Escrow Protected</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm font-bold text-[#0A1529]">Rated & Reviewed</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-bold text-[#0A1529]">Ikeja, Lagos</span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
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
            <div key={step.id} className="group cursor-default">
              <div className="text-4xl font-black text-gray-200 mb-6 group-hover:text-[#DBA134] transition-colors">
                {step.id}
              </div>
              <h3 className="text-xl font-bold text-[#0A1529] mb-2">{step.title}</h3>
              <p className="text-gray-500 font-medium">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Built Different */}
      <section className="py-24 px-6 bg-[#F5F1EC] text-white">
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
              <div key={feature.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#DBA134]/50 transition-colors">
                <div className="text-[#DBA134] font-bold mb-4">{feature.id}</div>
                <h3 className="text-xl font-bold mb-2 text-[#162952]">{feature.title}</h3>
                <p className="text-gray-400 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades Section */}
      <section id="trades" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">What we fix</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter leading-none">
            Your trade, covered.
          </h2>
        </div>

        <div className="flex flex-row gap-6">
          <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-6 group-hover:bg-yellow-400 transition-colors">
              <Zap className="w-7 h-7 text-yellow-600 group-hover:text-white" fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A1529] mb-2">Electrician</h3>
            <p className="text-gray-500 font-medium mb-6">Wiring, sockets, faults, lighting, and general electrical maintenance.</p>
            <Link href="/find" className="flex items-center gap-2 text-[#DBA134] font-bold">
              Find an Electrician <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
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

        <p className="text-center mt-12 text-gray-400 font-bold uppercase text-xs tracking-widest">More trades coming soon</p>
      </section>

      {/* Featured Plugs */}
      <section className="py-24 px-6 bg-white flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">Meet the plugs</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter leading-none mb-4">
              Real people. Verified.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                id: "1",
                name: "Obi Nwosu",
                trade: "Electrician",
                rating: 4.9,
                img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Obi"
              },
              {
                id: "2",
                name: "Amaka Okafor",
                trade: "Plumber",
                rating: 4.8,
                img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amaka"
              }
            ].map((plug) => (
              <Link key={plug.id} href={`/p/${plug.id}`} className="relative group block cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="absolute -top-4 right-4 z-10 px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest">
                  Available Now
                </div>
                <div className="p-8 rounded-[2.5rem] bg-[#F9F6F0] border border-gray-100 flex flex-col items-center text-center group-hover:border-[#DBA134] transition-colors">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-white shadow-lg bg-white">
                    <img src={plug.img} alt={plug.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-2xl font-black text-[#0A1529] mb-1">{plug.name}</h4>
                  <p className="text-gray-500 font-bold text-sm mb-4">{plug.trade}</p>
                  <div className="flex items-center gap-4 w-full pt-4 border-t border-gray-200">
                    <div className="flex-1 flex items-center gap-1 text-green-600 font-black text-xs uppercase">
                      <CheckCircle2 className="w-4 h-4" /> Verified
                    </div>
                    <div className="flex items-center gap-1 font-black text-[#0A1529]">
                      <Star className="w-4 h-4 text-orange-400" fill="currentColor" /> {plug.rating}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            <Link href="/find" className="hidden lg:flex items-center justify-center p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 group hover:border-[#DBA134] hover:text-[#DBA134] transition-colors cursor-pointer">
              <div className="text-center font-bold">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#F8E8C1] transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
                Browse all Plugs
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">What clients say</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A1529] tracking-tighter leading-none">
              Don't just take <br /> our word for it.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-orange-400" fill="currentColor" />)}
              </div>
              <p className="text-lg font-medium text-[#0A1529] mb-6 italic leading-relaxed">
                "Finally, a platform where I can find real artisans who don't disappear with my money. The escrow feature is a lifesaver."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">C</div>
                <div>
                  <div className="font-black text-[#0A1529]">Chidi A.</div>
                  <div className="text-xs text-gray-500 font-bold">Gbagada</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-orange-400" fill="currentColor" />)}
              </div>
              <p className="text-lg font-medium text-[#0A1529] mb-6 italic leading-relaxed">
                "Obi was super professional. Fixed my wiring issue in an hour and cleaned up afterwards. Will definitely use Plugr again."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">S</div>
                <div>
                  <div className="font-black text-[#0A1529]">Sarah O.</div>
                  <div className="text-xs text-gray-500 font-bold">Ikeja</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Plug CTA */}
      <section className="py-24 px-6 bg-[#0A1529] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#DBA134] font-bold text-sm tracking-widest uppercase mb-4 block">For Professionals</span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">
            Join the Plugs.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium mb-12">
            Grow your business with Plugr. Flexible work, on your terms.
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
        <div className="text-center mb-16">
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

        <div className="mt-12 p-8 rounded-3xl bg-[#F8E8C1]/30 border border-[#F8E8C1] text-center">
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
      <footer className="bg-[#0A1529] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image src="/logo.svg" alt="Plugr Logo" width={32} height={32} className="brightness-0 invert" />
              <span className="text-2xl font-black tracking-tighter">plugr</span>
            </Link>
            <p className="text-gray-400 font-medium max-w-sm mb-8">
              Pledging allegiance to your success. The trusted network for verified artisans in Lagos.
            </p>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <Bell className="w-5 h-5 text-[#DBA134]" />
            </div>
          </div>

          <section className="flex flex-row gap-14">
            <div>
              <h5 className="uppercase text-xs tracking-widest text-[white] mb-6 font-bold">Quick Links</h5>
              <ul className="space-y-4 font-medium text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="/find" className="hover:text-white transition-colors">Find a Plug</Link></li>
                <li><Link href="/become-a-plug" className="hover:text-white transition-colors">Become a Plug</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="uppercase text-xs tracking-widest text-[white] mb-6 font-bold">Legal</h5>
              <ul className="space-y-4 font-medium text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Dispute Policy</Link></li>
              </ul>
            </div>
          </section>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <span>&copy; 2026 Plugr Technologies Limited. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
