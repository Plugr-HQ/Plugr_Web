"use client";

import { motion } from "motion/react";
import { CheckCircle2, Star, Zap, ShieldCheck, UserCheck, Key, UserPlus } from "lucide-react";

export default function Home() {
  const skills = [
    "Fault Finding",
    "House Wiring",
    "Solar Installation",
    "Inverter Repairs"
  ];

  const reviews = [
    {
      text: "Seun fixed our inverter issue in record time. Very professional and tidy.",
      author: "Chidinma O.",
      location: "Ikeja"
    },
    {
      text: "Great work on the house wiring, though he arrived a bit later than scheduled.",
      author: "Kunle A.",
      location: "Maryland"
    }
  ];

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden bg-[#FFFBF2] text-[#2D2A26] font-sans antialiased">
      {/* Header / Status Bar */}
      <header className="p-6 flex justify-between items-center bg-[#FFFBF2]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-800">Available Now</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white py-1 px-3 rounded-full shadow-sm border border-[#F8F4EA]">
          <Star className="w-4 h-4 text-[#CA8A04] fill-[#CA8A04]" />
          <span className="text-sm font-bold">4.9</span>
          <span className="text-xs text-slate-500 font-medium">(42 reviews)</span>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Profile Intro */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-[#F8F4EA] border-2 border-[#CA8A04]/20 overflow-hidden">
               <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <UserPlus className="w-8 h-8 text-slate-400" />
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#CA8A04] rounded-lg p-1 text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-[#2D2A26]">Seun Adeyemi</h1>
            <p className="text-[#CA8A04] font-medium">Master Electrician • Ikeja, Lagos</p>
          </div>
        </motion.section>

        {/* About Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">About</h2>
          <div className="bg-white p-6 rounded-2xl border border-[#F8F4EA] shadow-sm">
            <p className="text-[#2D2A26]/80 leading-relaxed font-medium">
              Over 8 years of experience in residential and commercial electrical systems across Ikeja and mainland Lagos. Specializing in fault finding, smart home integrations, and safe solar panel installations.
            </p>
          </div>
        </section>

        {/* Verified Identity */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Verified Identity</h2>
          <div className="bg-white p-6 rounded-2xl border border-[#F8F4EA] shadow-sm space-y-4">
            <VerificationItem icon={<ShieldCheck className="w-5 h-5" />} label="NIN Verified" />
            <VerificationItem icon={<UserCheck className="w-5 h-5" />} label="Liveness Confirmed" />
            <VerificationItem icon={<Key className="w-5 h-5" />} label="BVN Linked" />
            <VerificationItem icon={<CheckCircle2 className="w-5 h-5" />} label="Guarantor Approved" />
          </div>
        </section>

        {/* Skills & Services */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Skills & Services</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <SkillPill key={skill} label={skill} />
            ))}
          </div>
        </section>

        {/* Ratings */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Ratings</h2>
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[#F8F4EA] shadow-sm italic relative">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#CA8A04] fill-[#CA8A04]" />
                  ))}
                </div>
                <p className="text-[#2D2A26]/90 leading-relaxed mb-3">"{review.text}"</p>
                <p className="text-xs not-italic font-bold text-slate-400">— {review.author}, {review.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Link */}
        <footer className="text-center py-8">
           <p className="text-sm text-slate-400 font-medium tracking-tight">
             Are you an artisan? <a href="#" className="text-[#CA8A04] font-bold hover:underline">Become a Plug</a>
           </p>
        </footer>
      </main>

      {/* CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#FFFBF2]/80 backdrop-blur-md border-t border-[#F8F4EA] max-w-md mx-auto">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#CA8A04] text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-[#CA8A04]/20"
        >
          <Zap className="w-5 h-5 fill-white" />
          Request This Plug
        </motion.button>
      </div>
    </div>
  );
}

function VerificationItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">
        {icon}
      </div>
      <span className="text-[#2D2A26] font-semibold">{label}</span>
      <div className="ml-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-3 h-3 text-white" />
      </div>
    </div>
  );
}

function SkillPill({ label }: { label: string }) {
  return (
    <div className="bg-[#F8F4EA] px-5 py-3 rounded-full border border-[#2D2A26]/5 text-[#2D2A26]/80 font-semibold text-sm hover:border-[#CA8A04]/30 transition-colors cursor-default">
      {label}
    </div>
  );
}
