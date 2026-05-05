import { Navbar } from '@/src/components/Navbar'
import { Footer } from '@/src/components/Footer'
import { Button } from '@/src/components/Button'
import { Shield, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react'

export default function BecomeAPlugPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-midnight pt-16 pb-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display text-white mb-6 leading-tight">
            Build your <span className="text-gold">professional identity</span>.
          </h1>
          <p className="text-steel-blue text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Plugr doesn't promise you jobs. It gives you the edge to earn them. Join the most trusted artisan network in Ikeja.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button href="/auth/phone?role=plug" className="md:w-64">Register as a Plug</Button>
            <Button variant="outline" href="/onboarding/plug/verify" className="md:w-64">Learn about verification</Button>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: "Verified Identity", desc: "Get a verified professional badge that signals trust to every client." },
              { icon: Wallet, title: "Secure Payments", desc: "Never chase clients for money again. Get paid into your secure wallet." },
              { icon: TrendingUp, title: "Track Growth", desc: "See your ratings grow and unlock more opportunities as a Pro Plug." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-bone rounded-full flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-midnight mb-3">{item.title}</h3>
                <p className="text-slate">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-bone py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-display text-midnight mb-8 text-center md:text-left">3 Steps to get verified</h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Sign Up & Profile", desc: "Create your account and tell us briefly about your trade and experience." },
                  { step: "02", title: "Identity Check", desc: "Upload your NIN and complete a quick liveness scan. We keep it 100% secure." },
                  { step: "03", title: "Final Review", desc: "Once approved, your profile goes live and you can start accepting requests." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-gold font-display font-bold text-2xl">{item.step}</span>
                    <div>
                      <h4 className="font-bold text-midnight mb-1">{item.title}</h4>
                      <p className="text-slate text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center md:text-left">
                <Button href="/auth/phone?role=plug" className="md:w-64">Get Started Now</Button>
              </div>
            </div>
            <div className="flex-1 bg-midnight rounded-card p-8 text-white relative overflow-hidden hidden md:block">
               {/* Visual representation of a verified profile card */}
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center font-display font-bold text-2xl">SY</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">Suleiman Yusuf</span>
                        <div className="bg-gold text-midnight text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">VERIFIED</div>
                      </div>
                      <span className="text-steel-blue">Expert Electrician</span>
                    </div>
                 </div>
                 <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                      <span>NIN Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                      <span>BVN Linked</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                      <span>Liveness Verified</span>
                    </div>
                 </div>
               </div>
               <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-midnight py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <blockquote className="text-2xl md:text-4xl font-display text-white italic mb-8">
            "Plugr gives me the credibility I need to get work from serious clients in Ikeja. The verified badge is a game changer."
          </blockquote>
          <div className="text-gold font-bold">— Tunde Williams, Electrician</div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
