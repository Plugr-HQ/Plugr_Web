import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import { Button } from '@/src/components/Button'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'

export default function PublicProfilePage() {
  // Mock data for a single plug
  const plug = {
    name: "Suleiman Yusuf",
    trade: "Electrician",
    rating: 4.8,
    reviews: 24,
    status: "Verified",
    badge: "Verified",
    bio: "Senior Electrician with over 8 years of experience in residential and commercial wiring. Specialist in solar installations and inverter systems.",
    location: "Ikeja, Lagos",
    experience: "8 years",
    completedJobs: 142
  }

  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />

      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-card shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-bone rounded-full flex items-center justify-center font-display font-bold text-3xl text-midnight shrink-0">
              SY
            </div>
            <div className="grow">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-display text-midnight">{plug.name}</h1>
                <div className="bg-gold text-midnight text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  {plug.badge}
                </div>
              </div>
              <p className="text-slate text-lg mb-4">{plug.trade}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-gold text-gold" />
                  <span className="font-bold text-midnight">{plug.rating}</span>
                  <span className="text-slate text-sm">({plug.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate">
                  <MapPin className="w-4 h-4" />
                  <span>{plug.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-bone rounded-card">
                  <div className="text-xs text-slate mb-1">Experience</div>
                  <div className="font-bold text-midnight">{plug.experience}</div>
                </div>
                <div className="p-3 bg-bone rounded-card">
                  <div className="text-xs text-slate mb-1">Jobs Done</div>
                  <div className="font-bold text-midnight">{plug.completedJobs}</div>
                </div>
                <div className="p-3 bg-bone rounded-card hidden lg:block">
                  <div className="text-xs text-slate mb-1">Response Time</div>
                  <div className="font-bold text-midnight">&lt; 2 hours</div>
                </div>
              </div>

              <h2 className="font-bold text-midnight mb-2">About</h2>
              <p className="text-slate leading-relaxed mb-8">
                {plug.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Stack */}
        <div className="bg-white rounded-card shadow-sm p-6 mb-6">
          <h2 className="font-bold text-midnight mb-4">Verification Stack</h2>
          <div className="space-y-4">
            {[
              { label: "NIN Verified", status: true },
              { label: "Liveness Check", status: true },
              { label: "BVN Linked", status: true },
              { label: "Phone Number Verified", status: true },
              { label: "Skills Assessment", status: true }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                <span className="text-midnight font-medium">{item.label}</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews (Placeholder) */}
        <div className="bg-white rounded-card shadow-sm p-6">
          <h2 className="font-bold text-midnight mb-6">Recent Reviews</h2>
          <div className="space-y-8">
            {[1, 2].map((_, i) => (
              <div key={i} className="border-b border-bone last:border-0 pb-6 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <Star className="w-3 h-3 fill-gold text-gold" />
                  </div>
                  <span className="text-xs text-slate">Oct 2023</span>
                </div>
                <p className="text-midnight text-sm mb-2">"Great work. Suleiman fixed my faulty DB board quickly and explained what was wrong. Very professional."</p>
                <span className="text-xs text-slate font-bold">— Funke A.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Booking Bar (Mobile only is done with md:relative patterns) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-bone md:relative md:bg-transparent md:border-0 md:max-w-4xl md:mx-auto md:px-0 md:pb-12">
        <Button href="/client/pay" fullWidth className="h-14 md:h-12">Request this Plug</Button>
      </div>

      <Footer />
    </main>
  )
}
