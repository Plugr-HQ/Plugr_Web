import { Button } from '@/src/components/Button'
import { UserCheck } from 'lucide-react'

export default function PlugGuarantorPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone px-6 py-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1 grow bg-gold rounded-full" />
          <div className="h-1 grow bg-gold rounded-full" />
          <div className="h-1 grow bg-gold rounded-full" />
        </div>

        <h1 className="text-3xl font-display text-midnight mb-2">Add a Guarantor</h1>
        <p className="text-slate mb-8">Someone who can vouch for your professional character.</p>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Guarantor Name</label>
            <input
              type="text"
              placeholder="e.g. Chief Adebayo"
              className="w-full h-12 bg-white rounded-card border border-bone px-4 text-midnight font-sans focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Relationship</label>
            <input
              type="text"
              placeholder="e.g. Former Employer, Community Leader"
              className="w-full h-12 bg-white rounded-card border border-bone px-4 text-midnight font-sans focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate uppercase tracking-wider">Phone Number</label>
            <div className="flex bg-white rounded-card border border-bone overflow-hidden h-12 items-center px-4 focus-within:ring-2 focus-within:ring-gold">
              <span className="text-midnight font-bold mr-2 text-sm">+234</span>
              <input
                type="tel"
                placeholder="801 234 5678"
                className="grow h-full bg-white text-midnight font-sans text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-bone border border-slate/10 rounded-card p-5 mt-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gold shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-midnight mb-1">What happens next?</h4>
                <p className="text-xs text-slate leading-relaxed">
                  We will send a quick verification text to your guarantor. They just need to reply to confirm.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button href="/plug/dashboard" fullWidth>Finish Application</Button>
          </div>
        </form>
      </div>
    </main>
  )
}
