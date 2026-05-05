import { Navbar } from '@/src/components/Navbar'
import { MobileNav } from '@/src/components/MobileNav'
import { Briefcase, Clock, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react'

export default function PlugDashboardPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone pb-24">
      <Navbar />
      
      {/* Welcome Header */}
      <div className="bg-midnight pt-8 pb-16 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display">Hello, Suleiman</h1>
              <p className="text-steel-blue text-sm">Welcome back to your office.</p>
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-pill px-3 py-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-[10px] font-bold text-gold uppercase">Available</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-deep-blue rounded-card p-4 border border-white/5">
                <div className="text-steel-blue text-xs mb-1">Total Earnings</div>
                <div className="text-xl font-display text-white">₦142,500</div>
             </div>
             <div className="bg-deep-blue rounded-card p-4 border border-white/5">
                <div className="text-steel-blue text-xs mb-1">Jobs Completed</div>
                <div className="text-xl font-display text-white">24</div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-8">
        {/* Verification Status (if not full) */}
        <div className="bg-white rounded-card p-4 shadow-sm flex items-center gap-4 border border-amber-100 mb-6">
           <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <AlertCircle className="w-6 h-6" />
           </div>
           <div className="flex-grow">
              <h4 className="font-bold text-midnight text-sm">Verification Under Review</h4>
              <p className="text-xs text-slate">Some features are locked while we review your NIN.</p>
           </div>
           <ChevronRight className="w-4 h-4 text-slate" />
        </div>

        {/* Active Jobs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate uppercase tracking-widest">Active Jobs</h2>
            <span className="text-xs text-gold font-bold">See all</span>
          </div>
          
          <div className="bg-white rounded-card p-5 shadow-sm border border-bone">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-bone rounded-full flex items-center justify-center font-bold text-midnight">FA</div>
                   <div>
                      <h4 className="font-bold text-midnight">Funke Adebayo</h4>
                      <p className="text-[10px] text-slate font-medium">Faulty DB Board • Ikeja GRA</p>
                   </div>
                </div>
                <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">IN PROGRESS</div>
             </div>
             <div className="flex items-center justify-between py-3 border-t border-bone">
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate uppercase">Payout</span>
                   <span className="text-sm font-bold text-midnight">₦12,500</span>
                </div>
                <button className="bg-midnight text-white px-4 py-2 rounded-pill text-xs font-bold">Update Job</button>
             </div>
          </div>
        </div>

        {/* New Requests Placeholder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate uppercase tracking-widest">New Requests</h2>
          </div>
          <div className="bg-bone border-2 border-dashed border-slate/20 rounded-card p-12 text-center">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate">
                <Clock className="w-6 h-6" />
             </div>
             <p className="text-slate text-sm font-medium">No new requests in Ikeja today.</p>
             <p className="text-[10px] text-slate mt-1">Check back later or refresh your status.</p>
          </div>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
