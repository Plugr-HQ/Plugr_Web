'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: string
  stars: number
  comment: string
  author: string
  location: string
}

interface PlugProfile {
  id: string
  firstName: string
  lastName: string
  trade: string
  city: string
  phone: string
  photoUrl: string
  nin: string
  ninVerified: boolean
  livenessVerified: boolean
}

export default function PlugProfileDetails() {
  const [plugProfile, setPlugProfile] = useState<PlugProfile | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('plugProfile')
      if (raw) setPlugProfile(JSON.parse(raw))
    } catch {
      // ignore parse errors
    }
  }, [])

  const displayName = plugProfile
    ? `${plugProfile.firstName} ${plugProfile.lastName}`
    : 'Oluwaseun Adewale'

  const displayTrade = plugProfile
    ? plugProfile.trade.charAt(0).toUpperCase() + plugProfile.trade.slice(1)
    : 'Master Electrician'

  const displayCity = plugProfile?.city || 'Lagos'
  const displayPhone = plugProfile?.phone || ''

  const avatarSrc = plugProfile?.photoUrl || ''

  const displayAbout = plugProfile
    ? `${plugProfile.firstName} is a verified ${plugProfile.trade} based in ${plugProfile.city}, Nigeria. Plugr-verified with confirmed identity, liveness check, and NIN validation. Available for residential and commercial jobs.`
    : 'Over 8 years of experience in residential and commercial electrical systems across Yaba and mainland Lagos. Specializing in fault finding, smart home integrations, and safe solar panel installations.'

  const skills = [
    "Fault Finding",
    "House Wiring",
    "Solar Installation",
    "Inverter Repairs"
  ]

  const reviews: Review[] = [
    {
      id: "1",
      stars: 5,
      comment: "Seun fixed our inverter issue in record time. Very professional and tidy.",
      author: "Chidinma O.",
      location: "Yaba"
    },
    {
      id: "2",
      stars: 4,
      comment: "Great work on the house wiring, though he arrived a bit later than scheduled.",
      author: "Kunle A.",
      location: "Maryland"
    }
  ]
  const verifications = [
    "Phone OTP",
    "Liveness Confirmed",
    "NIN verified",
    "Skills Assessed"
  ]

  return (
    <div className="bg-bone min-h-screen font-sans antialiased text-midnight pb-32">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* --- CENTERING WRAPPER FOR PROFILE HEADER --- */}
        <div className="flex flex-col items-center text-center pt-4 pb-2">

          {/* Profile Avatar Wrapper */}
          <div className="relative w-32 h-32 mb-5">
            {/* Main User Image */}
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent bg-gradient-to-b from-orange-400 to-amber-600 relative shadow-inner">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-black">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* Absolute Overlapping Verification Seal Badge */}
            <div className="absolute bottom-1 right-1 bg-gold text-midnight w-7 h-7 rounded-full flex items-center justify-center shadow-md ring-4 ring-bone">
              <ShieldCheck className="w-4 h-4 fill-midnight text-gold stroke-[2.5]" />
            </div>
          </div>

          {/* Profile Details Name & Title */}
          <h2 className="text-xl font-black tracking-tight text-midnight mb-1">
            {displayName}
          </h2>
          <p className="text-slate/70 font-medium text-base mb-1">
            {displayTrade}
          </p>
          {/* City */}
          <p className="flex items-center justify-center gap-1 text-xs text-slate/50 font-medium mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {displayCity}, Nigeria
          </p>

          {/* Meta Status Badges Line */}
          <div className="flex items-center justify-center gap-3">
            {/* Status Pill Indicator */}
            <div className="inline-flex items-center gap-1.5 bg-[#E2F5EC] text-[#0D7A4A] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#0D7A4A] animate-pulse" />
              Available Now
            </div>

            {/* Stars & Reviews Metadata */}
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="w-4 h-4 fill-gold text-gold" />
              <span className="font-black text-midnight">4.9</span>
              <span className="text-slate/50 font-medium">(42 reviews)</span>
            </div>
          </div>

        </div>
        {/* --- END PROFILE HEADER --- */}

        {/* CARD 1: About Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50">
          <h4 className="text-xs font-black tracking-widest text-gold uppercase mb-3">
            About
          </h4>
          <p className="text-sm md:text-base font-normal text-midnight leading-relaxed">
            {displayAbout}
          </p>
        </div>

        {/* CARD 2: Verified Identity Checklist */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50">
          <h4 className="text-xs font-black tracking-widest text-gold uppercase mb-5">
            Verified Identity
          </h4>

          <ul className="space-y-4">
            {verifications.map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold fill-gold stroke-white" />
                <span className="text-sm md:text-base font-medium text-midnight">
                  {item}
                </span>
              </li>
            ))}
            {/* Phone number row */}
            {displayPhone && (
              <li className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span className="text-sm font-medium text-midnight font-mono tracking-wide">{displayPhone}</span>
              </li>
            )}
          </ul>
        </div>

        {/* CARD CONTAINER: Skills & Ratings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-8">

          {/* SECTION: Skills & Services */}
          <div>
            <h4 className="text-xs font-black tracking-widest text-gold uppercase mb-4">
              Skills & Services
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-bone text-midnight font-medium text-sm rounded-full border border-slate-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* SECTION: Ratings & Reviews */}
          <div>
            <h4 className="text-xs font-black tracking-widest text-gold uppercase mb-4">
              Ratings
            </h4>
            <div className="space-y-6">
              {reviews.map((review, idx) => (
                <div key={review.id} className="space-y-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.stars
                          ? "fill-gold text-gold"
                          : "text-slate/20"
                          }`}
                      />
                    ))}
                  </div>

                  <p className="text-midnight text-sm md:text-base font-medium leading-relaxed">
                    "{review.comment}"
                  </p>

                  <p className="text-slate text-xs font-medium">
                    — {review.author}, {review.location}
                  </p>

                  {idx < reviews.length - 1 && (
                    <hr className="border-slate-100 pt-2 mt-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION STACK */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4">
          <button className="w-full bg-gold hover:bg-gold/95 active:scale-[0.99] text-midnight font-bold py-4 px-6 rounded-full shadow-md flex items-center justify-center gap-2 transition-all">
            <MessageSquare className="w-5 h-5 fill-midnight text-midnight" />
            <span>Request This Plug</span>
          </button>

          <p className="text-sm text-slate font-medium">
            Are you an artisan?{' '}
            <Link href="/become-a-plug" className="text-gold font-bold hover:underline">
              Become a Plug
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}