import { Navbar } from '@/src/components/Navbar'
import { MobileNav } from '@/src/components/MobileNav'
import { CheckCircle2, Clock, MapPin, Phone, MessageSquare } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export default function ActiveJobTracker() {
  const steps = [
    { label: "Payment Confirmed", status: "complete", time: "10:30 AM" },
    { label: "Plug Dispatched", status: "active", time: "10:45 AM" },
    { label: "Diagnosis & Quote", status: "pending", time: null },
    { label: "Repair in Progress", status: "pending", time: null },
    { label: "Job Complete", status: "pending", time: null }
  ]

  return (
    <main className="flex flex-col min-h-screen bg-bone pb-24">
      <Navbar />

      <div className="bg-midnight pt-8 pb-16 px-6 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center font-display font-bold text-2xl text-gold">
               SY
            </div>
            <div>
              <h1 className="text-xl font-bold">Suleiman is on his way</h1>
              <p className="text-steel-blue text-sm">Arriving in approx. 15 mins</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button className="flex-1 bg-white/10 border border-white/20 py-2 rounded-pill flex items-center justify-center gap-2 text-xs font-bold">
                <Phone className="w-4 h-4 text-gold" /> Call
             </button>
             <button className="flex-1 bg-white/10 border border-white/20 py-2 rounded-pill flex items-center justify-center gap-2 text-xs font-bold">
                <MessageSquare className="w-4 h-4 text-gold" /> Message
             </button>
          </div>
        </div>
        <div className="absolute -right-10 top-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-6">
        <div className="bg-white rounded-card shadow-lg p-6 border border-bone mb-8">
           <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-6">Live Status</h2>
           
           <div className="space-y-8 relative">
              {/* Vertical line connector */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-bone" />
              
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white",
                    step.status === 'complete' ? "border-green-500 bg-green-500" :
                    step.status === 'active' ? "border-gold" : "border-bone"
                  )}>
                    {step.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {step.status === 'active' && <div className="w-2 h-2 rounded-full bg-gold animate-ping" />}
                  </div>
                  <div className="flex-grow">
                    <h4 className={cn(
                      "font-bold text-sm",
                      step.status === 'pending' ? "text-slate" : "text-midnight"
                    )}>
                      {step.label}
                    </h4>
                    {step.time && <p className="text-[10px] text-slate">{step.time}</p>}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Location Info */}
        <div className="bg-bone rounded-card p-4 flex items-start gap-4 border border-slate/10">
           <MapPin className="w-5 h-5 text-slate shrink-0" />
           <div>
              <h4 className="text-xs font-bold text-midnight uppercase tracking-tight">Meeting Point</h4>
              <p className="text-sm text-slate">12, Allen Avenue, Ikeja, Lagos</p>
           </div>
        </div>
      </div>

      <MobileNav role="client" />
    </main>
  )
}
