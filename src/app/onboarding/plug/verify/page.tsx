import { Button } from '@/src/components/Button'
import { Camera, ShieldCheck, Fingerprint } from 'lucide-react'

export default function PlugVerifyPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone px-6 py-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1 flex-grow bg-gold rounded-full" />
          <div className="h-1 flex-grow bg-gold rounded-full" />
          <div className="h-1 flex-grow bg-bone border border-slate/10 rounded-full" />
        </div>

        <h1 className="text-3xl font-display text-midnight mb-2">Verify your identity</h1>
        <p className="text-slate mb-8">This helps us build a trusted platform for everyone.</p>

        <div className="space-y-4 mb-10">
          {/* NIN Entry */}
          <div className="bg-white rounded-card p-5 border border-bone relative overflow-hidden group hover:border-gold transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-bone rounded-full flex items-center justify-center text-midnight group-hover:bg-gold transition-colors">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-midnight mb-1">Enter NIN</h3>
                <p className="text-xs text-slate mb-4">Your 11-digit National Identity Number.</p>
                <input 
                  type="number" 
                  placeholder="000 000 000 00" 
                  className="w-full h-10 bg-bone rounded-pill px-4 text-midnight font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </div>

          {/* Liveness Check */}
          <div className="bg-white rounded-card p-5 border border-bone relative overflow-hidden group hover:border-gold transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-bone rounded-full flex items-center justify-center text-midnight group-hover:bg-gold transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-midnight mb-1">Liveness Scan</h3>
                <p className="text-xs text-slate mb-4">A quick 3-second face scan to verify it's you.</p>
                <button className="flex items-center justify-center gap-2 w-full h-10 bg-midnight text-white rounded-pill text-xs font-bold hover:bg-midnight/90">
                  <Camera className="w-4 h-4" />
                  Start Scan
                </button>
              </div>
            </div>
            <div className="absolute right-4 top-4">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Ready to scan" />
            </div>
          </div>
        </div>

        <div className="bg-gold/10 rounded-card p-4 flex gap-3 mb-10 border border-gold/20">
          <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
          <p className="text-xs text-midnight/80 leading-relaxed">
            Your data is encrypted and strictly used for verification. We never share your personal ID with clients.
          </p>
        </div>

        <a href="/onboarding/plug/guarantor" className="block">
          <Button fullWidth>Continue to Guarantor</Button>
        </a>
      </div>
    </main>
  )
}
