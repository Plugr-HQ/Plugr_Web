import { Navbar } from '@/src/components/Navbar'
import { Button } from '@/src/components/Button'
import { ShieldCheck, Info, CreditCard } from 'lucide-react'

export default function PaymentPage() {
  const jobSummary = {
    plugName: "Suleiman Yusuf",
    trade: "Electrician",
    task: "Faulty DB Board Diagnosis",
    fee: 2500,
    platformFee: 0, // Included for now
    total: 2500
  }

  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />
      
      <div className="max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-3xl font-display text-midnight mb-2">Secure Payment</h1>
        <p className="text-slate mb-8">Pay the Visit Deposit to confirm your booking.</p>

        {/* Escrow Badge */}
        <div className="bg-gold/10 border border-gold/20 rounded-card p-4 flex gap-3 mb-8">
           <ShieldCheck className="w-6 h-6 text-gold flex-shrink-0" />
           <div className="text-xs text-midnight leading-relaxed">
             <span className="font-bold">Escrow Protected:</span> Funds are held safely and only released when you confirm the job is done.
           </div>
        </div>

        {/* Job Summary */}
        <div className="bg-white rounded-card shadow-sm border border-bone p-6 mb-8">
           <h3 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">Job Summary</h3>
           <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-midnight">{jobSummary.task}</span>
                <span className="text-sm font-bold text-midnight">₦{jobSummary.fee}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-bone">
                <span className="text-sm font-bold text-midnight">Total to Pay</span>
                <span className="text-lg font-display text-gold">₦{jobSummary.total}</span>
              </div>
           </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-10">
           <div className="bg-white border-2 border-gold rounded-card p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                 <CreditCard className="w-5 h-5 text-midnight" />
                 <span className="font-bold text-midnight">Pay via Paystack</span>
              </div>
              <div className="w-4 h-4 rounded-full border-4 border-gold" />
           </div>
           <div className="flex items-center gap-2 text-[10px] text-slate px-2">
              <Info className="w-3 h-3" />
              <span>You will be redirected to Paystack's secure portal</span>
           </div>
        </div>

        <a href="/client/track/1">
          <Button fullWidth className="h-14">Pay Now</Button>
        </a>
      </div>
    </main>
  )
}
