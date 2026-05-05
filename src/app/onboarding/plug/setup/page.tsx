import { Button } from '@/src/components/Button'

export default function PlugSetupPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone px-6 py-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1 flex-grow bg-gold rounded-full" />
          <div className="h-1 flex-grow bg-bone border border-slate/10 rounded-full" />
          <div className="h-1 flex-grow bg-bone border border-slate/10 rounded-full" />
        </div>

        <h1 className="text-3xl font-display text-midnight mb-2">Create your Plug profile</h1>
        <p className="text-slate mb-8">Tell us about your trade and experience.</p>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Suleiman Yusuf" 
              className="w-full h-12 bg-white rounded-card border border-bone px-4 text-midnight font-sans focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Select Trade</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="h-12 rounded-card border-2 border-gold bg-gold/5 flex items-center justify-center font-bold text-midnight">
                Electrician
              </button>
              <button type="button" className="h-12 rounded-card border border-slate/10 bg-white flex items-center justify-center font-bold text-slate hover:border-gold/50">
                Plumber
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Years of Experience</label>
            <select className="w-full h-12 bg-white rounded-card border border-bone px-4 text-midnight font-sans focus:outline-none focus:ring-2 focus:ring-gold appearance-none">
              <option>1-3 years</option>
              <option>4-7 years</option>
              <option>8+ years</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Short Bio</label>
            <textarea 
              placeholder="Tell clients why they should hire you..." 
              className="w-full h-32 bg-white rounded-card border border-bone p-4 text-midnight font-sans focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
          </div>

          <div className="pt-4">
               <Button href="/onboarding/plug/verify" fullWidth>Continue</Button>
          </div>
        </form>
      </div>
    </main>
  )
}
