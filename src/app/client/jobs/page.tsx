import Link from 'next/link'
import { Navbar } from '@/src/components/Navbar'
import { MobileNav } from '@/src/components/MobileNav'
import { Clock, CheckCircle2, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export default function ClientJobsPage() {
  const jobs = [
    { 
      id: '1', 
      plugName: "Suleiman Yusuf", 
      trade: "Electrician", 
      status: "In Progress", 
      amount: "₦12,500", 
      date: "Oct 24, 2023",
      type: "Repair" 
    },
    { 
      id: '2', 
      plugName: "John Okoro", 
      trade: "Plumber", 
      status: "Waiting for Quote", 
      amount: "₦2,500 deposit", 
      date: "Oct 23, 2023",
      type: "Diagnostic" 
    }
  ]

  const history = [
    { 
      id: '3', 
      plugName: "Tunde Williams", 
      trade: "Electrician", 
      status: "Completed", 
      amount: "₦8,000", 
      date: "Oct 15, 2023" 
    }
  ]

  return (
    <main className="flex flex-col min-h-screen bg-bone pb-24">
      <Navbar />
      
      <div className="px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-display text-midnight mb-8">My Jobs</h1>

        {/* Active Jobs Section */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">Active Requests</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-card p-5 shadow-sm border border-bone relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-midnight/5 rounded-full flex items-center justify-center font-bold text-midnight">
                      {job.plugName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-midnight">{job.plugName}</h4>
                      <p className="text-[10px] text-slate font-medium">{job.trade} • {job.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-bone">
                  <div className="text-sm font-bold text-midnight">{job.amount}</div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-bone text-slate hover:text-gold transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <Link href={`/client/track/${job.id}`} className="bg-midnight text-white px-4 py-2 rounded-pill text-xs font-bold hover:bg-gold hover:text-midnight transition-colors flex items-center">
                      Track Status
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">Past Jobs</h2>
          <div className="bg-white rounded-card shadow-sm border border-bone divide-y divide-bone">
            {history.map((job) => (
              <Link key={job.id} href={`/client/track/${job.id}`} className="p-4 flex items-center justify-between hover:bg-bone/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-bold text-sm text-midnight">{job.plugName}</h4>
                    <p className="text-[10px] text-slate">{job.date} • {job.amount}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <MobileNav role="client" />
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isWaiting = status.toLowerCase().includes('waiting')
  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
      isWaiting ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
    )}>
      {status}
    </div>
  )
}
